/**
 * Enterprise Data Generator for Ethara Seat Allocation & Project Mapping System
 * Generates 5,000 Employees, 5,500 Seats, 11 Projects, Allocations, Audit Logs & Analytics.
 */

import { DepartmentName, Employee, EmployeeRole, Project, Seat, SeatAllocation, AuditLog, DashboardStats } from '../types';

const INDIAN_FIRST_NAMES = [
  'Aarav', 'Ananya', 'Aditya', 'Aditi', 'Amit', 'Anushka', 'Arjun', 'Bhavya', 'Chetan', 'Dev',
  'Diya', 'Dhruv', 'Esha', 'Gautam', 'Isha', 'Ishaan', 'Jaya', 'Kabir', 'Kavya', 'Karan',
  'Kiran', 'Meera', 'Manish', 'Neha', 'Nikhil', 'Pooja', 'Pranav', 'Priya', 'Rahul', 'Riya',
  'Rohan', 'Sanjay', 'Shreya', 'Siddharth', 'Sneha', 'Tanvi', 'Utkarsh', 'Varun', 'Vidya', 'Yash',
  'Aakash', 'Alok', 'Deepak', 'Geeta', 'Harsh', 'Jyoti', 'Kartik', 'Lata', 'Madhav', 'Nisha',
  'Omkar', 'Parul', 'Rajesh', 'Ritu', 'Sachin', 'Tanuja', 'Umesh', 'Vandana', 'Vikram', 'Zoya'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Joshi', 'Mehta', 'Rao', 'Reddy',
  'Nair', 'Iyer', 'Deshmukh', 'Kulkarni', 'Agarwal', 'Bhasin', 'Chatterjee', 'Das', 'Dutta', 'Gowda',
  'Hegde', 'Kapoor', 'Malhotra', 'Mishra', 'Pandey', 'Pillai', 'Roy', 'Saxena', 'Sen', 'Shah',
  'Srinivasan', 'Trivedi', 'Venkatesh', 'Yadav', 'Chawla', 'Bhatt', 'Nambiar', 'Puri', 'Setty', 'Thakur'
];

const DEPARTMENTS: DepartmentName[] = [
  'Engineering',
  'Product',
  'Design',
  'Data & AI',
  'Cloud & DevOps',
  'Quality Assurance',
  'Cyber Security',
  'Operations',
  'Human Resources'
];

