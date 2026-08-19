import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../data/mockData';
import { usersApi } from '../utils/api';
import {
  Users, Search, UserX, UserCheck, KeyRound,
  Trash2, Eye, History, Gavel, Phone, Mail, ShieldAlert,
  Loader2, CheckCircle, Unlock
} from 'lucide-react';

export default function AdminUsers() {
  const { users, toggleUserStatus, deleteUser, resetUserPassword } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailedData, setUserDetailedData] = useState<{
    bids: any[];
    transactions: any[];
    unlocked_auctions: any[];
  } | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const [resetSuccessMessage, setResetSuccessMessage] = useState(false);
  const [resetTemp, setResetTemp] = useState<string | null>(null);

  // Load real-time database bids, transactions, and unlocked auctions when user is selected
  useEffect(() => {
    if (!selectedUser) {
      setUserDetailedData(null);
      return;
    }
    let active = true;
    setLoadingUserDetails(true);
    usersApi.get(selectedUser.id)
      .then(res => {
        if (!active) return;
        if (res.data) {
          setUserDetailedData({
            bids: res.data.bids || [],
            transactions: res.data.transactions || [],
            unlocked_auctions: res.data.unlocked_auctions || [],
          });
        }
      })
      .catch(() => {
        if (active) setUserDetailedData({ bids: [], transactions: [], unlocked_auctions: [] });
      })
      .finally(() => {
        if (active) setLoadingUserDetails(false);
      });

    return () => { active = false; };
  }, [selectedUser?.id]);

  async function handleResetPasswordConfirmed() {
    if (resetPasswordUser) {
      const temp = await resetUserPassword(resetPasswordUser.id);
      setResetTemp(temp);
      setResetSuccessMessage(true);
      setTimeout(() => {
        setResetSuccessMessage(false);
        setResetPasswordUser(null);
        setResetTemp(null);
      }, 4000);
    }
  }

  async function handleDeleteUserConfirmed() {
    if (deletingUser) {
      await deleteUser(deletingUser.id);
      setDeletingUser(null);
    }
  }

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.phone.includes(searchTerm) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> User Management
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Audit registered accounts, role authorizations, suspension toggles, and participant wallet history.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-300">
          Total Registered Users: <span className="text-purple-400 font-mono font-bold text-sm ml-1">{users.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, phone, or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Master Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">User Info</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Wallet & Credits</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={u.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'} alt={u.name} className="w-10 h-10 object-cover rounded-full flex-shrink-0 border border-slate-700" />
                      <div>
                        <p className="font-bold text-white text-xs">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                      u.role === 'admin'
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                      u.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-mono font-bold text-slate-200">{u.walletBalance.toLocaleString()} ETB</div>
                    <div className="text-[10px] text-purple-400 font-mono">{u.credits} Bidding Credits</div>
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-[11px]">
                    {u.joinedAt}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-md transition-colors"
                        title="View Profile Drawer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          u.status === 'active'
                            ? 'text-rose-400 hover:bg-rose-950/40'
                            : 'text-emerald-400 hover:bg-emerald-950/40'
                        }`}
                        title={u.status === 'active' ? 'Suspend User' : 'Activate User'}
                      >
                        {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => setResetPasswordUser(u)}
                        className="p-1.5 text-amber-400 hover:bg-amber-950/40 rounded-md transition-colors"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingUser(u)}
                        className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER DETAIL SLIDE-OVER DRAWER */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> User Profile & History
              </h2>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-4">
              <img src={selectedUser.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + selectedUser.name} alt={selectedUser.name} className="w-16 h-16 object-cover rounded-full border-2 border-purple-500" />
              <div>
                <h3 className="text-base font-bold text-white">{selectedUser.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-500" /> {selectedUser.email}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-500" /> {selectedUser.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[10px] uppercase text-slate-500 font-semibold">Wallet Balance</span>
                <p className="text-base font-bold text-white font-mono mt-1">{selectedUser.walletBalance.toLocaleString()} ETB</p>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[10px] uppercase text-slate-500 font-semibold">Bidding Credits</span>
                <p className="text-base font-bold text-purple-400 font-mono mt-1">{selectedUser.credits}</p>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[10px] uppercase text-slate-500 font-semibold">Auctions Won</span>
                <p className="text-base font-bold text-emerald-400 font-mono mt-1">{selectedUser.wonAuctions.length}</p>
              </div>
            </div>

            {/* Live Database Bids */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-purple-400" /> Bidding Activity ({userDetailedData?.bids.length || 0})
                </h4>
                {loadingUserDetails && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 bg-slate-950/40 border border-slate-800 rounded-xl">
                {loadingUserDetails ? (
                  <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> Fetching real database bids...
                  </div>
                ) : userDetailedData && userDetailedData.bids.length > 0 ? (
                  userDetailedData.bids.map(b => (
                    <div key={b.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-900/50">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white text-xs">{b.auction_title || `Auction #${b.auction_id}`}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-purple-300 font-bold">Bid: {Number(b.amount).toFixed(1)} ETB</span>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(b.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {b.is_lowest_unique ? (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 inline-block">
                            🏆 LOWEST UNIQUE
                          </span>
                        ) : b.is_duplicate ? (
                          <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/30 inline-block">
                            DUPLICATE
                          </span>
                        ) : (
                          <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/30 inline-block">
                            UNIQUE
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">No bids placed in database yet</div>
                )}
              </div>
            </div>

            {/* Unlocked Auctions */}
            {userDetailedData && userDetailedData.unlocked_auctions && userDetailedData.unlocked_auctions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-amber-400" /> Unlocked Auctions ({userDetailedData.unlocked_auctions.length})
                </h4>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-800 bg-slate-950/40 border border-slate-800 rounded-xl">
                  {userDetailedData.unlocked_auctions.map((u, i) => (
                    <div key={i} className="p-2.5 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">{u.auction_title || `Auction #${u.auction_id}`}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(u.created_at).toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-mono bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                        Fee: {u.amount_paid} ETB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Database Transactions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" /> Wallet Transactions ({userDetailedData?.transactions.length || 0})
                </h4>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 bg-slate-950/40 border border-slate-800 rounded-xl">
                {loadingUserDetails ? (
                  <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> Fetching real database transactions...
                  </div>
                ) : userDetailedData && userDetailedData.transactions.length > 0 ? (
                  userDetailedData.transactions.map(t => (
                    <div key={t.id} className="p-2.5 text-xs flex items-center justify-between">
                      <div className="max-w-[320px]">
                        <p className="text-slate-200 font-medium truncate">{t.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(t.created_at).toLocaleString()}</span>
                          {t.payment_method && (
                            <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                              {t.payment_method}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${Number(t.amount) >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {Number(t.amount) >= 0 ? `+${Number(t.amount).toFixed(2)}` : Number(t.amount).toFixed(2)} ETB
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">No transaction logs recorded</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset User Password</h3>
                <p className="text-slate-400 text-xs mt-0.5">Target: {resetPasswordUser.name}</p>
              </div>
            </div>

            {resetSuccessMessage ? (
              <div className="p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold text-center">
                ✓ Temporary password set{resetTemp ? `: ${resetTemp}` : ''}
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                Are you sure you want to issue a temporary password to {resetPasswordUser?.phone}?
              </p>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button onClick={() => setResetPasswordUser(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg font-semibold">
                Cancel
              </button>
              <button onClick={handleResetPasswordConfirmed} className="px-4 py-2 bg-amber-600 text-white text-xs rounded-lg font-semibold shadow-lg shadow-amber-900/40">
                Issue Password Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm User Deletion</h3>
                <p className="text-slate-400 text-xs mt-0.5">User: {deletingUser.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete this user account?
            </p>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button onClick={() => setDeletingUser(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg font-semibold">
                Cancel
              </button>
              <button onClick={handleDeleteUserConfirmed} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-lg font-semibold shadow-lg shadow-rose-900/40">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
