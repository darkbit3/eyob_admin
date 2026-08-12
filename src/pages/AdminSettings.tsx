import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Shield, Save, CheckCircle2, Lock, ToggleLeft, ToggleRight, XCircle } from 'lucide-react';
import { settingsApi } from '../utils/api';

export default function AdminSettings() {
  const { settings, updateSystemSettings } = useApp();

  const [platformName, setPlatformName] = useState(settings.platformName);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [currency, setCurrency] = useState(settings.currency);
  const [minBidPrice, setMinBidPrice] = useState(settings.minBidPrice);
  const [maxBidPrice, setMaxBidPrice] = useState(settings.maxBidPrice);
  const [defaultBidStep, setDefaultBidStep] = useState(settings.defaultBidStep);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await settingsApi.update({
        platform_name: platformName,
        support_email: supportEmail,
        currency,
        min_bid_price: Number(minBidPrice),
        max_bid_price: Number(maxBidPrice),
        default_bid_step: Number(defaultBidStep),
        maintenance_mode: maintenanceMode,
      });
      // Sync local context so the rest of the UI reflects the new values
      updateSystemSettings({
        platformName,
        supportEmail,
        currency,
        minBidPrice: Number(minBidPrice),
        maxBidPrice: Number(maxBidPrice),
        defaultBidStep: Number(defaultBidStep),
        maintenanceMode,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const [permissions, setPermissions] = useState([
    { role: 'Super Admin', manageAuctions: true, manageUsers: true, approvePayments: true, overrideWinners: false, viewAuditLogs: true },
    { role: 'Finance Admin', manageAuctions: false, manageUsers: false, approvePayments: true, overrideWinners: false, viewAuditLogs: true },
    { role: 'Support Agent', manageAuctions: false, manageUsers: true, approvePayments: false, overrideWinners: false, viewAuditLogs: false },
  ]);

  function togglePermission(roleIndex: number, key: string) {
    if (key === 'overrideWinners') return;
    setPermissions(prev => prev.map((p, idx) => {
      if (idx === roleIndex) {
        return { ...p, [key]: !(p as any)[key] };
      }
      return p;
    }));
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" /> Platform Settings Saved & Synchronized!
        </div>
      )}
      {saveError && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-2xl flex items-center gap-2">
          <XCircle className="w-4 h-4" /> {saveError}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" /> Platform Settings & Permissions
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Configure default bidding boundaries, platform branding, currency rules, and administrative role matrices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            General Platform Parameters
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={platformName}
                onChange={e => setPlatformName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Platform Currency Code</label>
                <input
                  type="text"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Default Bid Step (ETB)</label>
                <input
                  type="number"
                  value={defaultBidStep}
                  onChange={e => setDefaultBidStep(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Min Bid Floor (ETB)</label>
                <input
                  type="number"
                  value={minBidPrice}
                  onChange={e => setMinBidPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Bid Ceiling (ETB)</label>
                <input
                  type="number"
                  value={maxBidPrice}
                  onChange={e => setMaxBidPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Platform Maintenance Mode</p>
                <p className="text-[11px] text-slate-400">Pause customer bidding during database updates</p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`text-2xl transition-colors ${maintenanceMode ? 'text-amber-400' : 'text-slate-600'}`}
              >
                {maintenanceMode ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-all"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save System Settings'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" /> Roles & Permissions Control Matrix
            </h2>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Interactive Matrix</span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-center">Auctions</th>
                  <th className="p-3 text-center">Users</th>
                  <th className="p-3 text-center">Payments</th>
                  <th className="p-3 text-center">Audit Logs</th>
                  <th className="p-3 text-center text-amber-400">Winner Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {permissions.map((p, idx) => (
                  <tr key={p.role} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{p.role}</td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={p.manageAuctions}
                        onChange={() => togglePermission(idx, 'manageAuctions')}
                        className="rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={p.manageUsers}
                        onChange={() => togglePermission(idx, 'manageUsers')}
                        className="rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={p.approvePayments}
                        onChange={() => togglePermission(idx, 'approvePayments')}
                        className="rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={p.viewAuditLogs}
                        onChange={() => togglePermission(idx, 'viewAuditLogs')}
                        className="rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="p-3 text-center bg-slate-950/60">
                      <div className="flex items-center justify-center gap-1 text-slate-500" title="Winner Override is strictly disabled for all roles.">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] font-mono font-bold text-slate-600">LOCKED</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl text-xs text-purple-300">
            <p className="font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-purple-400" /> Security Guarantee
            </p>
            <p className="text-[11px] text-purple-200/80 mt-0.5">
              The "Winner Override" privilege is locked at the system core level and cannot be granted to any role.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
