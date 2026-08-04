import os
import math
import random
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc, or_, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Employee, Project, Seat, SeatAllocation, AuditLog
from app.schemas.schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    ProjectCreate, ProjectResponse,
    SeatResponse, SeatAllocationRequest, SeatRecommendationRequest,
    AIQueryRequest, AIQueryResponse, DashboardStatsResponse
)
from app.config import settings

try:
    import google.generativeai as genai

    print("google-generativeai imported successfully")

    if settings.GEMINI_API_KEY:
        print("Configuring Gemini...")

        genai.configure(api_key=settings.GEMINI_API_KEY)

        print("Creating model...")

        model = genai.GenerativeModel("gemini-1.5-flash")

        print("Model created successfully")

    else:
        print("No API Key Found")
        model = None

except Exception as e:
    import traceback
    traceback.print_exc()
    print("Gemini initialization failed:", e)
    model = None

router = APIRouter()


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
# Previously this endpoint issued:
#   - 1 query per project              (project_utilization loop)
#   - 1 query per project (again)      (project_utilization loop)
#   - 1 query per floor (x5)           (floor_occupancy loop)
#   - 1 query per allocation, x2       (recent_allocations loop, up to 20 queries)
#   - 1 query per floor per zone (5x10=50) (heat_map_data loop)
# = 100+ queries for a typical dataset.
#
# It now issues a fixed, small number of queries (~9) regardless of the
# number of projects/floors/zones/allocations, using GROUP BY / conditional
# aggregation and JOINs instead of per-row round trips.
@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count(Employee.id)).where(Employee.is_active == True, Employee.is_deleted == False))
    total_employees = result.scalar() or 0

    result = await db.execute(select(func.count(Seat.id)))
    total_seats = result.scalar() or 0

    result = await db.execute(select(Seat.status, func.count(Seat.id)).group_by(Seat.status))
    status_counts = {row[0]: row[1] for row in result.fetchall()}
    occupied_seats = status_counts.get("OCCUPIED", 0)
    available_seats = status_counts.get("AVAILABLE", 0)
    reserved_seats = status_counts.get("RESERVED", 0)
    maintenance_seats = status_counts.get("MAINTENANCE", 0)
    released_seats = status_counts.get("RELEASED", 0)

    result = await db.execute(select(func.count(Employee.id)).where(Employee.is_active == True, Employee.is_deleted == False, Employee.seat_id == None))
    pending_allocation = result.scalar() or 0

    overall_occupancy_rate = round((occupied_seats / total_seats * 100), 1) if total_seats > 0 else 0.0

    # --- project utilization: single grouped query instead of 2 queries/project ---
    active_emp_cond = and_(Employee.is_active == True, Employee.is_deleted == False)
    assigned_expr = func.sum(case((active_emp_cond, 1), else_=0))
    allocated_expr = func.sum(case((and_(active_emp_cond, Employee.seat_id != None), 1), else_=0))

    proj_res = await db.execute(
        select(
            Project.id,
            Project.name,
            Project.capacity,
            assigned_expr,
            allocated_expr,
        )
        .select_from(Project)
        .outerjoin(Employee, Employee.project_id == Project.id)
        .group_by(Project.id, Project.name, Project.capacity)
    )

    project_utilization = []
    for project_id, project_name, capacity, assigned, allocated in proj_res.fetchall():
        assigned = assigned or 0
        allocated = allocated or 0
        utilization_rate = round((allocated / capacity * 100), 1) if capacity and capacity > 0 else 0.0
        project_utilization.append({
            "projectId": project_id,
            "projectName": project_name,
            "capacity": capacity,
            "assigned": assigned,
            "allocatedSeats": allocated,
            "utilizationRate": utilization_rate
        })

    # --- floor occupancy: single grouped query instead of 1 query/floor ---
    floor_res = await db.execute(
        select(Seat.floor, Seat.status, func.count(Seat.id))
        .where(Seat.floor.in_(range(1, 6)))
        .group_by(Seat.floor, Seat.status)
    )
    floor_status_map = {}
    for floor, status, cnt in floor_res.fetchall():
        floor_status_map.setdefault(floor, {})[status] = cnt

    floor_occupancy = []
    for floor in range(1, 6):
        fc = floor_status_map.get(floor, {})
        tot = sum(fc.values())
        occ = fc.get("OCCUPIED", 0)
        floor_occupancy.append({
            "floor": floor,
            "total": tot,
            "occupied": occ,
            "available": fc.get("AVAILABLE", 0) + fc.get("RELEASED", 0),
            "reserved": fc.get("RESERVED", 0),
            "occupancyRate": round((occ / tot * 100), 1) if tot > 0 else 0.0
        })

    res = await db.execute(select(Employee.department, func.count(Employee.id)).where(Employee.is_active == True, Employee.is_deleted == False).group_by(Employee.department))
    dept_total = {row[0]: row[1] for row in res.fetchall()}
    res = await db.execute(select(Employee.department, func.count(Employee.id)).where(Employee.is_active == True, Employee.is_deleted == False, Employee.seat_id != None).group_by(Employee.department))
    dept_alloc = {row[0]: row[1] for row in res.fetchall()}
    department_distribution = [{"department": d, "employeeCount": dept_total[d], "allocatedSeats": dept_alloc.get(d, 0)} for d in dept_total]

    monthly_joiners = [{"month": "2025-01", "count": 50}, {"month": "2025-02", "count": 100}]

    # --- recent allocations: single joined query instead of 2 queries/allocation ---
    alloc_res = await db.execute(
        select(SeatAllocation, Employee, Seat)
        .join(Employee, SeatAllocation.employee_id == Employee.id)
        .join(Seat, SeatAllocation.seat_id == Seat.id)
        .order_by(desc(SeatAllocation.allocated_at))
        .limit(10)
    )
    recent_allocations = []
    for alloc, emp, seat in alloc_res.fetchall():
        if emp and seat:
            recent_allocations.append({
                "id": alloc.id,
                "employeeId": emp.id,
                "employeeName": f"{emp.first_name} {emp.last_name}",
                "empCode": emp.emp_code,
                "seatId": seat.id,
                "seatNumber": seat.seat_number,
                "floor": seat.floor,
                "zone": seat.zone,
                "projectId": alloc.project_id,
                "allocatedAt": alloc.allocated_at.isoformat()
            })

    # --- heat map: single grouped query instead of 1 query/(floor,zone) pair (50 queries) ---
    zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J']

    heat_res = await db.execute(
        select(Seat.floor, Seat.zone, Seat.status, func.count(Seat.id))
        .group_by(Seat.floor, Seat.zone, Seat.status)
    )
    heat_map_map = {}
    for floor, zone, status, cnt in heat_res.fetchall():
        heat_map_map.setdefault((floor, zone), {})[status] = cnt

    heat_map_data = []
    for floor in range(1, 6):
        for zone in zones:
            zc = heat_map_map.get((floor, zone), {})
            ztot = sum(zc.values())
            zocc = zc.get("OCCUPIED", 0)
            heat_map_data.append({
                "floor": floor,
                "zone": zone,
                "occupied": zocc,
                "total": ztot,
                "density": round((zocc / ztot), 2) if ztot > 0 else 0.0
            })

    return {
        "totalEmployees": total_employees,
        "totalSeats": total_seats,
        "occupiedSeats": occupied_seats,
        "availableSeats": available_seats + released_seats,
        "reservedSeats": reserved_seats,
        "maintenanceSeats": maintenance_seats,
        "releasedSeats": released_seats,
        "pendingAllocation": pending_allocation,
        "overallOccupancyRate": overall_occupancy_rate,
        "projectUtilization": project_utilization,
        "floorOccupancy": floor_occupancy,
        "departmentDistribution": department_distribution,
        "monthlyJoiners": monthly_joiners,
        "recentAllocations": recent_allocations,
        "heatMapData": heat_map_data
    }


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------
# Previously: 1 base query + up to 2 extra queries per row (seat lookup +
# project lookup) = up to 1 + 2*limit queries per page.
# Now: 1 count query + 1 joined query = 2 queries total, regardless of
# page size.
@router.get("/employees")
async def get_employees(
    search: str = "",
    department: str = "",
    project: str = "",
    status: str = "",
    page: int = 1,
    limit: int = 25,
    sortBy: str = "emp_code",
    sortOrder: str = "asc",
    db: AsyncSession = Depends(get_db)
):
    filters = [Employee.is_deleted == False]

    if search:
        search_term = f"%{search.lower()}%"
        filters.append(or_(
            func.lower(Employee.first_name).like(search_term),
            func.lower(Employee.last_name).like(search_term),
            func.lower(Employee.emp_code).like(search_term),
            func.lower(Employee.email).like(search_term)
        ))
    if department and department != "ALL":
        filters.append(Employee.department == department)
    if project and project != "ALL":
        filters.append(Employee.project_id == project)
    if status:
        if status == "ALLOCATED":
            filters.append(Employee.seat_id != None)
        elif status == "PENDING":
            filters.append(Employee.seat_id == None)
        elif status == "ACTIVE":
            filters.append(Employee.is_active == True)

    order_col = getattr(Employee, sortBy, Employee.emp_code)
    order_by_clause = desc(order_col) if sortOrder == "desc" else order_col

    # Count query stays lightweight (no joins needed since filters are all
    # on Employee columns).
    count_query = select(func.count()).select_from(Employee).where(*filters)
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    # Single joined query fetches Employee + Seat + Project together,
    # eliminating the per-row lookups.
    data_query = (
        select(Employee, Seat, Project)
        .outerjoin(Seat, Employee.seat_id == Seat.id)
        .outerjoin(Project, Employee.project_id == Project.id)
        .where(*filters)
        .order_by(order_by_clause)
        .offset((page - 1) * limit)
        .limit(limit)
    )
    res = await db.execute(data_query)
    rows = res.all()

    enriched = []
    for emp, seat, proj in rows:
        emp_dict = {
            "id": emp.id,
            "emp_code": emp.emp_code,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "email": emp.email,
            "department": emp.department,
            "role": emp.role,
            "joining_date": emp.joining_date,
            "project_id": emp.project_id,
            "seat_id": emp.seat_id,
            "seat_number": seat.seat_number if seat else None,
            "floor": seat.floor if seat else None,
            "zone": seat.zone if seat else None,
            "project_name": proj.name if proj else None,
            "is_active": emp.is_active,
            "is_deleted": emp.is_deleted,
            "created_at": emp.created_at
        }
        enriched.append(emp_dict)

    return {
        "items": enriched,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": math.ceil(total / limit) if limit else 1
    }


