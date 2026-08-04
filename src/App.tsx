import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { DashboardView } from './components/Dashboard/DashboardView';
import { EmployeeListView } from './components/Employees/EmployeeListView';
import { ProjectListView } from './components/Projects/ProjectListView';
import { SeatMapView } from './components/Seats/SeatMapView';
import { NewJoinerWizard } from './components/Allocation/NewJoinerWizard';
import { AIAssistantDrawer } from './components/AIAssistant/AIAssistantDrawer';
import { AuditLogView } from './components/Audit/AuditLogView';
import { Employee, Project, Seat, DashboardStats } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [collapsedSidebar, setCollapsedSidebar] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Modals & Drawers
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);

  // Core Global Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Cross-view selection handlers
  const [preselectedSeat, setPreselectedSeat] = useState<Seat | null>(null);
  const [preselectedEmployee, setPreselectedEmployee] = useState<Employee | null>(null);

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, projectsData, empData, seatsData] = await Promise.all([
        api.getDashboardStats(),
        api.getProjects(),
        api.getEmployees({ limit: 100 }),
        api.getSeats({ limit: 100 })
      ]);
      setStats(statsData);
      setProjects(projectsData);
      setEmployees(empData.items);
      setSeats(seatsData.items);
    } catch (err) {
      console.error('Error loading initial Ethara data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set html dark class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSelectEmployeeForSeat = (emp: Employee) => {
    setPreselectedEmployee(emp);
    setActiveTab('seats');
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-300`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsedSidebar}
        setCollapsed={setCollapsedSidebar}
        pendingCount={stats?.pendingAllocation || 0}
      />

      {/* Main Content View Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleAIAssistant={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          activeTabTitle={activeTab.replace('-', ' ')}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={loading}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeListView
              projects={projects}
              onSelectEmployeeForSeat={handleSelectEmployeeForSeat}
              onRefreshStats={loadData}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectListView
              projects={projects}
              onRefreshProjects={loadData}
              onNavigateToEmployeesWithProjectFilter={projectId => {
                setActiveTab('employees');
              }}
            />
          )}

          {activeTab === 'seats' && (
            <SeatMapView
              employees={employees}
              projects={projects}
              onRefreshStats={loadData}
              preselectedSeat={preselectedSeat}
              preselectedEmployee={preselectedEmployee}
            />
          )}

          {activeTab === 'new-joiner' && (
            <NewJoinerWizard
              projects={projects}
              onCompleteOnboarding={() => {
                loadData();
              }}
            />
          )}

          {activeTab === 'ai-assistant' && (
            <div className="p-8 text-center">
              <p className="text-slate-400">Click the Ask Ethara AI button in the top bar to launch the Gemini assistant drawer.</p>
            </div>
          )}

          {activeTab === 'audit-logs' && <AuditLogView />}

        </main>
      </div>

      {/* Command Palette Modal (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        employees={employees}
        seats={seats}
        projects={projects}
        onSelectEmployee={emp => {
          setPreselectedEmployee(emp);
          setActiveTab('employees');
        }}
        onSelectSeat={seat => {
          setPreselectedSeat(seat);
          setActiveTab('seats');
        }}
        onSelectProject={prj => {
          setActiveTab('projects');
        }}
      />

      {/* AI Assistant Chat Drawer */}
      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onNavigateToTab={setActiveTab}
      />
    </div>
  );
}

export default App;
