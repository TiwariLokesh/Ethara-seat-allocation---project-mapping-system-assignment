/**
 * Enterprise Frontend API Client Service
 * Communicates with /api/v1 endpoints for Employees, Projects, Seats, Allocations, Dashboard & AI Assistant.
 */

import {
  Employee,
  Project,
  Seat,
  SeatAllocation,
  DashboardStats,
  AuditLog,
  AIQueryResponse,
  SeatRecommendation,
  NewJoinerFormData
} from '../types';

const API_BASE =  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : "/api/v1";

function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (typeof obj !== 'object') return obj;
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = snakeToCamel(obj[key]);
  }
  return result;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.message) errorMsg = data.message;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  const data = await res.json();
  return snakeToCamel(data) as T;
}

export const api = {
  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return handleResponse<DashboardStats>(res);
  },

  // Employees List
  getEmployees: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    project?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: Employee[]; total: number; page: number; totalPages: number }> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.department) query.set('department', params.department);
    if (params.project) query.set('project', params.project);
    if (params.status) query.set('status', params.status);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const res = await fetch(`${API_BASE}/employees?${query.toString()}`);
    return handleResponse(res);
  },

  // Create Employee
  createEmployee: async (data: NewJoinerFormData): Promise<Employee> => {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Employee>(res);
  },

  // Update Employee
  updateEmployee: async (
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      department?: string;
      role?: string;
      joiningDate?: string;
      projectId?: string;
      isActive?: boolean;
    }
  ): Promise<Employee> => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Employee>(res);
  },

  // Bulk Import
  bulkImportEmployees: async (employees: Partial<Employee>[]): Promise<{ addedCount: number; skippedCount: number; errors: string[] }> => {
    const res = await fetch(`${API_BASE}/employees/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employees })
    });
    return handleResponse(res);
  },

  // Soft Delete Employee
  deleteEmployee: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await fetch(`${API_BASE}/projects`);
    return handleResponse<Project[]>(res);
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Project>(res);
  },

  // Seats Query
  getSeats: async (params: {
    floor?: number | 'ALL';
    zone?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Seat[]; total: number; page: number; totalPages: number }> => {
    const query = new URLSearchParams();
    if (params.floor && params.floor !== 'ALL') query.set('floor', String(params.floor));
    if (params.zone) query.set('zone', params.zone);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/seats?${query.toString()}`);
    return handleResponse(res);
  },

  // Recommend Seats
  getSeatRecommendations: async (data: {
    employeeId: string;
    projectId?: string;
    preferredFloor?: number;
    preferredZone?: string;
  }): Promise<{ employee: Employee; project?: Project; recommendations: SeatRecommendation[] }> => {
    const res = await fetch(`${API_BASE}/seats/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Allocate Seat
  allocateSeat: async (seatId: string, employeeId: string, notes?: string): Promise<{ message: string; seat: Seat; employee: Employee; allocation: SeatAllocation }> => {
    const res = await fetch(`${API_BASE}/seats/${seatId}/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, notes })
    });
    return handleResponse(res);
  },

  // Release Seat
  releaseSeat: async (seatId: string): Promise<{ message: string; seat: Seat }> => {
    const res = await fetch(`${API_BASE}/seats/${seatId}/release`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // Transfer Seat
  transferSeat: async (sourceSeatId: string, targetSeatId: string): Promise<{ message: string; sourceSeat: Seat; targetSeat: Seat; employee: Employee }> => {
    const res = await fetch(`${API_BASE}/seats/${sourceSeatId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetSeatId })
    });
    return handleResponse(res);
  },

  // Set Seat Status (Reserve / Maintenance / Available)
  setSeatStatus: async (seatId: string, status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE'): Promise<{ message: string; seat: Seat }> => {
    const res = await fetch(`${API_BASE}/seats/${seatId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // AI Assistant Query
  queryAIAssistant: async (query: string): Promise<AIQueryResponse> => {
    const res = await fetch(`${API_BASE}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return handleResponse<AIQueryResponse>(res);
  },

  // Audit Logs
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch(`${API_BASE}/audit-logs`);
    return handleResponse<AuditLog[]>(res);
  }
};
