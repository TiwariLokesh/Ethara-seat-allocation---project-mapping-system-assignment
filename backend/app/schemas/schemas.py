from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class EmployeeBase(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

    emp_code: str = Field(..., alias="empCode", example="EMP-1001")
    first_name: str = Field(..., alias="firstName", example="Amit")
    last_name: str = Field(..., alias="lastName", example="Sharma")
    email: EmailStr = Field(..., example="amit.sharma@ethara.com")
    department: str = Field(..., example="Engineering")
    role: str = Field(..., example="Senior Engineer")
    joining_date: str = Field(..., alias="joiningDate", example="2025-01-15")
    project_id: Optional[str] = Field(default=None, alias="projectId")

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    first_name: Optional[str] = Field(default=None, alias="firstName")
    last_name: Optional[str] = Field(default=None, alias="lastName")
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    role: Optional[str] = None
    joining_date: Optional[str] = Field(default=None, alias="joiningDate")
    project_id: Optional[str] = Field(default=None, alias="projectId")
    seat_id: Optional[str] = Field(default=None, alias="seatId")
    is_active: Optional[bool] = Field(default=None, alias="isActive")

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
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

    name: str = Field(..., example="Core Banking Modernization")
    code: str = Field(..., example="PRJ-FIN-01")
    description: Optional[str] = None
    manager_name: str = Field(..., alias="managerName", example="Rajesh Sharma")
    manager_email: EmailStr = Field(..., alias="managerEmail", example="rajesh.sharma@ethara.com")
    department: str = Field(default="Engineering", example="Engineering")
    capacity: int = Field(..., example=650)
    status: str = Field(default="Active")
    preferred_floor: int = Field(default=1, alias="preferredFloor")
    preferred_zone: str = Field(default="Zone A", alias="preferredZone")

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

    model_config = ConfigDict(
        populate_by_name=True
    )

    employee_id: str = Field(alias="employeeId")

    notes: Optional[str] = None

class SeatRecommendationRequest(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    employee_id: str = Field(alias="employeeId")
    project_id: Optional[str] = Field(default=None, alias="projectId")
    preferred_floor: Optional[int] = Field(default=None, alias="preferredFloor")
    preferred_zone: Optional[str] = Field(default=None, alias="preferredZone")

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
    totalEmployees: int
    totalSeats: int
    occupiedSeats: int
    availableSeats: int
    reservedSeats: int
    maintenanceSeats: int
    releasedSeats: int
    pendingAllocation: int
    overallOccupancyRate: float
    projectUtilization: List[Dict[str, Any]]
    floorOccupancy: List[Dict[str, Any]]
    departmentDistribution: List[Dict[str, Any]]
    monthlyJoiners: List[Dict[str, Any]]
    recentAllocations: List[Dict[str, Any]]
    heatMapData: List[Dict[str, Any]]

