import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Users, CheckCircle, BarChart2, Layers, AlertCircle, X } from 'lucide-react';
import { Project, DepartmentName } from '../../types';
import { api } from '../../services/api';

interface ProjectListViewProps {
  projects: Project[];
  onRefreshProjects: () => void;
  onNavigateToEmployeesWithProjectFilter: (projectId: string) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  projects,
  onRefreshProjects,
  onNavigateToEmployeesWithProjectFilter
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    managerName: '',
    managerEmail: '',
    department: 'Engineering' as DepartmentName,
    capacity: 200,
    preferredFloor: 1,
    preferredZone: 'Zone A'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // NEW: toast state, same pattern as EmployeeListView
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // NEW: auto-dismiss the toast after 3 seconds
  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.managerName) {
      setError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createProject(formData);
      setIsAddModalOpen(false);
      // NEW: success toast so the user gets immediate feedback without
      // needing to scroll down to see the new card.
      setToastMessage({ type: 'success', text: `Project "${formData.name}" created successfully.` });
      setFormData({
        name: '',
        code: '',
        description: '',
        managerName: '',
        managerEmail: '',
        department: 'Engineering',
        capacity: 200,
        preferredFloor: 1,
        preferredZone: 'Zone A'
      });
      onRefreshProjects();
    } catch (err: any) {
      const message = err.message || 'Failed to create project.';
      setError(message);
      // NEW: error toast alongside the existing inline modal error
      setToastMessage({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* NEW: Toast Notification */}
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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-500" /> Enterprise Projects
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tracking capacity, seat utilization, and team allocations for {projects.length} core engineering projects.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(prj => {
          const utilPct = prj.seatUtilization || 0;
          return (
            <div
              key={prj.id}
              className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-purple-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {prj.code}
                  </span>
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {prj.status}
                  </span>
                </div>

                {/* Project Title */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {prj.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {prj.description || 'Enterprise platform initiative.'}
                </p>

                {/* Manager info */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Engineering Manager:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{prj.managerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Target Floor / Zone:</span>
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      Floor {prj.preferredFloor || 1} • {prj.preferredZone || 'Zone A'}
                    </span>
                  </div>
                </div>

                {/* Seat Utilization Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Seat Utilization:</span>
                    <span className="text-slate-900 dark:text-white font-mono">{utilPct}% ({prj.assignedCount || 0}/{prj.capacity})</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        utilPct >= 90 ? 'bg-purple-600' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, utilPct)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onNavigateToEmployeesWithProjectFilter(prj.id)}
                  className="w-full py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" /> View Assigned Employees ({prj.assignedCount})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[calc(100dvh-1.5rem)] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-500" /> Create New Enterprise Project
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Next-Gen Mobile Payments"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="PRJ-PAY-12"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Capacity Seats *</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Manager Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.managerName}
                    onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Manager Email</label>
                  <input
                    type="email"
                    value={formData.managerEmail}
                    onChange={e => setFormData({ ...formData, managerEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Floor</label>
                  <select
                    value={formData.preferredFloor}
                    onChange={e => setFormData({ ...formData, preferredFloor: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5].map(f => (
                      <option key={f} value={f}>Floor {f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Zone</label>
                  <select
                    value={formData.preferredZone}
                    onChange={e => setFormData({ ...formData, preferredZone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J'].map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
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
                  className="px-5 py-2 rounded-xl text-white font-semibold bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