const ROLES: EmployeeRole[] = [
  'Software Engineer',
  'Senior Engineer',
  'Staff Engineer',
  'Product Manager',
  'UI/UX Designer',
  'Data Scientist',
  'DevOps Lead',
  'QA Architect',
  'Engineering Manager'
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-1',
    name: 'Core Banking Modernization',
    code: 'PRJ-FIN-01',
    description: 'Next-gen distributed core banking transaction platform with microservices architecture.',
    managerName: 'Rajesh Sharma',
    managerEmail: 'rajesh.sharma@ethara.com',
    department: 'Engineering',
    capacity: 650,
    assignedCount: 610,
    seatUtilization: 93.8,
    status: 'Active',
    preferredFloor: 1,
    preferredZone: 'Zone A',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prj-2',
    name: 'Ethara Cloud AI Assistant',
    code: 'PRJ-AI-02',
    description: 'Enterprise LLM-powered context search & automated workflow recommendation engine.',
    managerName: 'Ananya Iyer',
    managerEmail: 'ananya.iyer@ethara.com',
    department: 'Data & AI',
    capacity: 550,
    assignedCount: 520,
    seatUtilization: 94.5,
    status: 'Active',
    preferredFloor: 2,
    preferredZone: 'Zone B',
    createdAt: '2025-02-10T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prj-3',
    name: 'DevOps & SRE Platform',
    code: 'PRJ-OPS-03',
    description: 'Internal developer platform, Kubernetes gitops orchestration, and latency observability.',
    managerName: 'Siddharth Rao',
    managerEmail: 'siddharth.rao@ethara.com',
    department: 'Cloud & DevOps',
    capacity: 500,
    assignedCount: 470,
    seatUtilization: 94.0,
    status: 'Active',
    preferredFloor: 3,
    preferredZone: 'Zone C',
    createdAt: '2025-03-01T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prj-4',
    name: 'Ethara Design System v3',
    code: 'PRJ-DS-04',
    description: 'Accessible component primitives, design tokens, multi-brand themes, and motion library.',
    managerName: 'Kavya Kulkarni',
    managerEmail: 'kavya.kulkarni@ethara.com',
    department: 'Design',
    capacity: 400,
    assignedCount: 380,
    seatUtilization: 95.0,
    status: 'Active',
    preferredFloor: 1,
    preferredZone: 'Zone B',
    createdAt: '2025-03-15T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prj-5',
    name: 'CyberShield Zero Trust',
    code: 'PRJ-SEC-05',
    description: 'Enterprise IAM, biometric passkeys, zero-trust network access, and threat detection.',
    managerName: 'Vikram Joshi',
    managerEmail: 'vikram.joshi@ethara.com',
    department: 'Cyber Security',
    capacity: 450,
    assignedCount: 420,
    seatUtilization: 93.3,
    status: 'Active',
    preferredFloor: 4,
    preferredZone: 'Zone D',
    createdAt: '2025-04-01T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prj-6',
    name: 'Mobile Wealth Management',
    code: 'PRJ-MOB-06',
    description: 'Cross-platform React Native app for portfolio tracking, automated rebalancing & stocks.',
    managerName: 'Priya Malhotra',
    managerEmail: 'priya.malhotra@ethara.com',
    department: 'Product',
    capacity: 500,
    assignedCount: 460,
    seatUtilization: 92.0,
    status: 'Active',
    preferredFloor: 2,
    preferredZone: 'Zone A',
    createdAt: '2025-05-10T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prj-7',
    name: 'Realtime Data Pipeline',
    code: 'PRJ-DATA-07',
    description: 'Streaming Apache Kafka pipeline processing 100k events/sec with Apache Flink.',
    managerName: 'Nikhil Saxena',
    managerEmail: 'nikhil.saxena@ethara.com',
    department: 'Data & AI',
    capacity: 450,
    assignedCount: 430,
    seatUtilization: 95.5,
    status: 'Active',
    preferredFloor: 3,
    preferredZone: 'Zone E',
    createdAt: '2025-06-01T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prj-8',
    name: 'Global QA Test Automation',
    code: 'PRJ-QA-08',
    description: 'Automated end-to-end Playwright visual regression and API load testing framework.',
    managerName: 'Sneha Patel',
    managerEmail: 'sneha.patel@ethara.com',
    department: 'Quality Assurance',
    capacity: 400,
    assignedCount: 370,
    seatUtilization: 92.5,
    status: 'Active',
    preferredFloor: 4,
    preferredZone: 'Zone A',
    createdAt: '2025-07-15T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prj-9',
    name: 'Smart Retail & ERP Hub',
    code: 'PRJ-ERP-09',
    description: 'Omnichannel inventory tracking, point-of-sale integration, and logistics optimization.',
    managerName: 'Amit Verma',
    managerEmail: 'amit.verma@ethara.com',
    department: 'Operations',
    capacity: 450,
    assignedCount: 410,
    seatUtilization: 91.1,
    status: 'Active',
    preferredFloor: 5,
    preferredZone: 'Zone A',
    createdAt: '2025-08-01T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prj-10',
    name: 'HR & People Ops Suite',
    code: 'PRJ-HR-10',
    description: 'Internal employee portal, performance reviews, benefits administration & onboarding.',
    managerName: 'Deepak Bhatia',
    managerEmail: 'deepak.bhatia@ethara.com',
    department: 'Human Resources',
    capacity: 350,
    assignedCount: 320,
    seatUtilization: 91.4,
    status: 'Active',
    preferredFloor: 5,
    preferredZone: 'Zone B',
    createdAt: '2025-09-01T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'prj-11',
    name: 'Next-Gen Workspace IoT',
    code: 'PRJ-IOT-11',
    description: 'Smart occupancy sensors, desk temperature controls, energy management, and indoor maps.',
    managerName: 'Rahul Mehta',
    managerEmail: 'rahul.mehta@ethara.com',
    department: 'Engineering',
    capacity: 300,
    assignedCount: 160,
    seatUtilization: 53.3,
    status: 'Planning',
    preferredFloor: 5,
    preferredZone: 'Zone C',
    createdAt: '2025-10-01T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  }
];

