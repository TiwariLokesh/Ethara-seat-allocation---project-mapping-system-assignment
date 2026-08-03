import React, { useState, useEffect } from 'react';
import { Search, User, Grid3X3, Briefcase, Building, X, ArrowRight } from 'lucide-react';
import { Employee, Seat, Project } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  seats: Seat[];
  projects: Project[];
  onSelectEmployee: (emp: Employee) => void;
  onSelectSeat: (seat: Seat) => void;
  onSelectProject: (project: Project) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  employees,
  seats,
  projects,
  onSelectEmployee,
  onSelectSeat,
  onSelectProject
}) => {
  const [query, setQuery] = useState('');

  // Shortcut key listener ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const filteredEmployees = cleanQuery
    ? employees.filter(
        e =>
          e.firstName.toLowerCase().includes(cleanQuery) ||
          e.lastName.toLowerCase().includes(cleanQuery) ||
          e.empCode.toLowerCase().includes(cleanQuery) ||
          e.email.toLowerCase().includes(cleanQuery) ||
          e.department.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : employees.slice(0, 3);

  const filteredSeats = cleanQuery
    ? seats.filter(
        s =>
          s.seatNumber.toLowerCase().includes(cleanQuery) ||
          (s.occupantName && s.occupantName.toLowerCase().includes(cleanQuery)) ||
          s.zone.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : seats.filter(s => s.status === 'AVAILABLE').slice(0, 3);

  const filteredProjects = cleanQuery
    ? projects.filter(
        p =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.code.toLowerCase().includes(cleanQuery) ||
          p.department.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : projects.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-indigo-500 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search 5,000 employees, 5,500 seats, projects, departments, zones..."
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-hidden font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Employees Category */}
          {filteredEmployees.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5 text-indigo-500" /> Employees ({filteredEmployees.length})
              </div>
              <div className="space-y-1">
                {filteredEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      onSelectEmployee(emp);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800/80 transition-colors group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {emp.firstName} {emp.lastName}
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                            {emp.empCode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {emp.role} • {emp.department} • {emp.seatNumber ? `Seat ${emp.seatNumber}` : 'Unallocated'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seats Category */}
          {filteredSeats.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Grid3X3 className="w-3.5 h-3.5 text-emerald-500" /> Seats ({filteredSeats.length})
              </div>
              <div className="space-y-1">
                {filteredSeats.map(seat => (
                  <button
                    key={seat.id}
                    onClick={() => {
                      onSelectSeat(seat);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800/80 transition-colors group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        F{seat.floor}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                          {seat.seatNumber}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-sans uppercase font-bold ${
                              seat.status === 'AVAILABLE'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : seat.status === 'OCCUPIED'
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {seat.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Floor {seat.floor} • {seat.zone} • Bay {seat.bay} {seat.occupantName ? `• ${seat.occupantName}` : ''}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects Category */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Projects ({filteredProjects.length})
              </div>
              <div className="space-y-1">
                {filteredProjects.map(prj => (
                  <button
                    key={prj.id}
                    onClick={() => {
                      onSelectProject(prj);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-800/80 transition-colors group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {prj.code.slice(0, 3)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {prj.name}
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                            {prj.code}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Manager: {prj.managerName} • Capacity: {prj.capacity} • {prj.department}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredEmployees.length === 0 && filteredSeats.length === 0 && filteredProjects.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Building className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-50" />
              <p className="font-semibold text-sm">No matching records found</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for "Amit", "F3-ZA", "Core Banking", or "Engineering".</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm font-mono text-[10px]">
              ESC
            </kbd>
            <span>to close</span>
          </div>
          <span>Indexing 5,000 Employees & 5,500 Seats</span>
        </div>
      </div>
    </div>
  );
};
