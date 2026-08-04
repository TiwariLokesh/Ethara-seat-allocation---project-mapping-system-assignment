import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Grid3X3,
  UserPlus,
  Bot,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  pendingCount = 50
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users, badge: '5,000' },
    { id: 'projects', label: 'Projects', icon: Briefcase, badge: '11' },
    { id: 'seats', label: 'Seat Map Grid', icon: Grid3X3, badge: '5,500' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, highlight: true },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-500/25 shrink-0">
            E
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white tracking-wide text-base truncate">Ethara</span>
              <span className="text-xs text-indigo-400 font-medium truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" /> Enterprise v1.0
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all relative ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : item.highlight
                  ? 'bg-slate-800/80 text-indigo-300 hover:bg-indigo-950/50 hover:text-indigo-200 border border-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${
                    item.badgeColor
                      ? item.badgeColor
                      : isActive
                      ? 'bg-white/20 text-white border-transparent'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Facility Status Card */}
      {!collapsed && (
        <div className="p-4 m-3 rounded-2xl bg-slate-800/50 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-emerald-400" /> Facility Occupancy
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-white">88.2%</span>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Optimal
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: '88.2%' }}></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">5 Floors • 10 Zones • 5,500 Seats</p>
        </div>
      )}

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
            AM
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">Amit Sharma</span>
              <span className="text-[11px] text-slate-400 truncate">Facility Admin</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
