from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field

class EmployeeBase(BaseModel):
    emp_code: str = Field(..., example="EMP-1001")
    first_name: str = Field(..., example="Amit")
    last_name: str = Field(..., example="Sharma")
    email: EmailStr = Field(..., example="amit.sharma@ethara.com")
    department: str = Field(..., example="Engineering")
    role: str = Field(..., example="Senior Engineer")
    joining_date: str = Field(..., example="2025-01-15")
    project_id: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    project_id: Optional[str] = None
    seat_id: Optional[str] = None
    is_active: Optional[bool] = None

class EmployeeResponse(EmployeeBase):
    id: str
    project_name: Optional[str] = None
    seat_id: Optional[str] = None
    seat_number: Optional[str] = None
    floor: Optional[int] = None
    zone: Optional[str] = None
    is_active: bool
    is_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str = Field(..., example="Core Banking Modernization")
    code: str = Field(..., example="PRJ-FIN-01")
    description: Optional[str] = None
    manager_name: str = Field(..., example="Rajesh Sharma")
    manager_email: EmailStr = Field(..., example="rajesh.sharma@ethara.com")
    department: str = Field(..., example="Engineering")
    capacity: int = Field(..., example=650)
    status: str = Field(default="Active")
    preferred_floor: int = Field(default=1)
    preferred_zone: str = Field(default="Zone A")

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: str
    assigned_count: int = 0
    seat_utilization: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

class SeatResponse(BaseModel):
    id: str
    seat_number: str
    floor: int
    zone: str
    bay: int
    status: str
    occupant_id: Optional[str] = None
    occupant_name: Optional[str] = None
    occupant_emp_code: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class SeatAllocationRequest(BaseModel):
    employee_id: str
    seat_id: str
    notes: Optional[str] = None

class SeatRecommendationRequest(BaseModel):
    employee_id: str
    project_id: Optional[str] = None
    preferred_floor: Optional[int] = None
    preferred_zone: Optional[str] = None

class AIQueryRequest(BaseModel):
    query: str
    user_id: Optional[str] = "usr-admin"

class AIQueryResponse(BaseModel):
    query: str
    answer: str
    action_type: Optional[str] = "INFO"
    data: Optional[Dict[str, Any]] = None
    suggested_followups: Optional[List[str]] = None

class DashboardStatsResponse(BaseModel):
    total_employees: int
    total_seats: int
    occupied_seats: int
    available_seats: int
    reserved_seats: int
    maintenance_seats: int
    released_seats: int
    pending_allocation: int
    overall_occupancy_rate: float
    project_utilization: List[Dict[str, Any]]
    floor_occupancy: List[Dict[str, Any]]
    department_distribution: List[Dict[str, Any]]
    monthly_joiners: List[Dict[str, Any]]
    recent_allocations: List[Dict[str, Any]]
    heat_map_data: List[Dict[str, Any]]
