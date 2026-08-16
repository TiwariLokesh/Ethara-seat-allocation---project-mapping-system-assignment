import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertOctagon,
  RefreshCw,
  ArrowRightLeft,
  X,
  UserCheck,
  Building2,
  ShieldAlert,
  ChevronRight,
  Info
} from 'lucide-react';
import { Seat, Employee, Project } from '../../types';
import { api } from '../../services/api';

interface SeatMapViewProps {
  employees: Employee[];
  projects: Project[];
  onRefreshStats: () => void;
  preselectedSeat?: Seat | null;
  preselectedEmployee?: Employee | null;
}

export const SeatMapView: React.FC<SeatMapViewProps> = ({
  employees,
  projects,
  onRefreshStats,
  preselectedSeat,
  preselectedEmployee
}) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedZone, setSelectedZone] = useState<string>('Zone A');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSeat, setActiveSeat] = useState<Seat | null>(preselectedSeat || null);

  // Seat Operation Drawer States
  const [drawerMode, setDrawerMode] = useState<'VIEW' | 'ALLOCATE' | 'TRANSFER'>('VIEW');
  const [selectedEmpForAllocation, setSelectedEmpForAllocation] = useState<string>(preselectedEmployee?.id || '');
  const [transferTargetSeatId, setTransferTargetSeatId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('');

  // Fetch seats for currently selected floor & zone
  const fetchSeats = async () => {
    setLoading(true);
    try {
      const res = await api.getSeats({
        floor: selectedFloor,
        zone: selectedZone,
        status: statusFilter,
        search,
        limit: 200
      });
      setSeats(res.items);
    } catch (err) {
      console.error('Failed to fetch seats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, [selectedFloor, selectedZone, statusFilter, search]);

  useEffect(() => {
  if (preselectedSeat) {
    setSelectedFloor(preselectedSeat.floor);
    setSelectedZone(preselectedSeat.zone);
    setActiveSeat(preselectedSeat);
  }

 
  if (preselectedEmployee) {
    setSelectedEmpForAllocation(preselectedEmployee.id);
    setDrawerMode('ALLOCATE');
  }
}, [preselectedSeat, preselectedEmployee]); 

  // Handle Allocate Seat
  const handleAllocateSeat = async () => {
    if (!activeSeat || !selectedEmpForAllocation) return;
    setSubmitting(true);
    setActionMessage('');
    try {
      const res = await api.allocateSeat(activeSeat.id, selectedEmpForAllocation);
      setActionMessage(res.message);
      setActiveSeat(res.seat);
      fetchSeats();
      onRefreshStats();
      setDrawerMode('VIEW');
    } catch (err: any) {
      setActionMessage(err.message || 'Allocation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Release Seat
  const handleReleaseSeat = async () => {
    if (!activeSeat) return;
    if (confirm(`Are you sure you want to release seat ${activeSeat.seatNumber}?`)) {
      setSubmitting(true);
      try {
        const res = await api.releaseSeat(activeSeat.id);
        setActionMessage(res.message);
        setActiveSeat(res.seat);
        fetchSeats();
        onRefreshStats();
      } catch (err: any) {
        setActionMessage(err.message || 'Release failed.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Handle Transfer Seat
  const handleTransferSeat = async () => {
    if (!activeSeat || !transferTargetSeatId) return;
    setSubmitting(true);
    try {
      const res = await api.transferSeat(activeSeat.id, transferTargetSeatId);
      setActionMessage(res.message);
      setActiveSeat(res.sourceSeat);
      fetchSeats();
      onRefreshStats();
      setDrawerMode('VIEW');
    } catch (err: any) {
      setActionMessage(err.message || 'Transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Maintenance / Reserve
  const handleSetStatus = async (status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE') => {
    if (!activeSeat) return;
    setSubmitting(true);
    try {
      const res = await api.setSeatStatus(activeSeat.id, status);
      setActionMessage(res.message);
      setActiveSeat(res.seat);
      fetchSeats();
      onRefreshStats();
    } catch (err: any) {
      setActionMessage(err.message || 'Status change failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const unallocatedEmployees = employees.filter(e => !e.seatId && !e.isDeleted);
  const availableTargetSeats = seats.filter(s => (s.status === 'AVAILABLE' || s.status === 'RELEASED') && s.id !== activeSeat?.id);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-emerald-500" /> Interactive Seat Map Grid
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualizing 5,500 seats across 5 floors x 10 zones. Click any seat to inspect, allocate or transfer.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Occupied
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Reserved
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Maint
          </span>
        </div>
      </div>

      {/* Floor & Zone Selection Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        {/* Floor Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">Floors:</span>
          {[1, 2, 3, 4, 5].map(floorNum => (
            <button
              key={floorNum}
              onClick={() => setSelectedFloor(floorNum)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                selectedFloor === floorNum
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Floor {floorNum}
            </button>
          ))}
        </div>

        {/* Zone Selector & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Zones:</span>
            {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J'].map(z => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                  selectedZone === z
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="RESERVED">Reserved</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>

            {/* Quick Search */}
            <div className="relative w-full xs:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Find seat or occupant..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Seat Map Grid Container */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Grid Canvas */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>
              Floor {selectedFloor} • {selectedZone} ({seats.length} seats)
            </span>
            <span>Bays 1 - 4</span>
          </div>

          {loading ? (
            <div className="py-24 text-center text-slate-400 animate-pulse font-medium">
              Loading seat layout for Floor {selectedFloor} {selectedZone}...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <div className="min-w-[620px] grid grid-cols-10 md:grid-cols-11 gap-2.5 max-h-[600px] overflow-y-auto p-2 border border-slate-100 dark:border-slate-800/80 rounded-xl">
              {seats.map(seat => {
                const isSelected = activeSeat?.id === seat.id;

                let colorStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20';
                if (seat.status === 'OCCUPIED') {
                  colorStyle = 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700';
                } else if (seat.status === 'RESERVED') {
                  colorStyle = 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
                } else if (seat.status === 'MAINTENANCE') {
                  colorStyle = 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 hover:bg-rose-500/30';
                }

                return (
                  <button
                    key={seat.id}
                    onClick={() => {
                      setActiveSeat(seat);
                      setDrawerMode('VIEW');
                      setActionMessage('');
                    }}
                    className={`relative min-h-14 p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer font-mono ${colorStyle} ${
                      isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105 shadow-md' : ''
                    }`}
                  >
                    <span className="text-[11px] font-bold">{seat.seatNumber.split('-')[2]}</span>
                    <span className="text-[9px] uppercase opacity-75 font-sans mt-0.5 font-semibold">
                      {seat.status.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
              </div>
            </div>
          )}
        </div>

        {/* Seat Operations Drawer Panel */}
        {activeSeat && (
          <div className="w-full lg:w-96 p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-lg flex flex-col justify-between space-y-6 animate-in slide-in-from-right-5 duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold text-sm">
                    F{activeSeat.floor}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      {activeSeat.seatNumber}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Floor {activeSeat.floor} • {activeSeat.zone} • Bay {activeSeat.bay}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSeat(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {actionMessage && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  {actionMessage}
                </div>
              )}

              {/* Status Badge */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Seat Status:</span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    activeSeat.status === 'AVAILABLE'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : activeSeat.status === 'OCCUPIED'
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {activeSeat.status}
                </span>
              </div>

              {/* Occupant Details if Seated */}
              {activeSeat.status === 'OCCUPIED' && activeSeat.occupantName && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-500" /> {activeSeat.occupantName}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>Emp Code:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {activeSeat.occupantEmpCode}
                    </span>
                  </div>
                  {activeSeat.projectName && (
                    <div className="text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>Project:</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {activeSeat.projectName}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW / ALLOCATE Mode Form */}
              {drawerMode === 'ALLOCATE' && (
                <div className="mt-4 space-y-3 text-xs">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Select Unallocated Employee:
                  </label>
                  <select
                    value={selectedEmpForAllocation}
                    onChange={e => setSelectedEmpForAllocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">-- Choose Employee --</option>
                    {unallocatedEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.empCode}) - {emp.department}
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={!selectedEmpForAllocation || submitting}
                    onClick={handleAllocateSeat}
                    className="w-full py-2.5 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    Confirm Allocation
                  </button>
                </div>
              )}

              {/* TRANSFER Mode Form */}
              {drawerMode === 'TRANSFER' && (
                <div className="mt-4 space-y-3 text-xs">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Select Target Available Seat:
                  </label>
                  <select
                    value={transferTargetSeatId}
                    onChange={e => setTransferTargetSeatId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="">-- Choose Destination Seat --</option>
                    {availableTargetSeats.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.seatNumber} (Floor {s.floor} {s.zone})
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={!transferTargetSeatId || submitting}
                    onClick={handleTransferSeat}
                    className="w-full py-2.5 rounded-xl text-white font-semibold bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    Execute Transfer
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {drawerMode === 'VIEW' && (
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                {activeSeat.status === 'AVAILABLE' || activeSeat.status === 'RELEASED' ? (
                  <button
                    onClick={() => setDrawerMode('ALLOCATE')}
                    className="w-full py-2.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Allocate This Seat
                  </button>
                ) : null}

                {activeSeat.status === 'OCCUPIED' && (
                  <>
                    <button
                      onClick={() => setDrawerMode('TRANSFER')}
                      className="w-full py-2.5 rounded-xl text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowRightLeft className="w-4 h-4" /> Transfer Occupant
                    </button>
                    <button
                      onClick={handleReleaseSeat}
                      className="w-full py-2.5 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20 hover:bg-rose-100 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Release Seat to Pool
                    </button>
                  </>
                )}

                {/* Maintenance / Reserve toggles */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleSetStatus(activeSeat.status === 'RESERVED' ? 'AVAILABLE' : 'RESERVED')}
                    className="py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-100 cursor-pointer text-center"
                  >
                    {activeSeat.status === 'RESERVED' ? 'Unreserve' : 'Reserve'}
                  </button>
                  <button
                    onClick={() => handleSetStatus(activeSeat.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE')}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 cursor-pointer text-center"
                  >
                    {activeSeat.status === 'MAINTENANCE' ? 'Clear Maint' : 'Maintenance'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
