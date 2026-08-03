/**
 * Core Data Models & Types for Ethara Seat Allocation & Project Mapping System
 */

export type EmployeeRole = 'Software Engineer' | 'Senior Engineer' | 'Staff Engineer' | 'Product Manager' | 'UI/UX Designer' | 'Data Scientist' | 'DevOps Lead' | 'QA Architect' | 'Engineering Manager';

export type DepartmentName = 'Engineering' | 'Product' | 'Design' | 'Data & AI' | 'Cloud & DevOps' | 'Quality Assurance' | 'Cyber Security' | 'Operations' | 'Human Resources';

export type ProjectStatus = 'Active' | 'Planning' | 'On Hold' | 'Completed';

export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'RELEASED';

export type UserRole = 'ADMIN' | 'MANAGER' | 'FACILITY_ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Employee {
  id: string;
  empCode: string; // e.g. "EMP-1001"
  firstName: string;
  lastName: string;
  email: string;
  department: DepartmentName;
  role: EmployeeRole;
  joiningDate: string; // ISO date string YYYY-MM-DD
  projectId?: string;
  projectName?: string;
  seatId?: string;
  seatNumber?: string;
  floor?: number;
  zone?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  code: string; // e.g. "PRJ-FIN-01"
  description: string;
  managerName: string;
  managerEmail: string;
  department: DepartmentName;
  capacity: number;
  assignedCount: number;
  seatUtilization: number; // percentage 0-100
  status: ProjectStatus;
  preferredFloor?: number;
  preferredZone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  id: string;
  seatNumber: string; // e.g. "F3-ZB-042"
  floor: number; // 1 to 5
  zone: string; // 'Zone A' through 'Zone J'
  bay: number; // 1 to 4
  status: SeatStatus;
  occupantId?: string;
  occupantName?: string;
  occupantEmpCode?: string;
  projectId?: string;
  projectName?: string;
  department?: DepartmentName;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeatAllocation {
  id: string;
  employeeId: string;
  employeeName: string;
  empCode: string;
  seatId: string;
  seatNumber: string;
  floor: number;
  zone: string;
  projectId: string;
  projectName: string;
  allocatedAt: string;
  releasedAt?: string;
  status: 'ACTIVE' | 'RELEASED' | 'TRANSFERRED';
  distanceScore?: number;
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'SEAT_ALLOCATED' | 'SEAT_RELEASED' | 'SEAT_TRANSFERRED' | 'EMPLOYEE_CREATED' | 'EMPLOYEE_UPDATED' | 'EMPLOYEE_DELETED' | 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'SEAT_RESERVED' | 'MAINTENANCE_TOGGLED';
  targetType: 'SEAT' | 'EMPLOYEE' | 'PROJECT' | 'SYSTEM';
  targetId: string;
  targetName: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  totalEmployees: number;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  reservedSeats: number;
  maintenanceSeats: number;
  releasedSeats: number;
  pendingAllocation: number;
  overallOccupancyRate: number;
  projectUtilization: {
    projectId: string;
    projectName: string;
    capacity: number;
    assigned: number;
    allocatedSeats: number;
    utilizationRate: number;
  }[];
  floorOccupancy: {
    floor: number;
    total: number;
    occupied: number;
    available: number;
    reserved: number;
    occupancyRate: number;
  }[];
  departmentDistribution: {
    department: string;
    employeeCount: number;
    allocatedSeats: number;
  }[];
  monthlyJoiners: {
    month: string;
    count: number;
  }[];
  recentAllocations: SeatAllocation[];
  heatMapData: {
    floor: number;
    zone: string;
    occupied: number;
    total: number;
    density: number; // 0 to 1
  }[];
}

export interface RecommendationRequest {
  employeeId: string;
  projectId: string;
  preferredFloor?: number;
  preferredZone?: string;
}

export interface SeatRecommendation {
  seat: Seat;
  score: number; // 0 to 100
  reasons: string[];
  teamProximityScore: number;
  departmentProximityScore: number;
  isAlternative?: boolean;
}

export interface AIQueryResponse {
  query: string;
  answer: string;
  actionType?: 'SEARCH' | 'ALLOCATE' | 'RELEASE' | 'TRANSFER' | 'INFO';
  data?: {
    employees?: Employee[];
    seats?: Seat[];
    projects?: Project[];
    stats?: Partial<DashboardStats>;
  };
  suggestedFollowups?: string[];
}

export interface FilterState {
  search: string;
  department: string;
  project: string;
  status: string;
  floor: number | 'ALL';
  zone: string | 'ALL';
  joiningDateStart?: string;
  joiningDateEnd?: string;
}

export interface NewJoinerFormData {
  firstName: string;
  lastName: string;
  email: string;
  empCode: string;
  department: DepartmentName;
  role: EmployeeRole;
  joiningDate: string;
  projectId: string;
  selectedSeatId?: string;
}