export function generateEnterpriseData() {
  const seats: Seat[] = [];
  const employees: Employee[] = [];
  const allocations: SeatAllocation[] = [];
  const auditLogs: AuditLog[] = [];

  // 1. Generate 5,500 Seats across 5 Floors x 10 Zones (Zone A..J) x 110 Seats/Zone
  // Floor 1-5, Zone A-J, Bay 1-4
  const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J'];
  
  let globalSeatIndex = 0;
  for (let floor = 1; floor <= 5; floor++) {
    for (const zone of zones) {
      for (let num = 1; num <= 110; num++) {
        globalSeatIndex++;
        const bay = Math.ceil(num / 28);
        const zoneLetter = zone.split(' ')[1];
        const seatNumber = `F${floor}-Z${zoneLetter}-S${String(num).padStart(3, '0')}`;

        seats.push({
          id: `seat-${globalSeatIndex}`,
          seatNumber,
          floor,
          zone,
          bay,
          status: 'AVAILABLE',
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        });
      }
    }
  }

  // Set designated counts:
  // Total Seats = 5,500
  // Reserved: 100
  // Maintenance: 50
  // Available: ~500 unallocated
  // Occupied: 4,850 allocated

  // Reserve 100 seats in Floor 1 Zone J & Floor 2 Zone J
  for (let i = 0; i < 100; i++) {
    const seat = seats[5400 - i]; // Seats at end
    if (seat) seat.status = 'RESERVED';
  }

  // Maintenance 50 seats
  for (let i = 0; i < 50; i++) {
    const seat = seats[5300 - i];
    if (seat) seat.status = 'MAINTENANCE';
  }

  // 2. Generate 5,000 Employees
  // 4,950 assigned to projects, 50 pending allocation
  let empCodeCounter = 1000;
  
  for (let i = 0; i < 5000; i++) {
    empCodeCounter++;
    const firstName = INDIAN_FIRST_NAMES[i % INDIAN_FIRST_NAMES.length];
    const lastName = INDIAN_LAST_NAMES[Math.floor(i / INDIAN_FIRST_NAMES.length) % INDIAN_LAST_NAMES.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 100 ? i : ''}@ethara.com`;
    const empCode = `EMP-${empCodeCounter}`;
    const department = DEPARTMENTS[i % DEPARTMENTS.length];
    const role = ROLES[i % ROLES.length];
    
    // Joining date distributed over last 2 years
    const year = 2024 + (i % 2);
    const month = String((i % 12) + 1).padStart(2, '0');
    const day = String((i % 28) + 1).padStart(2, '0');
    const joiningDate = `${year}-${month}-${day}`;

    // Project assignment
    const project = INITIAL_PROJECTS[i % INITIAL_PROJECTS.length];
    
    // 50 employees pending allocation (unallocated)
    const isPending = i >= 4950;

    employees.push({
      id: `emp-${i + 1}`,
      empCode,
      firstName,
      lastName,
      email,
      department,
      role,
      joiningDate,
      projectId: isPending ? undefined : project.id,
      projectName: isPending ? undefined : project.name,
      isActive: true,
      isDeleted: false,
      createdAt: `${joiningDate}T09:00:00Z`,
      updatedAt: `${joiningDate}T09:00:00Z`
    });
  }

  // 3. Allocate Seats for 4,850 employees
  // Keep ~500 seats available + 100 reserved + 50 maintenance = 650 unallocated seats
  let allocatedSeatCount = 0;
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    if (emp.projectId && allocatedSeatCount < 4850) {
      const seat = seats[allocatedSeatCount];
      if (seat && seat.status === 'AVAILABLE') {
        seat.status = 'OCCUPIED';
        seat.occupantId = emp.id;
        seat.occupantName = `${emp.firstName} ${emp.lastName}`;
        seat.occupantEmpCode = emp.empCode;
        seat.projectId = emp.projectId;
        seat.projectName = emp.projectName;
        seat.department = emp.department;

        emp.seatId = seat.id;
        emp.seatNumber = seat.seatNumber;
        emp.floor = seat.floor;
        emp.zone = seat.zone;

        allocations.push({
          id: `alloc-${allocatedSeatCount + 1}`,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          empCode: emp.empCode,
          seatId: seat.id,
          seatNumber: seat.seatNumber,
          floor: seat.floor,
          zone: seat.zone,
          projectId: emp.projectId,
          projectName: emp.projectName || '',
          allocatedAt: emp.joiningDate + 'T09:30:00Z',
          status: 'ACTIVE',
          distanceScore: Math.floor(Math.random() * 15) + 85
        });

        allocatedSeatCount++;
      }
    }
  }

  // Create audit logs for initial setup and recent activities
  auditLogs.push(
    {
      id: 'log-1',
      userId: 'usr-admin',
      userName: 'System Administrator',
      action: 'SEAT_ALLOCATED',
      targetType: 'SEAT',
      targetId: seats[0].id,
      targetName: seats[0].seatNumber,
      details: `Automated smart seat allocation for ${employees[0].firstName} ${employees[0].lastName} (${employees[0].empCode})`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'log-2',
      userId: 'usr-admin',
      userName: 'Facility Manager',
      action: 'SEAT_RESERVED',
      targetType: 'SEAT',
      targetId: 'seat-5401',
      targetName: 'F5-ZJ-S001',
      details: 'Reserved 100 seats for upcoming AI Research Lab expansion',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'log-3',
      userId: 'usr-admin',
      userName: 'HR Operations',
      action: 'EMPLOYEE_CREATED',
      targetType: 'EMPLOYEE',
      targetId: employees[4950].id,
      targetName: `${employees[4950].firstName} ${employees[4950].lastName}`,
      details: 'New joiner onboarded - pending seat allocation recommendation',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
    }
  );

  return {
    employees,
    seats,
    projects: INITIAL_PROJECTS,
    allocations,
    auditLogs
  };
}

export function calculateDashboardStats(
  employees: Employee[],
  seats: Seat[],
  projects: Project[],
  allocations: SeatAllocation[]
): DashboardStats {
  const activeEmployees = employees.filter(e => e.isActive && !e.isDeleted);
  const totalEmployees = activeEmployees.length;
  const totalSeats = seats.length;

  const occupiedSeats = seats.filter(s => s.status === 'OCCUPIED').length;
  const availableSeats = seats.filter(s => s.status === 'AVAILABLE').length;
  const reservedSeats = seats.filter(s => s.status === 'RESERVED').length;
  const maintenanceSeats = seats.filter(s => s.status === 'MAINTENANCE').length;
  const releasedSeats = seats.filter(s => s.status === 'RELEASED').length;

  const pendingAllocation = activeEmployees.filter(e => !e.seatId).length;
  const overallOccupancyRate = Number(((occupiedSeats / totalSeats) * 100).toFixed(1));

  // Project utilization
  const projectUtilization = projects.map(prj => {
    const prjEmps = activeEmployees.filter(e => e.projectId === prj.id);
    const allocatedCount = prjEmps.filter(e => e.seatId).length;
    return {
      projectId: prj.id,
      projectName: prj.name,
      capacity: prj.capacity,
      assigned: prjEmps.length,
      allocatedSeats: allocatedCount,
      utilizationRate: Number(((allocatedCount / prj.capacity) * 100).toFixed(1))
    };
  });

  // Floor occupancy
  const floorOccupancy = [1, 2, 3, 4, 5].map(floor => {
    const floorSeats = seats.filter(s => s.floor === floor);
    const total = floorSeats.length;
    const occupied = floorSeats.filter(s => s.status === 'OCCUPIED').length;
    const available = floorSeats.filter(s => s.status === 'AVAILABLE').length;
    const reserved = floorSeats.filter(s => s.status === 'RESERVED').length;
    return {
      floor,
      total,
      occupied,
      available,
      reserved,
      occupancyRate: total > 0 ? Number(((occupied / total) * 100).toFixed(1)) : 0
    };
  });

  // Department distribution
  const deptMap = new Map<string, { total: number; allocated: number }>();
  activeEmployees.forEach(emp => {
    const curr = deptMap.get(emp.department) || { total: 0, allocated: 0 };
    curr.total += 1;
    if (emp.seatId) curr.allocated += 1;
    deptMap.set(emp.department, curr);
  });

  const departmentDistribution = Array.from(deptMap.entries()).map(([dept, data]) => ({
    department: dept,
    employeeCount: data.total,
    allocatedSeats: data.allocated
  }));

  // Monthly joiners chart
  const monthlyJoinersMap = new Map<string, number>();
  activeEmployees.slice(-500).forEach(emp => {
    const monthKey = emp.joiningDate.slice(0, 7); // YYYY-MM
    monthlyJoinersMap.set(monthKey, (monthlyJoinersMap.get(monthKey) || 0) + 1);
  });

  const monthlyJoiners = Array.from(monthlyJoinersMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([month, count]) => ({ month, count }));

  // Heatmap data across 5 floors x 10 zones
  const heatMapData: DashboardStats['heatMapData'] = [];
  const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J'];
  
  for (let floor = 1; floor <= 5; floor++) {
    for (const zone of zones) {
      const zSeats = seats.filter(s => s.floor === floor && s.zone === zone);
      const zOccupied = zSeats.filter(s => s.status === 'OCCUPIED').length;
      const total = zSeats.length;
      heatMapData.push({
        floor,
        zone,
        occupied: zOccupied,
        total,
        density: total > 0 ? Number((zOccupied / total).toFixed(2)) : 0
      });
    }
  }

  return {
    totalEmployees,
    totalSeats,
    occupiedSeats,
    availableSeats,
    reservedSeats,
    maintenanceSeats,
    releasedSeats,
    pendingAllocation,
    overallOccupancyRate,
    projectUtilization,
    floorOccupancy,
    departmentDistribution,
    monthlyJoiners,
    recentAllocations: allocations.slice(-10).reverse(),
    heatMapData
  };
}
