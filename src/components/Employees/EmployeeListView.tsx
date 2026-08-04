import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Trash2,
  Pencil,
  Save,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
  Building,
  Briefcase,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Employee, Project, DepartmentName, EmployeeRole, NewJoinerFormData } from '../../types';
import { api } from '../../services/api';

interface EmployeeListViewProps {
  projects: Project[];
  onSelectEmployeeForSeat: (emp: Employee) => void;
  onRefreshStats: () => void;
  // NEW: optional project id passed from other views (e.g. clicking
  // "View Assigned Employees" on a Project card) to pre-filter the table.
  initialProjectFilter?: string;
}

export const EmployeeListView: React.FC<EmployeeListViewProps> = ({
  projects,
  onSelectEmployeeForSeat,
  onRefreshStats,
  initialProjectFilter
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  // NEW: initialize from the incoming prop instead of always 'ALL'
  const [project, setProject] = useState(initialProjectFilter || 'ALL');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('empCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editFormData, setEditFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    department: DepartmentName;
    role: EmployeeRole;
    joiningDate: string;
    projectId: string;
    isActive: boolean;
  } | null>(null);

  // New Employee Form
  const [formData, setFormData] = useState<NewJoinerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    empCode: '',
    department: 'Engineering',
    role: 'Software Engineer',
    joiningDate: new Date().toISOString().slice(0, 10),
    projectId: projects[0]?.id || ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState('');
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk CSV text input / file upload state
  const [csvText, setCsvText] = useState('');
  const [bulkImportResult, setBulkImportResult] = useState<{ addedCount: number; skippedCount: number; errors: string[] } | null>(null);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // NEW: whenever the incoming initialProjectFilter changes (e.g. user
  // clicks "View Assigned Employees" on a different project while this
  // view is already mounted), sync it into the local project filter state
  // and jump back to page 1.
  useEffect(() => {
    if (initialProjectFilter) {
      setProject(initialProjectFilter);
      setPage(1);
    }
  }, [initialProjectFilter]);

  // Fetch Employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.getEmployees({
        page,
        limit,
        search,
        department,
        project,
        status,
        sortBy,
        sortOrder
      });
      setEmployees(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, limit, search, department, project, status, sortBy, sortOrder]);

  // Handle Add Employee submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.empCode) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createEmployee(formData);
      setIsAddModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        empCode: '',
        department: 'Engineering',
        role: 'Software Engineer',
        joiningDate: new Date().toISOString().slice(0, 10),
        projectId: projects[0]?.id || ''
      });
      fetchEmployees();
      onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create employee.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Soft Delete
  const handleDeleteEmployee = async (emp: Employee) => {
    if (confirm(`Are you sure you want to delete employee ${emp.firstName} ${emp.lastName} (${emp.empCode})? Any assigned seat will be released.`)) {
      try {
        await api.deleteEmployee(emp.id);
        fetchEmployees();
        onRefreshStats();
      } catch (err) {
        alert('Failed to delete employee.');
      }
    }
  };

  const openEditEmployee = (emp: Employee) => {
    setIsAddModalOpen(false);
    setSelectedEmployee(emp);
    setEditFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      joiningDate: emp.joiningDate,
      projectId: emp.projectId || '',
      isActive: emp.isActive
    });
    setEditFormError('');
    setEditFieldErrors({});
  };

  const closeEditEmployee = () => {
    setSelectedEmployee(null);
    setEditFormData(null);
    setEditFormError('');
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !editFormData) return;

    const nextErrors: Record<string, string> = {};
    if (!editFormData.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!editFormData.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!editFormData.email.trim()) nextErrors.email = 'Email is required.';
    if (!editFormData.department) nextErrors.department = 'Department is required.';
    if (!editFormData.role) nextErrors.role = 'Role is required.';
    if (!editFormData.joiningDate.trim()) nextErrors.joiningDate = 'Joining date is required.';

    setEditFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const patch: {
      firstName?: string;
      lastName?: string;
      email?: string;
      department?: string;
      role?: string;
      joiningDate?: string;
      projectId?: string;
      isActive?: boolean;
    } = {};

    const normalizedEmail = editFormData.email.trim().toLowerCase();
    if (editFormData.firstName.trim() !== selectedEmployee.firstName) patch.firstName = editFormData.firstName.trim();
    if (editFormData.lastName.trim() !== selectedEmployee.lastName) patch.lastName = editFormData.lastName.trim();
    if (normalizedEmail !== selectedEmployee.email.toLowerCase()) patch.email = normalizedEmail;
    if (editFormData.department !== selectedEmployee.department) patch.department = editFormData.department;
    if (editFormData.role !== selectedEmployee.role) patch.role = editFormData.role;
    if (editFormData.joiningDate !== selectedEmployee.joiningDate) patch.joiningDate = editFormData.joiningDate;
    if ((editFormData.projectId || '') !== (selectedEmployee.projectId || '')) patch.projectId = editFormData.projectId;
    if (editFormData.isActive !== selectedEmployee.isActive) patch.isActive = editFormData.isActive;

    setEditSubmitting(true);
    setEditFormError('');

    try {
      await api.updateEmployee(selectedEmployee.id, patch);
      closeEditEmployee();
      setToastMessage({ type: 'success', text: 'Employee updated successfully.' });
      fetchEmployees();
      onRefreshStats();
    } catch (err: any) {
      const message = err.message || 'Failed to update employee.';
      if (message.toLowerCase().includes('duplicate email violation')) {
        setEditFieldErrors({ email: message });
      }
      setEditFormError(message);
      setToastMessage({ type: 'error', text: message });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    const headers = 'Employee Code,First Name,Last Name,Email,Department,Role,Joining Date,Project,Seat Number,Floor,Zone\n';
    const rows = employees
      .map(
        e =>
          `"${e.empCode}","${e.firstName}","${e.lastName}","${e.email}","${e.department}","${e.role}","${e.joiningDate}","${
            e.projectName || ''
          }","${e.seatNumber || ''}","${e.floor || ''}","${e.zone || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ethara_employees_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Bulk Import CSV submission
  const handleBulkImportSubmit = async () => {
    if (!csvText.trim()) return;

    const lines = csvText.trim().split('\n');
    const parsedList: Partial<Employee>[] = [];

    lines.forEach(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
      if (cols.length >= 4 && cols[0] && cols[3]) {
        // Assume format: empCode, firstName, lastName, email, department, role
        parsedList.push({
          empCode: cols[0],
          firstName: cols[1],
          lastName: cols[2],
          email: cols[3],
          department: (cols[4] as DepartmentName) || 'Engineering',
          role: (cols[5] as EmployeeRole) || 'Software Engineer'
        });
      }
    });

    try {
      const res = await api.bulkImportEmployees(parsedList);
      setBulkImportResult(res);
      fetchEmployees();
      onRefreshStats();
    } catch (err: any) {
      alert(err.message || 'Bulk import failed.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur-xs ${
            toastMessage.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="font-semibold text-xs">{toastMessage.text}</div>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" /> Employee Directory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Managing {total.toLocaleString()} active employees across 11 departments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-purple-500" /> Bulk CSV Import
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name, code (EMP-1001), email, role..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Dept:</span>
          <select
            value={department}
            onChange={e => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Data & AI">Data & AI</option>
            <option value="Cloud & DevOps">Cloud & DevOps</option>
            <option value="Quality Assurance">Quality Assurance</option>
            <option value="Cyber Security">Cyber Security</option>
          </select>
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Project:</span>
          <select
            value={project}
            onChange={e => {
              setProject(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Seat Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Seat Status:</span>
          <select
            value={status}
            onChange={e => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="">All Employees</option>
            <option value="ALLOCATED">Seated / Allocated</option>
            <option value="PENDING">Unallocated / Pending</option>
          </select>
        </div>
      </div>

      {/* Main Employee Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="p-4">Employee Code</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Department & Role</th>
                <th className="p-4">Assigned Project</th>
                <th className="p-4">Allocated Seat</th>
                <th className="p-4">Joining Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading employee records...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No employees matching the selected criteria.
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {emp.empCode}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900 dark:text-white">{emp.role}</div>
                      <div className="text-[11px] text-slate-400">{emp.department}</div>
                    </td>
                    <td className="p-4">
                      {emp.projectName ? (
                        <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-medium text-[11px]">
                          {emp.projectName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      {emp.seatNumber ? (
                        <div className="flex items-center gap-1.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{emp.seatNumber}</span>
                          <span className="text-[10px] text-slate-400 font-sans font-normal">(F{emp.floor} • {emp.zone})</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onSelectEmployeeForSeat(emp)}
                          className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold text-[11px] hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" /> Allocate Seat
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {emp.joiningDate}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEditEmployee(emp)}
                        className="p-1.5 mr-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                        title="Edit Employee"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-900 dark:text-white">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-bold text-slate-900 dark:text-white">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{total.toLocaleString()}</span> employees
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={e => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-semibold text-slate-900 dark:text-white">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" /> Add New Employee Record
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Emp Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-5001"
                    value={formData.empCode}
                    onChange={e => setFormData({ ...formData, empCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@ethara.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value as DepartmentName })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Cyber Security">Cyber Security</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Senior Engineer">Senior Engineer</option>
                    <option value="Staff Engineer">Staff Engineer</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="DevOps Lead">DevOps Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Project</label>
                <select
                  value={formData.projectId}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">None / Unassigned</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                >
                  {submitting ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {selectedEmployee && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-500" /> Edit Employee Record
              </h3>
              <button onClick={closeEditEmployee} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              {editFormError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {editFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={selectedEmployee.id}
                    disabled
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={selectedEmployee.empCode}
                    disabled
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee Name *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={editFormData.firstName}
                      onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    {editFieldErrors.firstName && <div className="mt-1 text-[11px] text-rose-500">{editFieldErrors.firstName}</div>}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    {editFieldErrors.lastName && <div className="mt-1 text-[11px] text-rose-500">{editFieldErrors.lastName}</div>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  {editFieldErrors.email && <div className="mt-1 text-[11px] text-rose-500">{editFieldErrors.email}</div>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employment Status *</label>
                  <select
                    value={editFormData.isActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={e => setEditFormData({ ...editFormData, isActive: e.target.value === 'ACTIVE' })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
                  <select
                    value={editFormData.department}
                    onChange={e => setEditFormData({ ...editFormData, department: e.target.value as DepartmentName })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Cyber Security">Cyber Security</option>
                  </select>
                  {editFieldErrors.department && <div className="mt-1 text-[11px] text-rose-500">{editFieldErrors.department}</div>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                  <select
                    value={editFormData.role}
                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value as EmployeeRole })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Senior Engineer">Senior Engineer</option>
                    <option value="Staff Engineer">Staff Engineer</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="DevOps Lead">DevOps Lead</option>
                  </select>
                  {editFieldErrors.role && <div className="mt-1 text-[11px] text-rose-500">{editFieldErrors.role}</div>}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Assignment</label>
                <select
                  value={editFormData.projectId}
                  onChange={e => setEditFormData({ ...editFormData, projectId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">None / Unassigned</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Joining Date *</label>
                  <input
                    type="date"
                    value={editFormData.joiningDate}
                    onChange={e => setEditFormData({ ...editFormData, joiningDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  {editFieldErrors.joiningDate && <div className="mt-1 text-[11px] text-rose-500">{editFieldErrors.joiningDate}</div>}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditEmployee}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-60 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import CSV Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-500" /> Bulk Import Employees (CSV)
              </h3>
              <button onClick={() => setIsBulkImportOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Paste CSV rows in format: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm">empCode, firstName, lastName, email, department, role</code>
              </p>

              <textarea
                rows={6}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={`EMP-6001, Rohan, Sharma, rohan.sharma@ethara.com, Engineering, Senior Engineer\nEMP-6002, Aditi, Gupta, aditi.gupta@ethara.com, Product, Product Manager`}
                className="w-full p-3 font-mono rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              />

              {bulkImportResult && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    Added: {bulkImportResult.addedCount} | Skipped: {bulkImportResult.skippedCount}
                  </div>
                  {bulkImportResult.errors.length > 0 && (
                    <div className="text-[11px] text-rose-500 space-y-0.5">
                      {bulkImportResult.errors.map((err, i) => <div key={i}>{err}</div>)}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkImportOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  onClick={handleBulkImportSubmit}
                  className="px-5 py-2 rounded-xl text-white font-semibold bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20"
                >
                  Process Bulk Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};