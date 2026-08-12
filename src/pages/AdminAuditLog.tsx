import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Lock } from 'lucide-react';

export default function AdminAuditLog() {
  const { auditLogs } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [adminFilter, setAdminFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const admins = Array.from(new Set(auditLogs.map(l => l.adminName)));
  const actions = Array.from(new Set(auditLogs.map(l => l.action)));

  const filtered = auditLogs.filter(l => {
    const matchesSearch = l.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAdmin = adminFilter === 'all' || l.adminName === adminFilter;
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    return matchesSearch && matchesAdmin && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Immutability Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-800/40 rounded-2xl shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-300 rounded-xl border border-purple-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Cryptographic System Audit Log</h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                APPEND-ONLY IMMUTABLE
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-0.5">
              All administrative operations, status updates, and automated winner verifications are signed and permanently logged. Logs cannot be modified or deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search target entity or details..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={adminFilter}
            onChange={e => setAdminFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Administrators</option>
            {admins.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Action Types</option>
            {actions.map(act => <option key={act} value={act}>{act}</option>)}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp (UTC/EAT)</th>
                <th className="p-4">Admin Actor</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Details & Payload</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono text-[11px] text-slate-400">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-white">{l.adminName}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">ID: {l.adminId}</span>
                  </td>
                  <td className="p-4">
                    <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-200">{l.target}</td>
                  <td className="p-4 text-slate-300 max-w-sm">{l.details}</td>
                  <td className="p-4 font-mono text-[10px] text-slate-500">{l.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
