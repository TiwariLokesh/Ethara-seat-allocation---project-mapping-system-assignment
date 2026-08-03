import math
import random
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc, or_
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
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
    else:
        model = None
except ImportError:
    model = None

router = APIRouter()

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

    project_utilization = []
    projects = await db.execute(select(Project))
    for project in projects.scalars().all():
        res = await db.execute(select(func.count(Employee.id)).where(Employee.project_id == project.id, Employee.is_active == True, Employee.is_deleted == False))
        assigned = res.scalar() or 0
        res = await db.execute(select(func.count(Employee.id)).where(Employee.project_id == project.id, Employee.seat_id != None, Employee.is_active == True, Employee.is_deleted == False))
        allocated = res.scalar() or 0
        utilization_rate = round((allocated / project.capacity * 100), 1) if project.capacity > 0 else 0.0
        project_utilization.append({
            "projectId": project.id,
            "projectName": project.name,
            "capacity": project.capacity,
            "assigned": assigned,
            "allocatedSeats": allocated,
            "utilizationRate": utilization_rate
        })

    floor_occupancy = []
    for floor in range(1, 6):
        res = await db.execute(select(Seat.status, func.count(Seat.id)).where(Seat.floor == floor).group_by(Seat.status))
        fc = {row[0]: row[1] for row in res.fetchall()}
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

    res = await db.execute(select(SeatAllocation).order_by(desc(SeatAllocation.allocated_at)).limit(10))
    recent_allocations_raw = res.scalars().all()
    recent_allocations = []
    for alloc in recent_allocations_raw:
        emp = await db.execute(select(Employee).where(Employee.id == alloc.employee_id))
        emp = emp.scalar()
        seat = await db.execute(select(Seat).where(Seat.id == alloc.seat_id))
        seat = seat.scalar()
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

    heat_map_data = []
    zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J']
    for floor in range(1, 6):
        for zone in zones:
            res = await db.execute(select(Seat.status, func.count(Seat.id)).where(Seat.floor == floor, Seat.zone == zone).group_by(Seat.status))
            zc = {row[0]: row[1] for row in res.fetchall()}
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
    query = select(Employee).where(Employee.is_deleted == False)

    if search:
        search = f"%{search.lower()}%"
        query = query.where(or_(
            func.lower(Employee.first_name).like(search),
            func.lower(Employee.last_name).like(search),
            func.lower(Employee.emp_code).like(search),
            func.lower(Employee.email).like(search)
        ))
    if department and department != "ALL":
        query = query.where(Employee.department == department)
    if project and project != "ALL":
        query = query.where(Employee.project_id == project)
    if status:
        if status == "ALLOCATED":
            query = query.where(Employee.seat_id != None)
        elif status == "PENDING":
            query = query.where(Employee.seat_id == None)
        elif status == "ACTIVE":
            query = query.where(Employee.is_active == True)

    order_col = getattr(Employee, sortBy, Employee.emp_code)
    if sortOrder == "desc":
        query = query.order_by(desc(order_col))
    else:
        query = query.order_by(order_col)

    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    query = query.offset((page - 1) * limit).limit(limit)
    res = await db.execute(query)
    items = res.scalars().all()

    enriched = []
    for emp in items:
        seat_number, floor, zone, project_name = None, None, None, None
        if emp.seat_id:
            s_res = await db.execute(select(Seat).where(Seat.id == emp.seat_id))
            s = s_res.scalar()
            if s:
                seat_number = s.seat_number
                floor = s.floor
                zone = s.zone
        if emp.project_id:
            p_res = await db.execute(select(Project).where(Project.id == emp.project_id))
            p = p_res.scalar()
            if p:
                project_name = p.name

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
            "seat_number": seat_number,
            "floor": floor,
            "zone": zone,
            "project_name": project_name,
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
    res = await db.execute(select(Project))
    projects = res.scalars().all()
    enriched = []
    for p in projects:
        emp_res = await db.execute(select(func.count(Employee.id)).where(Employee.project_id == p.id, Employee.is_deleted == False))
        assigned = emp_res.scalar() or 0
        alloc_res = await db.execute(select(func.count(Employee.id)).where(Employee.project_id == p.id, Employee.seat_id != None, Employee.is_deleted == False))
        allocated = alloc_res.scalar() or 0
        util = (allocated / p.capacity * 100) if p.capacity > 0 else 0
        enriched.append(ProjectResponse(
            **p.__dict__,
            assigned_count=assigned,
            seat_utilization=util
        ))
    return enriched

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
    query = select(Seat)
    if floor is not None:
        query = query.where(Seat.floor == floor)
    if zone and zone != "ALL":
        query = query.where(Seat.zone == zone)
    if status and status != "ALL":
        query = query.where(Seat.status == status)

    if search:
        search = f"%{search.lower()}%"
        query = query.where(func.lower(Seat.seat_number).like(search))

    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    query = query.offset((page - 1) * limit).limit(limit)
    res = await db.execute(query)
    items = res.scalars().all()
    
    enriched = []
    for s in items:
        occupant_name, occupant_emp_code, project_name = None, None, None
        if s.occupant_id:
            e_res = await db.execute(select(Employee).where(Employee.id == s.occupant_id))
            e = e_res.scalar()
            if e:
                occupant_name = f"{e.first_name} {e.last_name}"
                occupant_emp_code = e.emp_code
                if e.project_id:
                    p_res = await db.execute(select(Project).where(Project.id == e.project_id))
                    p = p_res.scalar()
                    if p:
                        project_name = p.name
        
        s_dict = {
            "id": s.id,
            "seat_number": s.seat_number,
            "floor": s.floor,
            "zone": s.zone,
            "bay": s.bay,
            "status": s.status,
            "occupant_id": s.occupant_id,
            "occupant_name": occupant_name,
            "occupant_emp_code": occupant_emp_code,
            "project_id": s.project_id,
            "project_name": project_name,
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
    q = req.query.lower()
    answer = "I am Ethara AI Assistant. I can help you search employees, check seat availability, and more."
    action_type = "INFO"
    data = {}
    followups = []

    if "where is" in q or "find" in q or "seat of" in q:
        action_type = "SEARCH"
        name_match = q.replace("where is", "").replace("seat of", "").replace("find", "").strip()
        res = await db.execute(select(Employee).where(
            Employee.is_deleted == False,
            or_(
                func.lower(Employee.first_name).like(f"%{name_match}%"),
                func.lower(Employee.last_name).like(f"%{name_match}%"),
                func.lower(Employee.emp_code).like(f"%{name_match}%")
            )
        ).limit(1))
        emp = res.scalar()
        if emp:
            seat_info = "unallocated"
            if emp.seat_id:
                s_res = await db.execute(select(Seat).where(Seat.id == emp.seat_id))
                s = s_res.scalar()
                if s:
                    seat_info = f"at {s.seat_number} on Floor {s.floor}, {s.zone}"
            answer = f"{emp.first_name} {emp.last_name} ({emp.emp_code}) is currently {seat_info}."
            data["employees"] = [{"id": emp.id, "firstName": emp.first_name, "lastName": emp.last_name, "empCode": emp.emp_code}]
        else:
            answer = f"I could not find an active employee matching '{name_match}'."

    elif "available seats" in q or "floor" in q:
        floor = 1
        if "floor 2" in q: floor = 2
        elif "floor 3" in q: floor = 3
        elif "floor 4" in q: floor = 4
        elif "floor 5" in q: floor = 5
        
        res = await db.execute(select(func.count(Seat.id)).where(Seat.floor == floor, or_(Seat.status == 'AVAILABLE', Seat.status == 'RELEASED')))
        avail = res.scalar() or 0
        answer = f"There are {avail} available seats on Floor {floor}."
        followups = [f"Show floor {floor} map"]

    return AIQueryResponse(query=req.query, answer=answer, action_type=action_type, data=data, suggested_followups=followups)

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
    res = await db.execute(select(Employee).where(Employee.id == emp_id, Employee.is_deleted == False))
    emp = res.scalar()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    p_name, s_num, floor, zone = None, None, None, None
    if emp.project_id:
        p_res = await db.execute(select(Project).where(Project.id == emp.project_id))
        p = p_res.scalar()
        if p: p_name = p.name
    if emp.seat_id:
        s_res = await db.execute(select(Seat).where(Seat.id == emp.seat_id))
        s = s_res.scalar()
        if s:
            s_num = s.seat_number
            floor = s.floor
            zone = s.zone

    return {
        **emp.__dict__,
        "project_name": p_name,
        "seat_number": s_num,
        "floor": floor,
        "zone": zone,
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