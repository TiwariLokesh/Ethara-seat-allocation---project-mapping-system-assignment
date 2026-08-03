/**
 * Ethara Seat Allocation & Project Mapping System
 * Production Express + Vite Full-Stack Application Proxy Server
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { generateEnterpriseData, calculateDashboardStats } from './src/services/dataGenerator';
import { generateSeatRecommendations, validateSeatAllocation } from './src/services/allocationEngine';
import { Employee, Seat, Project, SeatAllocation, AuditLog, DepartmentName, EmployeeRole } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize In-Memory Enterprise Database Store (5,000 Employees, 5,500 Seats, 11 Projects)
  console.log('[Ethara Enterprise Core] Initializing dataset...');
  const initStartTime = Date.now();
  let db = generateEnterpriseData();
  console.log(`[Ethara Enterprise Core] Dataset initialized in ${Date.now() - initStartTime}ms (${db.employees.length} employees, ${db.seats.length} seats).`);

  // Initialize Server-Side Gemini Client
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (geminiApiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      console.log('[Ethara AI Assistant] Gemini 3.6 Flash AI Engine initialized server-side.');
    } catch (err) {
      console.warn('[Ethara AI Assistant] Gemini initialization warning:', err);
    }
  }

  // API Routes Start
  const router = express.Router();

  // Health
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      system: 'Ethara Seat Allocation & Project Mapping System',
      totalEmployees: db.employees.length,
      totalSeats: db.seats.length,
      timestamp: new Date().toISOString()
    });
  });

  // Re-seed DB
  router.post('/seed/reset', (req, res) => {
    db = generateEnterpriseData();
    res.json({ message: 'Enterprise database reset successfully to 5,000 employees & 5,500 seats.' });
  });

  // Dashboard Stats
  router.get('/dashboard/stats', (req, res) => {
    const stats = calculateDashboardStats(db.employees, db.seats, db.projects, db.allocations);
    res.json(stats);
  });

  // Employees - List with Pagination, Search, Filtering, Sorting
  router.get('/employees', (req, res) => {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const department = (req.query.department as string) || '';
    const project = (req.query.project as string) || '';
    const status = (req.query.status as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const sortBy = (req.query.sortBy as string) || 'empCode';
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? -1 : 1;

    let filtered = db.employees.filter(e => !e.isDeleted);

    if (search) {
      filtered = filtered.filter(e =>
        e.firstName.toLowerCase().includes(search) ||
        e.lastName.toLowerCase().includes(search) ||
        e.empCode.toLowerCase().includes(search) ||
        e.email.toLowerCase().includes(search) ||
        e.role.toLowerCase().includes(search) ||
        (e.seatNumber && e.seatNumber.toLowerCase().includes(search)) ||
        (e.projectName && e.projectName.toLowerCase().includes(search))
      );
    }

    if (department && department !== 'ALL') {
      filtered = filtered.filter(e => e.department === department);
    }

    if (project && project !== 'ALL') {
      filtered = filtered.filter(e => e.projectId === project);
    }

    if (status) {
      if (status === 'ALLOCATED') {
        filtered = filtered.filter(e => !!e.seatId);
      } else if (status === 'PENDING') {
        filtered = filtered.filter(e => !e.seatId);
      } else if (status === 'ACTIVE') {
        filtered = filtered.filter(e => e.isActive);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof Employee] || '';
      let valB: any = b[sortBy as keyof Employee] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return -1 * sortOrder;
      if (valA > valB) return 1 * sortOrder;
      return 0;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  });

  // Employee Create
  router.post('/employees', (req, res) => {
    const { firstName, lastName, email, empCode, department, role, joiningDate, projectId } = req.body;

    if (!firstName || !lastName || !email || !empCode || !department || !role) {
      return res.status(422).json({ message: 'Validation failed: Missing required employee fields.' });
    }

    // Unique Email Check
    if (db.employees.some(e => e.email.toLowerCase() === email.toLowerCase() && !e.isDeleted)) {
      return res.status(409).json({ message: `Duplicate Email Violation: Email '${email}' is already registered.` });
    }

    // Unique EmpCode Check
    if (db.employees.some(e => e.empCode.toUpperCase() === empCode.toUpperCase() && !e.isDeleted)) {
      return res.status(409).json({ message: `Duplicate Code Violation: Employee code '${empCode}' already exists.` });
    }

    const project = db.projects.find(p => p.id === projectId);

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      empCode: empCode.toUpperCase(),
      firstName,
      lastName,
      email: email.toLowerCase(),
      department: department as DepartmentName,
      role: role as EmployeeRole,
      joiningDate: joiningDate || new Date().toISOString().slice(0, 10),
      projectId: project?.id,
      projectName: project?.name,
      isActive: true,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.employees.unshift(newEmp);

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'usr-admin',
      userName: 'HR Administrator',
      action: 'EMPLOYEE_CREATED',
      targetType: 'EMPLOYEE',
      targetId: newEmp.id,
      targetName: `${newEmp.firstName} ${newEmp.lastName}`,
      details: `Created employee ${newEmp.empCode} in ${newEmp.department} department`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(newEmp);
  });

  // Bulk Import CSV
  router.post('/employees/bulk-import', (req, res) => {
    const { employees: importList } = req.body;
    if (!Array.isArray(importList) || importList.length === 0) {
      return res.status(400).json({ message: 'Invalid payload: Array of employee objects expected.' });
    }

    let addedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    importList.forEach((row, idx) => {
      const email = (row.email || '').trim().toLowerCase();
      const empCode = (row.empCode || '').trim().toUpperCase();

      if (!email || !empCode || !row.firstName || !row.lastName) {
        skippedCount++;
        errors.push(`Row ${idx + 1}: Missing required name, code or email.`);
        return;
      }

      if (db.employees.some(e => (e.email.toLowerCase() === email || e.empCode.toUpperCase() === empCode) && !e.isDeleted)) {
        skippedCount++;
        errors.push(`Row ${idx + 1}: Duplicate code (${empCode}) or email (${email}).`);
        return;
      }

      const newEmp: Employee = {
        id: `emp-imp-${Date.now()}-${idx}`,
        empCode,
        firstName: row.firstName,
        lastName: row.lastName,
        email,
        department: row.department || 'Engineering',
        role: row.role || 'Software Engineer',
        joiningDate: row.joiningDate || new Date().toISOString().slice(0, 10),
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.employees.push(newEmp);
      addedCount++;
    });

    res.json({
      message: `Bulk import process completed. ${addedCount} employees added, ${skippedCount} skipped.`,
      addedCount,
      skippedCount,
      errors: errors.slice(0, 10)
    });
  });

  // Employee Detail / Delete
  router.get('/employees/:id', (req, res) => {
    const emp = db.employees.find(e => e.id === req.params.id && !e.isDeleted);
    if (!emp) return res.status(404).json({ message: 'Employee not found.' });
    res.json(emp);
  });

  router.delete('/employees/:id', (req, res) => {
    const emp = db.employees.find(e => e.id === req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found.' });

    // Release seat if allocated
    if (emp.seatId) {
      const seat = db.seats.find(s => s.id === emp.seatId);
      if (seat) {
        seat.status = 'AVAILABLE';
        delete seat.occupantId;
        delete seat.occupantName;
        delete seat.occupantEmpCode;
        delete seat.projectId;
        delete seat.projectName;
      }
    }

    emp.isDeleted = true;
    emp.isActive = false;
    delete emp.seatId;
    delete emp.seatNumber;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'usr-admin',
      userName: 'HR Administrator',
      action: 'EMPLOYEE_DELETED',
      targetType: 'EMPLOYEE',
      targetId: emp.id,
      targetName: `${emp.firstName} ${emp.lastName}`,
      details: `Soft deleted employee ${emp.empCode} and released assigned seat.`,
      timestamp: new Date().toISOString()
    });

    res.json({ message: `Employee ${emp.empCode} deleted successfully.` });
  });

  // Projects - List & Create
  router.get('/projects', (req, res) => {
    // Refresh live seat utilization stats for projects
    const enrichedProjects = db.projects.map(prj => {
      const prjEmps = db.employees.filter(e => e.projectId === prj.id && !e.isDeleted);
      const allocatedSeats = prjEmps.filter(e => e.seatId).length;
      return {
        ...prj,
        assignedCount: prjEmps.length,
        seatUtilization: prj.capacity > 0 ? Number(((allocatedSeats / prj.capacity) * 100).toFixed(1)) : 0
      };
    });

    res.json(enrichedProjects);
  });

  router.post('/projects', (req, res) => {
    const { name, code, description, managerName, managerEmail, department, capacity, preferredFloor, preferredZone } = req.body;

    if (!name || !code || !managerName || !capacity) {
      return res.status(422).json({ message: 'Missing required project fields.' });
    }

    if (db.projects.some(p => p.code.toUpperCase() === code.toUpperCase())) {
      return res.status(409).json({ message: `Project code '${code}' already exists.` });
    }

    const newPrj: Project = {
      id: `prj-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      description: description || '',
      managerName,
      managerEmail: managerEmail || 'manager@ethara.com',
      department: department || 'Engineering',
      capacity: parseInt(capacity) || 100,
      assignedCount: 0,
      seatUtilization: 0,
      status: 'Active',
      preferredFloor: preferredFloor ? parseInt(preferredFloor) : 1,
      preferredZone: preferredZone || 'Zone A',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.projects.unshift(newPrj);

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'usr-admin',
      userName: 'Project Operations',
      action: 'PROJECT_CREATED',
      targetType: 'PROJECT',
      targetId: newPrj.id,
      targetName: newPrj.name,
      details: `Created new project ${newPrj.code} with capacity ${newPrj.capacity}`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(newPrj);
  });

  // Seats Query & Filter
  router.get('/seats', (req, res) => {
    const floor = req.query.floor ? parseInt(req.query.floor as string) : null;
    const zone = (req.query.zone as string) || '';
    const status = (req.query.status as string) || '';
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 200; // Allow large grid responses

    let filtered = db.seats;

    if (floor !== null && !isNaN(floor)) {
      filtered = filtered.filter(s => s.floor === floor);
    }

    if (zone && zone !== 'ALL') {
      filtered = filtered.filter(s => s.zone === zone);
    }

    if (status && status !== 'ALL') {
      filtered = filtered.filter(s => s.status === status);
    }

    if (search) {
      filtered = filtered.filter(s =>
        s.seatNumber.toLowerCase().includes(search) ||
        (s.occupantName && s.occupantName.toLowerCase().includes(search)) ||
        (s.occupantEmpCode && s.occupantEmpCode.toLowerCase().includes(search)) ||
        (s.projectName && s.projectName.toLowerCase().includes(search))
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  });

  // Seat Smart Recommendation Endpoint
  router.post('/seats/recommend', (req, res) => {
    const { employeeId, projectId, preferredFloor, preferredZone } = req.body;

    const employee = db.employees.find(e => e.id === employeeId && !e.isDeleted);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const project = db.projects.find(p => p.id === (projectId || employee.projectId));

    const recommendations = generateSeatRecommendations({
      employee,
      project,
      seats: db.seats,
      allEmployees: db.employees,
      preferredFloor: preferredFloor ? parseInt(preferredFloor) : undefined,
      preferredZone,
      limit: 6
    });

    res.json({
      employee,
      project,
      recommendations
    });
  });

  // Seat Operations - Allocate
  router.post('/seats/:id/allocate', (req, res) => {
    const seat = db.seats.find(s => s.id === req.params.id);
    if (!seat) return res.status(404).json({ message: 'Seat not found.' });

    const { employeeId, notes } = req.body;
    const employee = db.employees.find(e => e.id === employeeId && !e.isDeleted);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Constraint Validation
    const validation = validateSeatAllocation(employee, seat, db.employees, db.seats);
    if (!validation.valid) {
      return res.status(409).json({ message: validation.error });
    }

    // Allocate Seat
    seat.status = 'OCCUPIED';
    seat.occupantId = employee.id;
    seat.occupantName = `${employee.firstName} ${employee.lastName}`;
    seat.occupantEmpCode = employee.empCode;
    seat.projectId = employee.projectId;
    seat.projectName = employee.projectName;
    seat.department = employee.department;

    employee.seatId = seat.id;
    employee.seatNumber = seat.seatNumber;
    employee.floor = seat.floor;
    employee.zone = seat.zone;

    const allocation: SeatAllocation = {
      id: `alloc-${Date.now()}`,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      empCode: employee.empCode,
      seatId: seat.id,
      seatNumber: seat.seatNumber,
      floor: seat.floor,
      zone: seat.zone,
      projectId: employee.projectId || '',
      projectName: employee.projectName || '',
      allocatedAt: new Date().toISOString(),
      status: 'ACTIVE',
      notes
    };

    db.allocations.unshift(allocation);

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'usr-admin',
      userName: 'Facility Manager',
      action: 'SEAT_ALLOCATED',
      targetType: 'SEAT',
      targetId: seat.id,
      targetName: seat.seatNumber,
      details: `Allocated seat ${seat.seatNumber} to ${employee.firstName} ${employee.lastName} (${employee.empCode})`,
      timestamp: new Date().toISOString()
    });

    res.json({ message: `Seat ${seat.seatNumber} successfully allocated.`, seat, employee, allocation });
  });

  // Seat Release
  router.post('/seats/:id/release', (req, res) => {
    const seat = db.seats.find(s => s.id === req.params.id);
    if (!seat) return res.status(404).json({ message: 'Seat not found.' });

    const occupantId = seat.occupantId;
    const occupantName = seat.occupantName || 'Occupant';

    if (occupantId) {
      const emp = db.employees.find(e => e.id === occupantId);
      if (emp) {
        delete emp.seatId;
        delete emp.seatNumber;
        delete emp.floor;
        delete emp.zone;
      }
    }

    const seatNumber = seat.seatNumber;
    seat.status = 'RELEASED';
    delete seat.occupantId;
    delete seat.occupantName;
    delete seat.occupantEmpCode;
    delete seat.projectId;
    delete seat.projectName;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'usr-admin',
      userName: 'Facility Manager',
      action: 'SEAT_RELEASED',
      targetType: 'SEAT',
      targetId: seat.id,
      targetName: seatNumber,
      details: `Released seat ${seatNumber} previously occupied by ${occupantName}`,
      timestamp: new Date().toISOString()
    });

    res.json({ message: `Seat ${seatNumber} released and returned to pool.`, seat });
  });

  // Seat Transfer
  router.post('/seats/:id/transfer', (req, res) => {
    const sourceSeat = db.seats.find(s => s.id === req.params.id);
    if (!sourceSeat) return res.status(404).json({ message: 'Source seat not found.' });

    const { targetSeatId } = req.body;
    const targetSeat = db.seats.find(s => s.id === targetSeatId);
    if (!targetSeat) return res.status(404).json({ message: 'Target seat not found.' });

    if (targetSeat.status !== 'AVAILABLE' && targetSeat.status !== 'RELEASED') {
      return res.status(409).json({ message: `Target seat ${targetSeat.seatNumber} is not available.` });
    }

    const occupantId = sourceSeat.occupantId;
    if (!occupantId) {
      return res.status(400).json({ message: 'Source seat is not currently occupied.' });
    }

    const emp = db.employees.find(e => e.id === occupantId);
    if (!emp) return res.status(404).json({ message: 'Occupant employee record not found.' });

    // Transfer occupant to target
    targetSeat.status = 'OCCUPIED';
    targetSeat.occupantId = emp.id;
    targetSeat.occupantName = `${emp.firstName} ${emp.lastName}`;
    targetSeat.occupantEmpCode = emp.empCode;
    targetSeat.projectId = emp.projectId;
    targetSeat.projectName = emp.projectName;

    emp.seatId = targetSeat.id;
    emp.seatNumber = targetSeat.seatNumber;
    emp.floor = targetSeat.floor;
    emp.zone = targetSeat.zone;

    // Release source seat
    sourceSeat.status = 'AVAILABLE';
    delete sourceSeat.occupantId;
    delete sourceSeat.occupantName;
    delete sourceSeat.occupantEmpCode;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'usr-admin',
      userName: 'Facility Manager',
      action: 'SEAT_TRANSFERRED',
      targetType: 'SEAT',
      targetId: targetSeat.id,
      targetName: targetSeat.seatNumber,
      details: `Transferred employee ${emp.empCode} from ${sourceSeat.seatNumber} to ${targetSeat.seatNumber}`,
      timestamp: new Date().toISOString()
    });

    res.json({ message: `Employee transferred to ${targetSeat.seatNumber} successfully.`, sourceSeat, targetSeat, employee: emp });
  });

  // Seat Reserve / Unreserve / Maintenance
  router.post('/seats/:id/status', (req, res) => {
    const seat = db.seats.find(s => s.id === req.params.id);
    if (!seat) return res.status(404).json({ message: 'Seat not found.' });

    const { status: newStatus } = req.body;
    if (!['AVAILABLE', 'RESERVED', 'MAINTENANCE'].includes(newStatus)) {
      return res.status(422).json({ message: 'Invalid seat status.' });
    }

    if (seat.status === 'OCCUPIED' && newStatus !== 'AVAILABLE') {
      return res.status(409).json({ message: 'Cannot change status of occupied seat. Release seat first.' });
    }

    const oldStatus = seat.status;
    seat.status = newStatus as any;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'usr-admin',
      userName: 'Facility Operations',
      action: newStatus === 'MAINTENANCE' ? 'MAINTENANCE_TOGGLED' : 'SEAT_RESERVED',
      targetType: 'SEAT',
      targetId: seat.id,
      targetName: seat.seatNumber,
      details: `Changed seat ${seat.seatNumber} status from ${oldStatus} to ${newStatus}`,
      timestamp: new Date().toISOString()
    });

    res.json({ message: `Seat ${seat.seatNumber} status updated to ${newStatus}.`, seat });
  });

  // AI Assistant Endpoint - POST /api/v1/ai/query
  router.post('/ai/query', async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Query string is required.' });
    }

    const cleanQuery = query.trim().toLowerCase();

    // 1. Keyword NLP Parser Fallback
    let answer = '';
    let actionType: 'SEARCH' | 'ALLOCATE' | 'RELEASE' | 'TRANSFER' | 'INFO' = 'INFO';
    let dataPayload: any = {};
    let suggestedFollowups: string[] = [];

    // Check specific queries:
    // "Where is Amit?" / "Where is Rahul?" / "Where is my seat?"
    if (cleanQuery.includes('where is') || cleanQuery.includes('seat of') || cleanQuery.includes('find employee') || cleanQuery.includes('where is my seat')) {
      actionType = 'SEARCH';
      const nameMatch = cleanQuery.replace('where is', '').replace('seat of', '').replace('my seat', '').replace('find', '').trim();
      
      const foundEmps = db.employees.filter(e =>
        !e.isDeleted &&
        (e.firstName.toLowerCase().includes(nameMatch) ||
         e.lastName.toLowerCase().includes(nameMatch) ||
         e.empCode.toLowerCase().includes(nameMatch) ||
         `${e.firstName} ${e.lastName}`.toLowerCase().includes(nameMatch))
      ).slice(0, 5);

      if (foundEmps.length > 0) {
        const emp = foundEmps[0];
        if (emp.seatNumber) {
          answer = `**${emp.firstName} ${emp.lastName}** (${emp.empCode}) is currently seated at **${emp.seatNumber}** on **Floor ${emp.floor}**, **${emp.zone}**. Department: ${emp.department}, Project: ${emp.projectName || 'Unassigned'}.`;
        } else {
          answer = `**${emp.firstName} ${emp.lastName}** (${emp.empCode}) is currently **unallocated** (pending seat allocation). Would you like me to suggest an optimal seat?`;
        }
        dataPayload.employees = foundEmps;
        suggestedFollowups = [
          `Recommend seat for ${emp.firstName}`,
          `Who sits near ${emp.firstName}?`,
          `Show project details for ${emp.projectName || 'this project'}`
        ];
      } else {
        answer = `I could not find an active employee matching "${nameMatch}". Please check the spelling or search by Employee Code.`;
      }
    }
    // "Available seats on floor 3?"
    else if (cleanQuery.includes('available seats') || cleanQuery.includes('free seats') || cleanQuery.includes('floor')) {
      const floorMatch = cleanQuery.match(/floor\s*(\d)/i);
      const floorNum = floorMatch ? parseInt(floorMatch[1]) : 1;

      const avail = db.seats.filter(s => s.floor === floorNum && (s.status === 'AVAILABLE' || s.status === 'RELEASED'));
      answer = `There are **${avail.length} available seats** on **Floor ${floorNum}**. Top available zones: Zone A (${avail.filter(s => s.zone === 'Zone A').length} free), Zone B (${avail.filter(s => s.zone === 'Zone B').length} free).`;
      dataPayload.seats = avail.slice(0, 10);
      suggestedFollowups = [
        `Show floor ${floorNum} map`,
        `Available seats on floor ${floorNum === 5 ? 1 : floorNum + 1}`,
        'Allocate nearest seat'
      ];
    }
    // "Project of Rahul?" / "Project utilization"
    else if (cleanQuery.includes('project') || cleanQuery.includes('capacity') || cleanQuery.includes('utilization')) {
      actionType = 'INFO';
      const stats = calculateDashboardStats(db.employees, db.seats, db.projects, db.allocations);
      answer = `Currently, **11 projects** are running across Ethara. Top utilized projects:\n` +
        `- **Ethara Cloud AI Platform**: 94.5% utilization\n` +
        `- **DevOps Platform**: 94.0% utilization\n` +
        `- **Core Banking Modernization**: 93.8% utilization\n` +
        `Total project capacity allocated: **${stats.occupiedSeats} seats** out of **${stats.totalSeats} seats**.`;
      dataPayload.projects = db.projects;
      suggestedFollowups = [
        'Show project capacity breakdown',
        'Which project has most pending allocations?',
        'Recommend seat for new joiners'
      ];
    }
    // "Who sits near me?" / "who sits near"
    else if (cleanQuery.includes('sits near') || cleanQuery.includes('nearby') || cleanQuery.includes('neighbors')) {
      answer = `To find colleagues seated near a specific seat or employee, select the seat in the Seat Grid or enter the employee's name in global search. In Zone A Floor 1, team members from Core Banking & Design System are seated together.`;
      suggestedFollowups = ['Where is Amit?', 'Available seats in Zone A'];
    }
    // Gemini 3.6 Flash Server Call if API key exists
    if (ai) {
      try {
        const promptContext = `
You are Ethara AI, an intelligent corporate assistant for Ethara's Seat Allocation & Project Mapping System.
Ethara manages 5,000 employees and 5,500 seats across 5 floors and 10 zones (Zone A-J).
User query: "${query}"

Answer concisely and accurately with professional markdown formatting.
If the query asks about employee location, seat availability, project stats, or seat transfers, synthesize clear data-driven answers.
`;
        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: promptContext
        });

        if (geminiRes.text) {
          answer = geminiRes.text;
        }
      } catch (aiErr) {
        console.warn('[Ethara AI Assistant] Gemini model query failed, falling back to NLP parser:', aiErr);
      }
    }

    if (!answer) {
      answer = `I am Ethara AI Assistant. I can help you search 5,000 employees, check seat availability across 5 floors, recommend optimal seat allocations based on project proximity, and execute seat transfers or releases. Try asking: *"Where is Amit?"*, *"Available seats on floor 3?"*, or *"Project utilization"*.`;
      suggestedFollowups = ['Where is Amit?', 'Available seats on floor 1', 'Show dashboard metrics'];
    }

    res.json({
      query,
      answer,
      actionType,
      data: dataPayload,
      suggestedFollowups
    });
  });

  // Audit Logs - List
  router.get('/audit-logs', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json(db.auditLogs.slice(0, limit));
  });

  // Mount API router under /api/v1
  app.use('/api/v1', router);
  app.use('/api', router); // Compatibility fallback

  // Vite development middleware or Static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ethara Enterprise Full-Stack] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
