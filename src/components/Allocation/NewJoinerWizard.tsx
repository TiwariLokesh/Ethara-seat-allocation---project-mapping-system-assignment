import React, { useState } from 'react';
import {
  UserPlus,
  Briefcase,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Grid3X3,
  Building,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Project, DepartmentName, EmployeeRole, SeatRecommendation, NewJoinerFormData } from '../../types';
import { api } from '../../services/api';

interface NewJoinerWizardProps {
  projects: Project[];
  onCompleteOnboarding: () => void;
}

export const NewJoinerWizard: React.FC<NewJoinerWizardProps> = ({
  projects,
  onCompleteOnboarding
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Employee Details Form
  const [formData, setFormData] = useState<NewJoinerFormData>({
    firstName: 'Arjun',
    lastName: 'Kulkarni',
    email: 'arjun.kulkarni@ethara.com',
    empCode: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Engineering',
    role: 'Senior Engineer',
    joiningDate: new Date().toISOString().slice(0, 10),
    projectId: projects[0]?.id || ''
  });

  // Step 3: Recommendations State
  const [recommendations, setRecommendations] = useState<SeatRecommendation[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatRecommendation | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Step 4: Final Success Data
  const [allocatedResult, setAllocatedResult] = useState<{ empCode: string; seatNumber: string; floor: number; zone: string } | null>(null);

  // Advance to Step 3 and Fetch Recommendations
  const fetchRecommendationsForWizard = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.empCode) {
      setError('Please fill in all employee details.');
      return;
    }
    setError('');
    setLoadingRecommendations(true);
    setCurrentStep(3);

    try {
      // Create employee record first
      const newEmp = await api.createEmployee(formData);

      // Get smart seat recommendations
      const res = await api.getSeatRecommendations({
        employeeId: newEmp.id,
        projectId: formData.projectId
      });

      setRecommendations(res.recommendations);
      if (res.recommendations.length > 0) {
        setSelectedSeat(res.recommendations[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize seat recommendation engine.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Final Confirmation & Allocation
  const handleConfirmAllocation = async () => {
    if (!selectedSeat) return;
    setSubmitting(true);
    setError('');

    try {
      // Find employee by email or empCode
      const empRes = await api.getEmployees({ search: formData.empCode, limit: 1 });
      const emp = empRes.items[0];

      if (!emp) {
        throw new Error('Employee record not found.');
      }

      await api.allocateSeat(selectedSeat.seat.id, emp.id, 'Onboarded via New Joiner Wizard');

      setAllocatedResult({
        empCode: emp.empCode,
        seatNumber: selectedSeat.seat.seatNumber,
        floor: selectedSeat.seat.floor,
        zone: selectedSeat.seat.zone
      });

      setCurrentStep(4);
      onCompleteOnboarding();
    } catch (err: any) {
      setError(err.message || 'Allocation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
          <UserPlus className="w-6 h-6 text-indigo-500" /> New Joiner Onboarding Wizard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Automated 4-step onboarding flow powered by Ethara Smart Proximity Allocation Engine.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        {[
          { step: 1, label: 'Employee Details' },
          { step: 2, label: 'Project Mapping' },
          { step: 3, label: 'AI Seat Recommendation' },
          { step: 4, label: 'Confirmation' }
        ].map(item => {
          const isDone = currentStep > item.step;
          const isCurrent = currentStep === item.step;

          return (
            <div key={item.step} className="flex flex-col items-center gap-1.5 flex-1 relative">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 ${
                  isDone
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : item.step}
              </div>
              <span
                className={`text-[11px] font-semibold text-center ${
                  isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Wizard Step Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* STEP 1: Employee Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-500" /> Step 1: Employee Profile Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee Code *</label>
                <input
                  type="text"
                  required
                  value={formData.empCode}
                  onChange={e => setFormData({ ...formData, empCode: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

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
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role / Designation</label>
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
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
              >
                Next: Project Mapping <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Project Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-500" /> Step 2: Assign Project & Team
            </h3>

            <div className="space-y-3">
              {projects.map(prj => {
                const isSelected = formData.projectId === prj.id;
                return (
                  <div
                    key={prj.id}
                    onClick={() => setFormData({ ...formData, projectId: prj.id })}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                        {prj.name}
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {prj.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Manager: {prj.managerName} • Target Baseline: Floor {prj.preferredFloor || 1}, {prj.preferredZone || 'Zone A'}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={fetchRecommendationsForWizard}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
              >
                Run Smart AI Recommendation <Sparkles className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Smart Recommendations */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Step 3: Optimal Seat Recommendations
            </h3>

            {loadingRecommendations ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-semibold">Running Proximity Allocation Engine for {formData.firstName}...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, idx) => {
                  const isSelected = selectedSeat?.seat.id === rec.seat.id;

                  return (
                    <div
                      key={rec.seat.id}
                      onClick={() => setSelectedSeat(rec)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-mono font-extrabold flex flex-col items-center justify-center text-xs shrink-0 shadow-md">
                          <span>F{rec.seat.floor}</span>
                          <span className="text-[10px] text-indigo-200 font-sans font-normal">Rank #{idx + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                              {rec.seat.seatNumber}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold font-mono">
                              Match Score: {rec.score}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Floor {rec.seat.floor} • {rec.seat.zone} • Bay {rec.seat.bay}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
                            {rec.reasons.map((r, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                disabled={!selectedSeat || submitting}
                onClick={handleConfirmAllocation}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? 'Allocating...' : 'Confirm Allocation'} <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success Confirmation */}
        {currentStep === 4 && allocatedResult && (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Onboarding & Seat Allocation Complete!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Employee record created and seat reserved on central database.
              </p>
            </div>

            {/* Corporate Badge Preview Card */}
            <div className="max-w-sm mx-auto p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-xs uppercase text-indigo-400 tracking-wider">Ethara HQ Access Pass</span>
                <span className="font-mono text-xs text-slate-400">{allocatedResult.empCode}</span>
              </div>

              <div>
                <div className="text-lg font-bold">{formData.firstName} {formData.lastName}</div>
                <div className="text-xs text-indigo-300">{formData.role} • {formData.department}</div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">Allocated Seat</div>
                  <div className="text-base font-bold text-emerald-400">{allocatedResult.seatNumber}</div>
                </div>
                <div className="text-right text-xs text-slate-300 font-sans">
                  Floor {allocatedResult.floor} • {allocatedResult.zone}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setCurrentStep(1);
                setAllocatedResult(null);
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md cursor-pointer"
            >
              Onboard Another Employee
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