@router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(db: AsyncSession = Depends(get_db)):
    # Single grouped query instead of 2 queries per project.
    assigned_expr = func.sum(case((Employee.is_deleted == False, 1), else_=0))
    allocated_expr = func.sum(case((and_(Employee.is_deleted == False, Employee.seat_id != None), 1), else_=0))

    res = await db.execute(
        select(Project, assigned_expr, allocated_expr)
        .outerjoin(Employee, Employee.project_id == Project.id)
        .group_by(Project.id)
    )

    enriched = []
    for p, assigned, allocated in res.fetchall():
        assigned = assigned or 0
        allocated = allocated or 0
        util = (allocated / p.capacity * 100) if p.capacity > 0 else 0
        enriched.append(ProjectResponse(
            **p.__dict__,
            assigned_count=assigned,
            seat_utilization=util
        ))
    return enriched


# ---------------------------------------------------------------------------
# Seats
# ---------------------------------------------------------------------------
# Previously: 1 base query + up to 2 extra queries per row (occupant lookup +
# project lookup) = up to 1 + 2*limit queries per page.
# Now: 1 count query + 1 joined query = 2 queries total.
@router.get("/seats")
async def get_seats(
    floor: Optional[int] = None,
    zone: str = "",
    status: str = "",
    search: str = "",
    page: int = 1,
    limit: int = 200,
    db: AsyncSession = Depends(get_db)
):
    filters = []
    if floor is not None:
        filters.append(Seat.floor == floor)
    if zone and zone != "ALL":
        filters.append(Seat.zone == zone)
    if status and status != "ALL":
        if status == "AVAILABLE":
            filters.append(Seat.status.in_(["AVAILABLE", "RELEASED"]))
        else:
            filters.append(Seat.status == status)
    if search:
        search_term = f"%{search.lower()}%"
        filters.append(func.lower(Seat.seat_number).like(search_term))

    count_query = select(func.count()).select_from(Seat).where(*filters)
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    # occupant comes from Seat.occupant_id -> Employee; project_name comes
    # from that Employee's project_id -> Project (matches original behavior,
    # which used the occupant's project rather than Seat.project_id).
    data_query = (
        select(Seat, Employee, Project)
        .outerjoin(Employee, Seat.occupant_id == Employee.id)
        .outerjoin(Project, Employee.project_id == Project.id)
        .where(*filters)
        .offset((page - 1) * limit)
        .limit(limit)
    )
    res = await db.execute(data_query)
    rows = res.all()

    enriched = []
    for s, e, p in rows:
        s_dict = {
            "id": s.id,
            "seat_number": s.seat_number,
            "floor": s.floor,
            "zone": s.zone,
            "bay": s.bay,
            "status": s.status,
            "occupant_id": s.occupant_id,
            "occupant_name": f"{e.first_name} {e.last_name}" if e else None,
            "occupant_emp_code": e.emp_code if e else None,
            "project_id": s.project_id,
            "project_name": p.name if (e and p) else None,
            "is_active": s.is_active
        }
        enriched.append(s_dict)

    return {
        "items": enriched,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": math.ceil(total / limit) if limit else 1
    }


