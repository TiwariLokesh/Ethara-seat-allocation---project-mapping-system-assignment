from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="ADMIN")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    emp_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    joining_date: Mapped[str] = mapped_column(String(20), nullable=False)
    
    project_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("projects.id"), nullable=True)
    seat_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("seats.id"), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    manager_name: Mapped[str] = mapped_column(String(100), nullable=False)
    manager_email: Mapped[str] = mapped_column(String(100), nullable=False)
    department: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Active")
    preferred_floor: Mapped[int] = mapped_column(Integer, default=1)
    preferred_zone: Mapped[str] = mapped_column(String(20), default="Zone A")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Seat(Base):
    __tablename__ = "seats"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    seat_number: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    floor: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    zone: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    bay: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), index=True, default="AVAILABLE") # AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, RELEASED
    occupant_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class SeatAllocation(Base):
    __tablename__ = "seat_allocations"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    employee_id: Mapped[str] = mapped_column(String(50), ForeignKey("employees.id"), nullable=False)
    seat_id: Mapped[str] = mapped_column(String(50), ForeignKey("seats.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(50), ForeignKey("projects.id"), nullable=False)
    allocated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    distance_score: Mapped[float] = mapped_column(Float, default=100.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(50), nullable=False)
    user_name: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str] = mapped_column(String(50), nullable=False)
    target_name: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
