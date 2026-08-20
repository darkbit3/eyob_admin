import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Shield, Save, CheckCircle2, Lock, ToggleLeft, ToggleRight, XCircle, Building2, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { settingsApi, usersApi } from '../utils/api';

interface BankAccountItem {
  id: string;
  method_name: string;
  account_number: string;
  account_holder: string;
  is_active: boolean;
}

export default function AdminSettings() {
  const { settings, auctions, updateAuction, updateSystemSettings, currentUser } = useApp();

  // ── Live roles from DB ────────────────────────────────────────────────────
  const [roleStats, setRoleStats] = useState<{ role: string; count: number }[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  // permissions[role][page] = boolean
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [permSaveMsg, setPermSaveMsg] = useState('');

  const PAGES = ['Dashboard','Auctions','Products','Users Mgmt','Wallet','Winners','Reports','Profit','Settings'];
  const STORAGE_KEY = 'bidlow_role_permissions';

  useEffect(() => {
    fetchRoleStats();
    // Load saved permissions from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setRolePermissions(JSON.parse(saved));
    } catch {}
  }, []);

  async function fetchRoleStats() {
    setRolesLoading(true);
    try {
      const res = await usersApi.list();
      const users: any[] = res.data || [];
      const roleMap: Record<string, number> = {};
      users.forEach((u: any) => {
        const r = u.role || 'customer';
        roleMap[r] = (roleMap[r] || 0) + 1;
      });
      setRoleStats(Object.entries(roleMap).map(([role, count]) => ({ role, count })));
    } catch {
      setRoleStats([]);
    } finally {
      setRolesLoading(false);
    }
  }

  function toggleRolePermission(role: string, page: string) {
    setRolePermissions(prev => ({
      ...prev,
      [role]: { ...(prev[role] ?? {}), [page]: !(prev[role]?.[page] ?? false) },
    }));
  }

  function saveRolePermissions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rolePermissions));
    setPermSaveMsg('✅ Permissions saved.');
    setTimeout(() => setPermSaveMsg(''), 2000);
  }

  function getRolePerm(role: string, page: string): boolean {
    return rolePermissions[role]?.[page] ?? false;
  }
  }

  const [platformName, setPlatformName] = useState(settings.platformName);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [currency, setCurrency] = useState(settings.currency);
  const [minBidPrice, setMinBidPrice] = useState(settings.minBidPrice);
  const [maxBidPrice, setMaxBidPrice] = useState(settings.maxBidPrice);
  const [defaultBidStep, setDefaultBidStep] = useState(settings.defaultBidStep);
  const [defaultBidPerCost, setDefaultBidPerCost] = useState<number>(
    (settings as any).defaultBidPerCost ?? 100
  );
  const [maxBidsPerUser, setMaxBidsPerUser] = useState<number>(settings.maxBidsPerUser ?? 0);
  const [selectedAuctionId, setSelectedAuctionId] = useState('');
  const [auctionBidLimit, setAuctionBidLimit] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  // Add User modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'customer' | 'other'>('customer');
  const [newUserCustomRole, setNewUserCustomRole] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserMsg, setAddUserMsg] = useState('');
  const [addUserMsgType, setAddUserMsgType] = useState<'success' | 'error'>('success');

  // Bank Accounts Management State
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [showBankModal, setShowBankModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountItem | null>(null);

  const [formMethodName, setFormMethodName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formAccountHolder, setFormAccountHolder] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const [bankFormLoading, setBankFormLoading] = useState(false);
  const [bankFormMsg, setBankFormMsg] = useState('');
  const [bankFormMsgType, setBankFormMsgType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    setMaxBidsPerUser(settings.maxBidsPerUser ?? 0);
  }, [settings.maxBidsPerUser]);

  useEffect(() => {
    if (!selectedAuctionId && auctions.length > 0) {
      setSelectedAuctionId(auctions[0].id);
    }
  }, [auctions, selectedAuctionId]);

  useEffect(() => {
    const selectedAuction = auctions.find(a => a.id === selectedAuctionId);
    setAuctionBidLimit(selectedAuction?.maxBidsPerUser ?? 0);
  }, [auctions, selectedAuctionId]);

  async function fetchBankAccounts() {
    setLoadingAccounts(true);
    try {
      const res = await settingsApi.getBankAccounts();
      if (res.success && Array.isArray(res.data)) {
        setBankAccounts(res.data);
      }
    } catch (e) {}
    finally { setLoadingAccounts(false); }
  }

  function handleOpenAddModal() {
    setEditingAccount(null);
    setFormMethodName('Commercial Bank of Ethiopia (CBE)');
    setFormAccountNumber('');
    setFormAccountHolder('BidLow Auctions PLC (Admin Official)');
    setFormIsActive(true);
    setBankFormMsg('');
    setShowBankModal(true);
  }

  function handleOpenEditModal(acc: BankAccountItem) {
    setEditingAccount(acc);
    setFormMethodName(acc.method_name);
    setFormAccountNumber(acc.account_number);
    setFormAccountHolder(acc.account_holder);
    setFormIsActive(acc.is_active !== false);
    setBankFormMsg('');
    setShowBankModal(true);
  }

  async function handleSaveBankForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formMethodName || !formAccountNumber || !formAccountHolder) {
      setBankFormMsg('All fields are required.');
      setBankFormMsgType('error');
      return;
    }

    setBankFormLoading(true);
    setBankFormMsg('');
    try {
      if (editingAccount) {
        const res = await settingsApi.updateBankAccount(editingAccount.id, {
          method_name: formMethodName,
          account_number: formAccountNumber,
          account_holder: formAccountHolder,
          is_active: formIsActive,
        });
        setBankFormMsg(`✓ ${res.message || 'Account updated successfully!'}`);
        setBankFormMsgType('success');
      } else {
        const res = await settingsApi.createBankAccount({
          method_name: formMethodName,
          account_number: formAccountNumber,
          account_holder: formAccountHolder,
        });
        setBankFormMsg(`✓ ${res.message || 'Account added successfully!'}`);
        setBankFormMsgType('success');
      }
      await fetchBankAccounts();
      setTimeout(() => {
        setShowBankModal(false);
        setBankFormMsg('');
      }, 1200);
    } catch (err: any) {
      setBankFormMsg(`✗ ${err?.message || 'Failed to save account.'}`);
      setBankFormMsgType('error');
    } finally {
      setBankFormLoading(false);
    }
  }

  async function handleDeleteAccount(id: string) {
    if (!window.confirm('Are you sure you want to delete this official bank account?')) return;
    try {
      await settingsApi.deleteBankAccount(id);
      await fetchBankAccounts();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete bank account.');
    }
  }

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
        default_bid_per_cost: Number(defaultBidPerCost),
        maintenance_mode: maintenanceMode,
      });
      updateSystemSettings({
        platformName,
        supportEmail,
        currency,
        minBidPrice: Number(minBidPrice),
        maxBidPrice: Number(maxBidPrice),
        defaultBidStep: Number(defaultBidStep),
        defaultBidPerCost: Number(defaultBidPerCost),
        maxBidsPerUser,
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

  async function handleSaveBidLimit() {
    const limit = Math.max(0, Math.floor(Number(maxBidsPerUser) || 0));
    setMaxBidsPerUser(limit);
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await settingsApi.update({ max_bids_per_user: limit });
      updateSystemSettings({ maxBidsPerUser: limit });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save bid limit. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAuctionBidLimit() {
    if (!selectedAuctionId) return;
    const limit = Math.max(0, Math.floor(Number(auctionBidLimit) || 0));
    setAuctionBidLimit(limit);
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await updateAuction(selectedAuctionId, { maxBidsPerUser: limit });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save auction bid limit. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPhone || !newUserPassword) {
      setAddUserMsg('All fields are required.');
      setAddUserMsgType('error');
      return;
    }
    setAddUserLoading(true);
    setAddUserMsg('');
    try {
      const resolvedRole = newUserRole === 'other'
        ? (newUserCustomRole.trim() || 'customer')
        : newUserRole;
      await usersApi.createUser({
        name: newUserName,
        email: newUserEmail,
        phone: newUserPhone,
        password: newUserPassword,
        role: resolvedRole,
      });
      setAddUserMsg(`✅ User "${newUserName}" created successfully.`);
      setAddUserMsgType('success');
      setNewUserName(''); setNewUserEmail(''); setNewUserPhone(''); setNewUserPassword('');
      setNewUserRole('customer'); setNewUserCustomRole('');
      fetchRoleStats(); // refresh the matrix
      setTimeout(() => { setShowAddUserModal(false); setAddUserMsg(''); }, 1500);
    } catch (err: any) {
      setAddUserMsg(err?.message || 'Failed to create user.');
      setAddUserMsgType('error');
    } finally {
      setAddUserLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" /> Platform Settings Saved &amp; Synchronized!
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
          <Settings className="w-5 h-5 text-purple-400" /> Platform Settings &amp; Permissions
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Configure default bidding boundaries, official admin bank accounts, currency rules, and administrative role matrices.
        </p>
      </div>

      {/* ── OFFICIAL ADMIN BANK ACCOUNTS MANAGEMENT CARD ────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" /> Official Admin Bank Accounts &amp; Deposit Methods
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              These accounts are displayed live to customers in the Manual Deposit &amp; Transfer section on the frontend.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Official Account
          </button>
        </div>

        {loadingAccounts ? (
          <div className="flex items-center justify-center p-8 text-xs text-slate-400 gap-2 font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Loading official bank accounts...
          </div>
        ) : bankAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(acc => (
              <div key={acc.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{acc.method_name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${acc.is_active !== false ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                      {acc.is_active !== false ? '● ACTIVE' : '○ INACTIVE'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{acc.account_holder}</p>
                  <p className="font-mono text-emerald-400 font-bold text-sm mt-1">{acc.account_number}</p>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-2.5">
                  <button
                    onClick={() => handleOpenEditModal(acc)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-4">No bank accounts configured yet. Click "Add Official Account" to create one.</p>
        )}
      </div>

      <div className="flex flex-col gap-6">
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

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Default Bid Per Cost (ETB)</label>
                <p className="text-[11px] text-slate-500 mb-1.5">Entry fee charged per bid placed. Applied to new auctions by default.</p>
                <input
                  type="number"
                  min={1}
                  value={defaultBidPerCost}
                  onChange={e => setDefaultBidPerCost(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="e.g. 100"
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

        {/* ── Roles & Permissions — admin only ─────────────────────────── */}
        {currentUser?.role === 'admin' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" /> Roles &amp; Permissions Control Matrix
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Admin Only</span>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add User
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            {rolesLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading roles from database…
              </div>
            ) : roleStats.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">No users found in the database.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 sticky left-0 bg-slate-950 z-10">Role</th>
                    <th className="p-3 text-center">Users</th>
                    <th className="p-3 text-center">Dashboard</th>
                    <th className="p-3 text-center">Auctions</th>
                    <th className="p-3 text-center">Products</th>
                    <th className="p-3 text-center">Users Mgmt</th>
                    <th className="p-3 text-center">Wallet</th>
                    <th className="p-3 text-center">Winners</th>
                    <th className="p-3 text-center">Reports</th>
                    <th className="p-3 text-center">Profit</th>
                    <th className="p-3 text-center">Settings</th>
                    <th className="p-3 text-center text-amber-400">Winner Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {roleStats.map(({ role, count }) => {
                    const isAdmin    = role === 'admin';
                    const isCustomer = role === 'customer';

                    const pages = ['Dashboard','Auctions','Products','Users Mgmt','Wallet','Winners','Reports','Profit','Settings'];

                    return (
                      <tr key={role} className="hover:bg-slate-800/40">
                        {/* Role */}
                        <td className="p-3 sticky left-0 bg-slate-900">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold capitalize ${isAdmin ? 'text-purple-300' : isCustomer ? 'text-slate-400' : 'text-white'}`}>{role}</span>
                            {isAdmin    && <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono">ADMIN</span>}
                            {isCustomer && <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono">CUSTOMER</span>}
                          </div>
                        </td>
                        {/* User count */}
                        <td className="p-3 text-center">
                          <span className="bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full font-mono text-[11px]">
                            {count}
                          </span>
                        </td>
                        {/* Page columns */}
                        {PAGES.map(page => (
                          <td key={page} className="p-3 text-center">
                            {isAdmin ? (
                              <input type="checkbox" checked readOnly
                                className="w-4 h-4 rounded border-emerald-600 bg-emerald-600 text-emerald-500 cursor-not-allowed opacity-80" />
                            ) : isCustomer ? (
                              <span className="text-slate-700 text-[11px]">—</span>
                            ) : (
                              <input type="checkbox"
                                checked={getRolePerm(role, page)}
                                onChange={() => toggleRolePermission(role, page)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer" />
                            )}
                          </td>
                        ))}
                        {/* Winner Override — always locked */}
                        <td className="p-3 text-center bg-slate-950/60">
                          <div className="flex items-center justify-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-[10px] font-mono font-bold text-slate-600">LOCKED</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl text-xs text-purple-300">
            <p className="font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-purple-400" /> Security Guarantee
            </p>
            <p className="text-[11px] text-purple-200/80 mt-0.5">
              The "Winner Override" privilege is locked at the system core level and cannot be granted to any role.
            </p>
          </div>

          {/* Save Permissions Button */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
            <button onClick={saveRolePermissions}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-purple-900/30">
              <Save className="w-3.5 h-3.5" /> Save Permissions
            </button>
            {permSaveMsg && (
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {permSaveMsg}
              </span>
            )}
          </div>
        </div>
        )}
      </div>

      {/* ── BID PER USER SETTINGS ──────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Save className="w-4 h-4 text-amber-400" /> Bid Per User Limit
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Maximum number of bids one user can place on a single auction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-xs">
              Max Bids Per User Per Auction
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Once a user reaches this limit on an auction they cannot place more bids on it. Set to <strong className="text-slate-400">0</strong> for unlimited.
            </p>
            <input
              type="number"
              min={0}
              value={maxBidsPerUser}
              onChange={e => setMaxBidsPerUser(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
              placeholder="e.g. 3  (0 = unlimited)"
            />
          </div>
          <div>
            <button
              onClick={handleSaveBidLimit}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-900/30 transition-all disabled:opacity-50"
            >
              {saving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : <><Save className="w-3.5 h-3.5" /> Save Limit</>
              }
            </button>
            {saveSuccess && (
              <p className="text-emerald-400 text-xs font-semibold mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved successfully
              </p>
            )}
            {saveError && (
              <p className="text-rose-400 text-xs font-semibold mt-2 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {saveError}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <label className="block text-slate-300 font-semibold mb-1 text-xs">
            Set Limit For A Specific Auction
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            Choose an auction to override the global limit. Set to <strong className="text-slate-400">0</strong> to use the global limit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_180px_auto] gap-3 items-end">
            <select
              value={selectedAuctionId}
              onChange={e => setSelectedAuctionId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
            >
              {auctions.length === 0 ? (
                <option value="">No auctions available</option>
              ) : auctions.map(auction => (
                <option key={auction.id} value={auction.id}>
                  {auction.title} ({auction.status})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step={1}
              value={auctionBidLimit}
              disabled={!selectedAuctionId}
              onChange={e => setAuctionBidLimit(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono text-sm disabled:opacity-50"
              placeholder="0 = global"
            />
            <button
              onClick={handleSaveAuctionBidLimit}
              disabled={saving || !selectedAuctionId}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-900/30 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Auction Limit
            </button>
          </div>
        </div>
      </div>

      {/* ── BANK ACCOUNT EDIT / ADD MODAL ──────────────────────────────── */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                {editingAccount ? 'Edit Official Bank Account' : 'Add New Official Bank Account'}
              </h3>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {bankFormMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${bankFormMsgType === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'}`}>
                {bankFormMsgType === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{bankFormMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveBankForm} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Method / Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Bank of Ethiopia (CBE), Telebirr, CBE Birr"
                  value={formMethodName}
                  onChange={e => setFormMethodName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account / Merchant Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1000 4829 10482 or 0911 002 233"
                  value={formAccountNumber}
                  onChange={e => setFormAccountNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Holder Full Name (Admin)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BidLow Auctions PLC (Admin Official)"
                  value={formAccountHolder}
                  onChange={e => setFormAccountHolder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {editingAccount && (
                <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="is_active_chk"
                    checked={formIsActive}
                    onChange={e => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="is_active_chk" className="text-slate-300 font-semibold cursor-pointer">
                    Active Account (visible on customer deposit page)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankFormLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-900/40"
                >
                  {bankFormLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Account</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD USER MODAL ──────────────────────────────────────────────── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" /> Add New User
              </h3>
              <button onClick={() => { setShowAddUserModal(false); setAddUserMsg(''); }} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Abebe Kebede"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g. abebe@email.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                <input type="text" value={newUserPhone} onChange={e => setNewUserPhone(e.target.value)}
                  placeholder="e.g. 0911234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Password</label>
                <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Temporary password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as 'admin' | 'customer' | 'other')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500">
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                  <option value="other">Other (Custom)</option>
                </select>
                {newUserRole === 'other' && (
                  <input
                    type="text"
                    value={newUserCustomRole}
                    onChange={e => setNewUserCustomRole(e.target.value)}
                    placeholder="Enter custom role name (e.g. moderator)"
                    className="w-full mt-2 bg-slate-950 border border-purple-500/50 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                )}
              </div>

              {addUserMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold border ${
                  addUserMsgType === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}>{addUserMsg}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => { setShowAddUserModal(false); setAddUserMsg(''); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={addUserLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-1.5 text-xs shadow-lg shadow-purple-900/40">
                  {addUserLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