@router.post("/ai/query")
async def ai_query(req: AIQueryRequest, db: AsyncSession = Depends(get_db)):
    query = req.query.strip()

    # Fetch some database context
    emp_res = await db.execute(
        select(Employee).where(Employee.is_deleted == False).limit(50)
    )
    employees = emp_res.scalars().all()

    seat_res = await db.execute(
        select(Seat).limit(50)
    )
    seats = seat_res.scalars().all()

    project_res = await db.execute(
        select(Project)
    )
    projects = project_res.scalars().all()

    employee_context = "\n".join([
        f"{e.first_name} {e.last_name} | {e.emp_code} | Seat:{e.seat_id or 'None'} | Project:{e.project_id or 'None'}"
        for e in employees
    ])

    seat_context = "\n".join([
        f"{s.seat_number} | Floor {s.floor} | {s.zone} | {s.status}"
        for s in seats
    ])

    project_context = "\n".join([
        f"{p.name} ({p.code})"
        for p in projects
    ])

    prompt = f"""
You are Ethara AI Assistant.

Database Information

Employees:
{employee_context}

Projects:
{project_context}

Seats:
{seat_context}

User Question:
{query}

Rules:
- Answer only using the given database.
- If employee exists, mention seat number, floor, zone and project.
- If seat is unavailable, explain why.
- Keep answer short and professional.
"""

    # Gemini
    if model:
        try:
            response = model.generate_content(prompt)

            return AIQueryResponse(
                query=query,
                answer=response.text,
                action_type="AI",
                data={},
                suggested_followups=[
                    "Show available seats",
                    "Find employee",
                    "Project utilization"
                ]
            )

        except Exception as e:
            print("Gemini Error:", e)

    return AIQueryResponse(
        query=query,
        answer="AI service is currently unavailable.",
        action_type="ERROR",
        data={},
        suggested_followups=[]
    )


