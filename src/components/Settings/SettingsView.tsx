import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Database, Shield, Save, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    maxOccupancyThreshold: 90,
    autoReleaseDays: 30,
    proximityWeight: 0.8,
    teamClusteringEnabled: true,
    geminiModel: 'gemini-2.5-flash',
    floorsCount: 5,
    zonesPerFloor: 10,
    seatsPerZone: 110
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-indigo-500" /> System Settings & Allocation Rules
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure algorithmic parameters for Ethara seat allocation, facility capacities, and AI models.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
        >
          {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {saved ? 'Settings Saved' : 'Save Configuration'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-6 space-y-6 text-xs">
        {/* Allocation Algorithm Settings */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-indigo-500" /> Allocation Engine Parameters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Floor Occupancy Warning Threshold (%)
              </label>
              <input
                type="number"
                value={settings.maxOccupancyThreshold}
                onChange={e => setSettings({ ...settings, maxOccupancyThreshold: parseInt(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Auto-Release Unattended Seats (Days)
              </label>
              <input
                type="number"
                value={settings.autoReleaseDays}
                onChange={e => setSettings({ ...settings, autoReleaseDays: parseInt(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Facility Geometry */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Database className="w-4 h-4 text-emerald-500" /> Facility Geometry & Grid Dimensions
          </h3>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-semibold">Total Floors:</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-1">{settings.floorsCount}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-semibold">Zones Per Floor:</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-1">{settings.zonesPerFloor}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-semibold">Total Capacity:</span>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">5,500 Seats</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
