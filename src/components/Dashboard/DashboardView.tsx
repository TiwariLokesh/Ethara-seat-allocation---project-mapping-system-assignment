import React from 'react';
import {
  Users,
  Grid3X3,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { DashboardStats } from '../../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigateToTab: (tab: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f97316'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  loading,
  onNavigateToTab
}) => {
  if (loading || !stats) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Ethara Enterprise Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time occupancy metrics for 5,000 employees & 5,500 seats across 5 floors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('new-joiner')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Onboard New Joiner
          </button>
          <button
            onClick={() => onNavigateToTab('seats')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <Grid3X3 className="w-4 h-4 text-emerald-500" /> Live Seat Grid
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Employees KPI */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Employees
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.totalEmployees.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +12% YoY
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-amber-500 font-semibold">{stats.pendingAllocation}</span> pending seat allocation
          </div>
        </div>

        {/* Total Seats KPI */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Seats
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Grid3X3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.totalSeats.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              5 Floors • 10 Zones
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Occupancy Rate:</span>
            <span className="font-bold text-slate-900 dark:text-white">{stats.overallOccupancyRate}%</span>
          </div>
        </div>

        {/* Occupied Seats KPI */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Occupied Seats
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.occupiedSeats.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {((stats.occupiedSeats / stats.totalSeats) * 100).toFixed(1)}% of total
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full"
              style={{ width: `${stats.overallOccupancyRate}%` }}
            ></div>
          </div>
        </div>

        {/* Available Pool KPI */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Available Pool
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.availableSeats.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Ready to allocate
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Reserved: {stats.reservedSeats}</span>
            <span>Maint: {stats.maintenanceSeats}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Floor Occupancy Bar Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" /> Floor Occupancy & Capacity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Distribution of occupied vs available seats across Floor 1 to Floor 5.
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.floorOccupancy}>
                <XAxis dataKey="floor" tickFormatter={f => `Floor ${f}`} stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="occupied" name="Occupied" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="available" name="Available" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Utilization Bar Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-500" /> Project Seat Utilization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Seat assignment percentages by active enterprise project.
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.projectUtilization.slice(0, 7)} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" />
                <YAxis dataKey="projectName" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="utilizationRate" name="Utilization %" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Floor Heatmap Grid */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Enterprise Floor Density Heatmap
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live density mapping across 5 Floors x 10 Zones (Zone A to Zone J).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Density:</span>
            <span className="px-2 py-0.5 rounded-sm bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">Low</span>
            <span className="px-2 py-0.5 rounded-sm bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">Med</span>
            <span className="px-2 py-0.5 rounded-sm bg-indigo-600 text-white font-semibold">High</span>
          </div>
        </div>

        {/* Heatmap Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="p-3 font-semibold uppercase">Floor</th>
                {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J'].map(z => (
                  <th key={z} className="p-3 font-semibold uppercase text-center">{z}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3, 4, 5].map(floorNum => (
                <tr key={floorNum} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">Floor {floorNum}</td>
                  {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J'].map(zoneName => {
                    const cell = stats.heatMapData.find(h => h.floor === floorNum && h.zone === zoneName);
                    const density = cell ? cell.density : 0;
                    
                    let bgClass = 'bg-slate-100 dark:bg-slate-800/50 text-slate-500';
                    if (density >= 0.9) bgClass = 'bg-indigo-600 text-white font-bold';
                    else if (density >= 0.7) bgClass = 'bg-indigo-500/80 text-white font-medium';
                    else if (density >= 0.4) bgClass = 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium';
                    else bgClass = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';

                    return (
                      <td key={zoneName} className="p-2 text-center">
                        <button
                          onClick={() => onNavigateToTab('seats')}
                          className={`w-full py-2 px-1 rounded-lg text-[11px] transition-transform hover:scale-105 cursor-pointer ${bgClass}`}
                          title={`Floor ${floorNum} ${zoneName}: ${cell ? cell.occupied : 0} / ${cell ? cell.total : 0} seats (${Math.round(density * 100)}%)`}
                        >
                          {Math.round(density * 100)}%
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Row: Department Distribution & Monthly Joiner Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Pie Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Department Employee Headcount
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.departmentDistribution}
                  dataKey="employeeCount"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ department, percent }) => `${department} (${(percent * 100).toFixed(0)}%)`}
                >
                  {stats.departmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Joiners Trend */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Monthly New Joiners Velocity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyJoiners}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="New Joiners" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