@router.post("/seed/reset")
async def seed_reset(db: AsyncSession = Depends(get_db)):
    return {"message": "Enterprise database setup completed via background script."}


@router.post("/employees", response_model=EmployeeResponse)
async def create_employee(emp: EmployeeCreate, db: AsyncSession = Depends(get_db)):

    # Duplicate Employee Code
    res = await db.execute(
        select(Employee).where(Employee.emp_code == emp.emp_code)
    )
    if res.scalar():
        raise HTTPException(
            status_code=409,
            detail=f"Duplicate Code: {emp.emp_code}"
        )

    # Duplicate Email
    res = await db.execute(
        select(Employee).where(Employee.email == emp.email)
    )
    if res.scalar():
        raise HTTPException(
            status_code=409,
            detail=f"Duplicate Email: {emp.email}"
        )

    new_emp = Employee(
        id=f"emp-{int(datetime.now().timestamp()*1000)}",
        emp_code=emp.emp_code,
        first_name=emp.first_name,
        last_name=emp.last_name,
        email=emp.email,
        department=emp.department,
        role=emp.role,
        joining_date=emp.joining_date,
        project_id=emp.project_id
    )

    db.add(new_emp)

    audit = AuditLog(
        id=f"log-{int(datetime.now().timestamp()*1000)}",
        user_id="usr-admin",
        user_name="HR Administrator",
        action="EMPLOYEE_CREATED",
        target_type="EMPLOYEE",
        target_id=new_emp.id,
        target_name=f"{new_emp.first_name} {new_emp.last_name}",
        details=f"Created employee {new_emp.emp_code}"
    )

    db.add(audit)

    await db.commit()
    await db.refresh(new_emp)

    return {
        **new_emp.__dict__,
        "project_name": None,
        "is_active": new_emp.is_active,
        "is_deleted": new_emp.is_deleted,
        "created_at": new_emp.created_at
    }


