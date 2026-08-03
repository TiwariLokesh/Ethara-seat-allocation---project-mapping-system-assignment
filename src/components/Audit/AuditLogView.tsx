import React, { useState, useEffect } from 'react';
import { History, Search, ShieldCheck, Clock, User, Filter } from 'lucide-react';
import { AuditLog } from '../../types';
import { api } from '../../services/api';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    l =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.performedBy.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-500" /> Enterprise Audit Logs
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete, immutable security audit trail for seat allocations, releases, transfers, and system modifications.
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter logs by action, administrator name, or details..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
        />
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Performed By</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                    Loading enterprise audit events...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-sans font-semibold text-slate-900 dark:text-white">
                      {log.performedBy}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-sans">
                      {log.targetType}: <span className="font-mono text-indigo-500 font-bold">{log.targetId}</span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-sans">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
