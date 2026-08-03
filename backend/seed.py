import asyncio
import uuid
import random
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.database import engine, Base
from app.models.models import Employee, Project, Seat, SeatAllocation, AuditLog

DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Data & AI', 'Cloud & DevOps', 'Quality Assurance', 'Cyber Security', 'Operations', 'Human Resources']
ROLES = ['Software Engineer', 'Senior Engineer', 'Staff Engineer', 'Product Manager', 'UI/UX Designer', 'Data Scientist', 'DevOps Lead', 'QA Architect', 'Engineering Manager']

INITIAL_PROJECTS = [
    {"id": "prj-1", "name": "Core Banking Modernization", "code": "PRJ-FIN-01", "capacity": 650, "manager_name": "Rajesh Sharma", "manager_email": "r@ethara.com", "department": "Engineering"},
    {"id": "prj-2", "name": "Ethara Cloud AI Assistant", "code": "PRJ-AI-02", "capacity": 550, "manager_name": "Ananya Iyer", "manager_email": "a@ethara.com", "department": "Data & AI"},
    {"id": "prj-3", "name": "DevOps & SRE Platform", "code": "PRJ-OPS-03", "capacity": 500, "manager_name": "Siddharth Rao", "manager_email": "s@ethara.com", "department": "Cloud & DevOps"},
    {"id": "prj-4", "name": "Ethara Design System v3", "code": "PRJ-DS-04", "capacity": 400, "manager_name": "Kavya Kulkarni", "manager_email": "k@ethara.com", "department": "Design"},
    {"id": "prj-5", "name": "CyberShield Zero Trust", "code": "PRJ-SEC-05", "capacity": 450, "manager_name": "Vikram Joshi", "manager_email": "v@ethara.com", "department": "Cyber Security"},
    {"id": "prj-6", "name": "Mobile Wealth Management", "code": "PRJ-MOB-06", "capacity": 500, "manager_name": "Priya Malhotra", "manager_email": "p@ethara.com", "department": "Product"},
    {"id": "prj-7", "name": "Realtime Data Pipeline", "code": "PRJ-DATA-07", "capacity": 450, "manager_name": "Nikhil Saxena", "manager_email": "n@ethara.com", "department": "Data & AI"},
    {"id": "prj-8", "name": "Global QA Test Automation", "code": "PRJ-QA-08", "capacity": 400, "manager_name": "Sneha Patel", "manager_email": "sp@ethara.com", "department": "Quality Assurance"},
    {"id": "prj-9", "name": "Smart Retail & ERP Hub", "code": "PRJ-ERP-09", "capacity": 450, "manager_name": "Amit Verma", "manager_email": "av@ethara.com", "department": "Operations"},
    {"id": "prj-10", "name": "HR & People Ops Suite", "code": "PRJ-HR-10", "capacity": 350, "manager_name": "Deepak Bhatia", "manager_email": "d@ethara.com", "department": "Human Resources"},
    {"id": "prj-11", "name": "Next-Gen Workspace IoT", "code": "PRJ-IOT-11", "capacity": 300, "manager_name": "Rahul Mehta", "manager_email": "rm@ethara.com", "department": "Engineering"},
]

async def seed_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Projects
        projs = []
        for p in INITIAL_PROJECTS:
            proj = Project(
                id=p["id"],
                name=p["name"],
                code=p["code"],
                capacity=p["capacity"],
                manager_name=p["manager_name"],
                manager_email=p["manager_email"],
                department=p["department"]
            )
            session.add(proj)
            projs.append(proj)
            
        # Seats (5500)
        zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J']
        seats = []
        seat_idx = 1
        for floor in range(1, 6):
            for zone in zones:
                for num in range(1, 111):
                    bay = (num // 28) + 1
                    z_letter = zone.split(' ')[1]
                    s_num = f"F{floor}-Z{z_letter}-S{num:03d}"
                    seat = Seat(
                        id=f"seat-{seat_idx}",
                        seat_number=s_num,
                        floor=floor,
                        zone=zone,
                        bay=bay,
                        status="AVAILABLE"
                    )
                    seats.append(seat)
                    seat_idx += 1
                    
        # Reserve some seats: 100 RESERVED + 400 MAINTENANCE = 500 non-available/non-occupied
        # Total: 4500 OCCUPIED + 100 RESERVED + 400 MAINTENANCE = 5000 -> 500 AVAILABLE (5500-5000)
        for i in range(100):
            seats[5400 - i].status = "RESERVED"
        for i in range(400):
            seats[5300 - i].status = "MAINTENANCE"
            
        session.add_all(seats)
        await session.flush()
        
        # Employees (5000)
        employees = []
        total_employees = 5000
        pending_count = 500
        allocated_count_target = total_employees - pending_count
        for i in range(1, total_employees + 1):
            emp = Employee(
                id=f"emp-{i}",
                emp_code=f"EMP-{1000 + i}",
                first_name=f"User{i}",
                last_name=f"Test",
                email=f"user{i}@ethara.com",
                department=DEPARTMENTS[i % len(DEPARTMENTS)],
                role=ROLES[i % len(ROLES)],
                joining_date="2025-01-01",
                is_active=True,
                is_deleted=False
            )
            is_pending = (i > allocated_count_target)
            if not is_pending:
                emp.project_id = projs[i % len(projs)].id
            employees.append(emp)
            
        session.add_all(employees)
        await session.flush()
        
        # Allocations
        allocations = []
        allocated_count = 0
        for emp in employees:
            if emp.project_id and allocated_count < allocated_count_target:
                seat = seats[allocated_count]
                if seat.status == "AVAILABLE":
                    seat.status = "OCCUPIED"
                    seat.occupant_id = emp.id
                    seat.project_id = emp.project_id
                    emp.seat_id = seat.id
                    
                    alloc = SeatAllocation(
                        id=f"alloc-{allocated_count+1}",
                        employee_id=emp.id,
                        seat_id=seat.id,
                        project_id=emp.project_id
                    )
                    allocations.append(alloc)
                    allocated_count += 1
                    
        session.add_all(allocations)
        await session.commit()
        print("Database seeded successfully with 5000 employees, 5500 seats, 11 projects, 100 reserved, 500 available, and 500 pending allocation.")

if __name__ == "__main__":
    asyncio.run(seed_db())