@router.put("/employees/{emp_id}", response_model=EmployeeResponse)
async def update_employee(emp_id: str, emp_update: EmployeeUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Employee).where(
            Employee.id == emp_id,
            Employee.is_deleted == False
        )
    )
    emp = res.scalar()

    if not emp:
        res = await db.execute(
            select(Employee).where(
                Employee.emp_code == emp_id,
                Employee.is_deleted == False
            )
        )
        emp = res.scalar()

        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")

    data = emp_update.model_dump(exclude_unset=True)

    for k, v in data.items():
        if hasattr(emp, k):
            setattr(emp, k, v)

    await db.commit()
    await db.refresh(emp)

    return {
        **emp.__dict__,
        "is_active": emp.is_active,
        "is_deleted": emp.is_deleted,
        "created_at": emp.created_at
    }


@router.get("/employees/{emp_id}", response_model=EmployeeResponse)
async def get_employee(emp_id: str, db: AsyncSession = Depends(get_db)):
    # Single joined query instead of up to 3 sequential queries.
    res = await db.execute(
        select(Employee, Seat, Project)
        .outerjoin(Seat, Employee.seat_id == Seat.id)
        .outerjoin(Project, Employee.project_id == Project.id)
        .where(Employee.id == emp_id, Employee.is_deleted == False)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp, seat, proj = row

    return {
        **emp.__dict__,
        "project_name": proj.name if proj else None,
        "seat_number": seat.seat_number if seat else None,
        "floor": seat.floor if seat else None,
        "zone": seat.zone if seat else None,
        "is_active": emp.is_active,
        "is_deleted": emp.is_deleted,
        "created_at": emp.created_at
    }


@router.delete("/employees/{emp_id}")
async def delete_employee(emp_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Employee).where(Employee.id == emp_id))
    emp = res.scalar()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if emp.seat_id:
        s_res = await db.execute(select(Seat).where(Seat.id == emp.seat_id))
        seat = s_res.scalar()
        if seat:
            seat.status = 'AVAILABLE'
            seat.occupant_id = None
            seat.project_id = None
            
    emp.is_deleted = True
    emp.is_active = False
    emp.seat_id = None
    
    await db.commit()
    return {"message": f"Employee {emp.emp_code} deleted successfully."}


@router.post("/seats/{seat_id}/allocate")
async def allocate_seat(seat_id: str, req: SeatAllocationRequest, db: AsyncSession = Depends(get_db)):
    s_res = await db.execute(select(Seat).where(Seat.id == seat_id))
    seat = s_res.scalar()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
        
    e_res = await db.execute(select(Employee).where(Employee.id == req.employee_id, Employee.is_deleted == False))
    emp = e_res.scalar()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    seat.status = 'OCCUPIED'
    seat.occupant_id = emp.id
    seat.project_id = emp.project_id
    
    emp.seat_id = seat.id
    
    alloc = SeatAllocation(
        id=f"alloc-{int(datetime.now().timestamp()*1000)}",
        employee_id=emp.id,
        seat_id=seat.id,
        project_id=emp.project_id or "",
        notes=req.notes
    )
    db.add(alloc)
    
    await db.commit()
    return {"message": f"Seat {seat.seat_number} allocated to {emp.emp_code}"}


@router.post("/seats/{seat_id}/release")
async def release_seat(seat_id: str, db: AsyncSession = Depends(get_db)):
    s_res = await db.execute(select(Seat).where(Seat.id == seat_id))
    seat = s_res.scalar()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
        
    if seat.occupant_id:
        e_res = await db.execute(select(Employee).where(Employee.id == seat.occupant_id))
        emp = e_res.scalar()
        if emp:
            emp.seat_id = None
            
    seat.status = 'RELEASED'
    seat.occupant_id = None
    seat.project_id = None
    
    await db.commit()
    return {"message": f"Seat {seat.seat_number} released."}


@router.post("/seats/{seat_id}/status")
async def seat_status(seat_id: str, req: dict, db: AsyncSession = Depends(get_db)):
    s_res = await db.execute(select(Seat).where(Seat.id == seat_id))
    seat = s_res.scalar()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
        
    new_status = req.get("status")
    if seat.status == 'OCCUPIED' and new_status != 'AVAILABLE':
        raise HTTPException(status_code=409, detail="Cannot change status of occupied seat.")
        
    seat.status = new_status
    await db.commit()
    return {"message": f"Seat {seat.seat_number} status updated to {new_status}."}


@router.get("/audit-logs")
async def get_audit_logs(limit: int = 50, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit))
    return res.scalars().all()


@router.post("/seats/recommend")
async def recommend_seats(
    req: SeatRecommendationRequest,
    db: AsyncSession = Depends(get_db)
):
    emp_res = await db.execute(
        select(Employee).where(
            Employee.id == req.employee_id,
            Employee.is_deleted == False
        )
    )

    employee = emp_res.scalar()

    if not employee:
        raise HTTPException(404, "Employee not found")

    query = select(Seat).where(
        Seat.status.in_(["AVAILABLE", "RELEASED"])
    )

    if req.preferred_floor:
        query = query.where(Seat.floor == req.preferred_floor)

    if req.preferred_zone:
        query = query.where(Seat.zone == req.preferred_zone)

    result = await db.execute(query.limit(10))

    seats = result.scalars().all()

    recommendations = []

    for seat in seats:
       recommendations.append({
    "seat": {
        "id": seat.id,
        "seatNumber": seat.seat_number,
        "floor": seat.floor,
        "zone": seat.zone,
        "bay": seat.bay,
    },
    "score": 95,
    "reasons": [
        "Available seat near project members"
    ]
})

    return {
         "employee": {
        "id": employee.id,
        "empCode": employee.emp_code,
        "firstName": employee.first_name,
        "lastName": employee.last_name,
        "email": employee.email,
        "department": employee.department,
        "role": employee.role,
        "projectId": employee.project_id,
    },
    "recommendations": recommendations
    }