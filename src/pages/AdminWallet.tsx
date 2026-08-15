import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { usersApi, walletApi } from '../utils/api';
import { PaymentQueueItem } from '../data/mockData';
import {
  Wallet, Search, CheckCircle2, XCircle, PlusCircle, MinusCircle,
  Image as ImageIcon, CreditCard, Loader2, Zap, ShieldCheck
} from 'lucide-react';

export default function AdminWallet() {
  const {
    transactions, setTransactions, paymentQueue, setPaymentQueue,
    users, setUsers, approvePayment, rejectPayment, adjustUserWallet, currentUser
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [matchedUsers, setMatchedUsers] = useState<typeof users>([]);
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('');
  const [txPage, setTxPage] = useState(1);
  const TX_PER_PAGE = 10;
  const [queueTab, setQueueTab] = useState<'pending' | 'history'>('pending');

  const [previewItem, setPreviewItem] = useState<PaymentQueueItem | null>(null);
  const [historyDetailItem, setHistoryDetailItem] = useState<PaymentQueueItem | null>(null);

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentMode, setAdjustmentMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(users[1]?.id || users[0]?.id || '');
  const [adjustmentAmount, setAdjustmentAmount] = useState(500);
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'wallet'>('wallet');
  const [adjustmentReason, setAdjustmentReason] = useState('Admin wallet deposit');
  const [modalUserSearch, setModalUserSearch] = useState('');
  const [isModalUserDropdownOpen, setIsModalUserDropdownOpen] = useState(false);
  const [adjustState, setAdjustState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [adjustMsg, setAdjustMsg] = useState('');

  const [selectedChapaTx, setSelectedChapaTx] = useState<{
    userName: string;
    userEmail: string;
    userPhone: string;
    amount: number;
    credits?: number;
    referenceNumber?: string;
    timestamp: string;
    beforeBalance: number;
    afterBalance: number;
    adminBalance: number;
  } | null>(null);

  const selectedUserObj = users.find(u => u.id === selectedUserId) || users[0];

  const [queueActionState, setQueueActionState] = useState<{
    id: string;
    status: 'loading' | 'success' | 'error';
    type: 'approve' | 'reject';
    msg: string;
  } | null>(null);

  async function handleApproveQueueItem(itemId: string) {
    setQueueActionState({ id: itemId, status: 'loading', type: 'approve', msg: 'Approving & processing transaction...' });
    try {
      const res = await walletApi.approvePayment(itemId);
      setQueueActionState({ id: itemId, status: 'success', type: 'approve', msg: `✓ ${res.message || 'Approved & processed successfully!'}` });

      const [txRes, qRes, uRes] = await Promise.all([
        walletApi.allTransactions(),
        walletApi.queue(),
        usersApi.list(),
      ]);
      setTransactions((txRes.data || []).map((t: any) => ({
        ...t,
        timestamp: t.timestamp || t.created_at || t.createdAt || new Date().toISOString(),
        amount: Number(t.amount || 0),
      })));
      setPaymentQueue(qRes.data || []);
      setUsers(uRes.data.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email ?? '',
        phone: u.phone ?? '',
        role: u.role,
        walletBalance: Number(u.wallet_balance ?? u.walletBalance ?? 0),
        credits: Number(u.credits ?? 0),
        status: u.status,
        joinedAt: u.joined_at ?? u.joinedAt ?? new Date().toISOString().split('T')[0],
        wonAuctions: u.won_auctions ?? u.wonAuctions ?? [],
        photo: u.photo_url ?? u.photo ?? undefined,
      })));

      setTimeout(() => setQueueActionState(null), 2200);
    } catch (err: any) {
      setQueueActionState({ id: itemId, status: 'error', type: 'approve', msg: `✗ ${err?.message || 'Failed to approve item.'}` });
      setTimeout(() => setQueueActionState(null), 3000);
    }
  }

  async function handleRejectQueueItem(itemId: string) {
    setQueueActionState({ id: itemId, status: 'loading', type: 'reject', msg: 'Rejecting request...' });
    try {
      const res = await walletApi.rejectPayment(itemId, 'Verification details do not match');
      setQueueActionState({ id: itemId, status: 'success', type: 'reject', msg: `✓ ${res.message || 'Item rejected.'}` });

      const [txRes, qRes] = await Promise.all([
        walletApi.allTransactions(),
        walletApi.queue(),
      ]);
      setTransactions((txRes.data || []).map((t: any) => ({
        ...t,
        timestamp: t.timestamp || t.created_at || t.createdAt || new Date().toISOString(),
        amount: Number(t.amount || 0),
      })));
      setPaymentQueue(qRes.data || []);

      setTimeout(() => setQueueActionState(null), 2200);
    } catch (err: any) {
      setQueueActionState({ id: itemId, status: 'error', type: 'reject', msg: `✗ ${err?.message || 'Failed to reject item.'}` });
      setTimeout(() => setQueueActionState(null), 3000);
    }
  }

  // Fetch real database data on page mount
  useEffect(() => {
    let active = true;
    async function loadRealDatabaseData() {
      try {
        const usersRes = await usersApi.list();
        if (!active) return;
        setUsers(usersRes.data.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email ?? '',
          phone: u.phone ?? '',
          role: u.role,
          walletBalance: Number(u.wallet_balance ?? u.walletBalance ?? 0),
          credits: Number(u.credits ?? 0),
          status: u.status,
          joinedAt: u.joined_at ?? u.joinedAt ?? new Date().toISOString().split('T')[0],
          wonAuctions: u.won_auctions ?? u.wonAuctions ?? [],
          photo: u.photo_url ?? u.photo ?? undefined,
        })));

        const txRes = await walletApi.allTransactions();
        if (!active) return;
        setTransactions((txRes.data || []).map((t: any) => ({
          ...t,
          userId: t.user_id || t.userId,
          userName: t.user_name || t.userName || 'Customer',
          userEmail: t.user_email || t.userEmail || '',
          userPhone: t.user_phone || t.userPhone || '',
          paymentMethod: t.payment_method || t.paymentMethod || '',
          timestamp: t.timestamp || t.created_at || t.createdAt || new Date().toISOString(),
          amount: Number(t.amount || 0),
        })));

        const qRes = await walletApi.queue();
        if (!active) return;
        setPaymentQueue(qRes.data || []);
      } catch (_err) {
        // silently fallback to context state if unauthenticated or offline
      }
    }
    loadRealDatabaseData();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (selectedUserObj && !modalUserSearch) {
      setModalUserSearch(`${selectedUserObj.name} (${selectedUserObj.phone || selectedUserObj.email})`);
    }
  }, [selectedUserId]);

  function openChapaDetailModal(item: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    amount: number;
    credits?: number;
    referenceNumber?: string;
    description?: string;
    timestamp?: string;
    created_at?: string;
  }) {
    const u = users.find(usr =>
      (item.userId && usr.id === item.userId) ||
      (item.userEmail && usr.email === item.userEmail) ||
      usr.name === item.userName
    );

    const amt = Number(item.amount || 0);
    const currentBal = Number(u?.walletBalance || 0);
    const beforeBal = Math.max(0, currentBal - amt);
    const afterBal = currentBal;
    const adminBal = Number(currentUser?.walletBalance || 0);

    setSelectedChapaTx({
      userName: u?.name || item.userName || 'Customer',
      userEmail: u?.email || item.userEmail || '—',
      userPhone: u?.phone || '—',
      amount: amt,
      credits: item.credits,
      referenceNumber: item.referenceNumber || item.description?.match(/Ref:\s*(\w+)/i)?.[1] || 'CHAPA-AUTO',
      timestamp: item.timestamp || item.created_at || new Date().toISOString(),
      beforeBalance: beforeBal,
      afterBalance: afterBal,
      adminBalance: adminBal,
    });
  }

  function openAdjustmentModal(mode: 'deposit' | 'withdraw', targetUserId?: string) {
    const uid = targetUserId || selectedUserId || users[0]?.id || '';
    setSelectedUserId(uid);
    const u = users.find(usr => usr.id === uid) || users[0];
    if (u) setModalUserSearch(`${u.name} (${u.phone || u.email})`);
    setIsModalUserDropdownOpen(false);
    setAdjustmentMode(mode);
    setAdjustmentAmount(500);
    setAdjustmentReason(mode === 'withdraw' ? 'Admin wallet withdrawal' : 'Admin wallet deposit');
    setAdjustState('idle');
    setAdjustMsg('');
    setShowAdjustmentModal(true);
  }

  async function handleManualAdjustSubmit() {
    const amt = Number(adjustmentAmount);
    if (!selectedUserId) {
      setAdjustState('error');
      setAdjustMsg('Please select a user first.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setAdjustState('error');
      setAdjustMsg('Amount must be a positive number greater than 0.');
      return;
    }

    const userBal = Number(selectedUserObj?.walletBalance || 0);
    if (adjustmentMode === 'withdraw' && amt > userBal) {
      setAdjustState('error');
      setAdjustMsg(`Insufficient user balance (${userBal} ETB available). Cannot withdraw ${amt} ETB.`);
      return;
    }

    setAdjustState('loading');
    setAdjustMsg(adjustmentMode === 'withdraw' ? 'Processing wallet withdrawal...' : 'Processing wallet deposit...');
    try {
      const finalAmt = adjustmentMode === 'withdraw' ? -amt : amt;
      await adjustUserWallet(selectedUserId, finalAmt, adjustmentReason, false);
      setAdjustState('success');
      setAdjustMsg(`✓ ${adjustmentMode === 'withdraw' ? 'Withdrawal' : 'Deposit'} processed successfully! Admin balance updated.`);
      setTimeout(() => {
        setShowAdjustmentModal(false);
        setAdjustState('idle');
        setAdjustMsg('');
      }, 1400);
    } catch (err: any) {
      setAdjustState('error');
      setAdjustMsg(err?.message || `✗ Failed to process ${adjustmentMode}.`);
    }
  }

  // Keep selectedUser in sync with users array updates (so balance updates show immediately)
  useEffect(() => {
    if (!selectedUser) return;
    const updated = users.find(u => u.id === selectedUser.id);
    if (updated) setSelectedUser(updated);
  }, [users]);

  const filteredTx = transactions.filter(t => {
    const q = (searchTerm || '').toLowerCase();
    const uname = (t.userName || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    const matchesSearch = !q || uname.includes(q) || desc.includes(q);

    // Type filter matching
    const isUnlock = t.type === 'bid_fee_paid' || desc.includes('unlock entry fee');
    const isManualDep = t.type === 'manual_adjustment' && Number(t.amount || 0) >= 0;
    const isManualWd = t.type === 'manual_withdrawal' || (t.type === 'manual_adjustment' && Number(t.amount || 0) < 0);
    const matchesType = typeFilter === 'all' || (
      typeFilter === 'bid_fee_paid' ? isUnlock :
      typeFilter === 'manual_adjustment' ? isManualDep :
      typeFilter === 'manual_withdrawal' ? isManualWd :
      t.type === typeFilter
    );

    // Method filter matching
    const pm = (t.paymentMethod ?? '').toLowerCase();
    const matchesMethod = !methodFilter || (
      methodFilter === 'Chapa'  ? (pm.includes('chapa') || desc.includes('chapa')) :
      methodFilter === 'Manual' ? (pm.includes('manual') || pm.includes('bank') || pm.includes('cbe') || pm.includes('telebirr') || desc.includes('manual') || isManualDep || isManualWd) :
      true
    );

    const matchesUser = !selectedUser || t.userId === selectedUser.id;
    return matchesSearch && matchesType && matchesMethod && matchesUser;
  });

  const totalTxPages = Math.max(1, Math.ceil(filteredTx.length / TX_PER_PAGE));
  const pagedTx = filteredTx.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE);

  const pendingQueue = paymentQueue.filter(p => p.status === 'pending');
  const historyQueue = paymentQueue.filter(p => p.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" /> Wallet & Payments Management
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Audit user balance ledgers, verify pending payment transfer receipts, and issue manual adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openAdjustmentModal('deposit')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Manual Deposit
          </button>
          <button
            onClick={() => openAdjustmentModal('withdraw')}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-900/40 transition-all"
          >
            <MinusCircle className="w-4 h-4" /> Manual Withdrawal
          </button>
        </div>
      </div>

      {/* PAYMENT VERIFICATION QUEUE CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" /> Payment Verification Queue
            </h2>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
              {pendingQueue.length} Pending
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setQueueTab('pending')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${queueTab === 'pending' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              Pending Submissions ({pendingQueue.length})
            </button>
            <button
              onClick={() => setQueueTab('history')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${queueTab === 'history' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              Audit History ({historyQueue.length})
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        {queueTab === 'pending' ? (
          pendingQueue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingQueue.map(item => {
                const isChapa = (item.paymentMethod || '').toLowerCase().includes('chapa');
                return (
                  <div key={item.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-white text-xs">{item.userName}</p>
                        <p className="text-[11px] text-slate-400">{item.userEmail}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isChapa ? 'bg-purple-950 text-purple-300 border-purple-800 font-bold' : 'bg-slate-800 text-purple-300 border-slate-700'}`}>
                            {item.paymentMethod}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">Ref: {item.referenceNumber}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-base font-bold text-emerald-400">+{item.amount} ETB</span>
                        <p className="text-[10px] text-slate-400">{item.credits} Credits</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">"{item.notes}"</p>

                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                      {isChapa ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Auto-Credited via Gateway
                          </span>
                          <button
                            type="button"
                            onClick={() => openChapaDetailModal(item)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-purple-300 px-3 py-1.5 rounded-lg font-bold transition-colors"
                          >
                            Details →
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                          >
                            <ImageIcon className="w-3.5 h-3.5" /> View Receipt Slip
                          </button>

                          {queueActionState?.id === item.id ? (
                            <div className="flex items-center gap-2">
                              {queueActionState.status === 'loading' && (
                                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold py-1 px-3 bg-amber-950/50 border border-amber-800 rounded-lg">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>{queueActionState.msg}</span>
                                </div>
                              )}
                              {queueActionState.status === 'success' && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold py-1 px-3 bg-emerald-950/60 border border-emerald-800 rounded-lg">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span>{queueActionState.msg}</span>
                                </div>
                              )}
                              {queueActionState.status === 'error' && (
                                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold py-1 px-3 bg-rose-950/60 border border-rose-800 rounded-lg">
                                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                  <span>{queueActionState.msg}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRejectQueueItem(item.id)}
                                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                              <button
                                onClick={() => handleApproveQueueItem(item.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-md shadow-emerald-900/30 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Credit
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              ✓ Verification queue is completely clear. All payments processed.
            </div>
          )
        ) : (
          <div className="divide-y divide-slate-800/60 text-xs">
            {historyQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No past audit history records found.
              </div>
            ) : (
              historyQueue.map(item => {
                const isChapa = (item.paymentMethod || '').toLowerCase().includes('chapa');
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isChapa) openChapaDetailModal(item);
                      else setHistoryDetailItem(item);
                    }}
                    className="py-3 px-3 rounded-xl flex items-center justify-between transition-colors hover:bg-slate-800/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isChapa && <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span className="font-bold text-white">{item.userName}</span>
                      <span className="text-[11px] text-slate-400 ml-1 font-mono">
                        ({item.paymentMethod} &bull; Ref: {item.referenceNumber || '—'})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-200 font-bold">{item.amount} ETB</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                        item.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {isChapa ? '⚡ Auto-Credited' : item.status}
                      </span>
                      <span className="text-xs text-purple-400 font-sans font-bold hover:underline">
                        Details &rarr;
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MASTER TRANSACTIONS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white">All Platform Transactions</h2>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative mr-3">
              <input
                type="text"
                placeholder="Search user by phone or name..."
                value={searchPhone}
                onChange={e => {
                  const v = e.target.value;
                  setSearchPhone(v);
                  if (!v) { setMatchedUsers([]); return; }
                  const found = users.filter(u => (u.phone || '').includes(v) || u.name.toLowerCase().includes(v.toLowerCase()));
                  setMatchedUsers(found.slice(0, 6));
                }}
                className="w-64 bg-slate-950/70 border border-slate-800 rounded-lg pl-3 pr-9 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
              {matchedUsers.length > 0 && (
                <div className="absolute left-0 mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg z-40 overflow-hidden text-xs">
                  {matchedUsers.map(u => (
                    <button key={u.id} onClick={() => { setSelectedUser(u); setMatchedUsers([]); setSearchPhone(''); }} className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-200">{u.name} — {u.phone}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter transactions..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setTxPage(1); }}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setTxPage(1); }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="bid_fee_paid">🔓 Bid Unlocked (Entry Fee)</option>
              <option value="credit_purchase">Credit Purchases</option>
              <option value="bid_placed">Bid Debits</option>
              <option value="winning_reward">Winning Rewards</option>
              <option value="manual_adjustment">Admin Manual Deposits</option>
              <option value="manual_withdrawal">Admin Manual Withdrawals</option>
              <option value="refund">Refunds</option>
            </select>

            {/* Method filter */}
            <select
              value={methodFilter ?? 'all'}
              onChange={e => { setMethodFilter(e.target.value === 'all' ? '' : e.target.value); setTxPage(1); }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Methods</option>
              <option value="Chapa">Chapa</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          {selectedUser && (
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{selectedUser.name} <span className="text-slate-400 font-mono">({selectedUser.phone})</span></div>
                <div className="text-slate-400 text-[12px]">{selectedUser.email}</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-[12px] text-slate-400">Balance</div>
                <div className="text-lg font-bold text-emerald-400">{selectedUser.walletBalance} ETB</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-[12px] text-slate-400">Total Deposits</div>
                <div className="text-lg font-bold text-emerald-300">{transactions.filter(t => t.userId === selectedUser.id && Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount || 0), 0)} ETB</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-[12px] text-slate-400">Total Withdrawals</div>
                <div className="text-lg font-bold text-rose-400">{Math.abs(transactions.filter(t => t.userId === selectedUser.id && Number(t.amount) < 0).reduce((s, t) => s + Number(t.amount || 0), 0))} ETB</div>
              </div>
              <div className="pl-4 flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (isRefreshing) return;
                    setIsRefreshing(true);
                    try {
                      const usersRes = await usersApi.list();
                      const usersMapped = usersRes.data.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email ?? '',
                        phone: u.phone ?? '',
                        role: u.role,
                        walletBalance: Number(u.wallet_balance ?? u.walletBalance ?? 0),
                        credits: Number(u.credits ?? 0),
                        status: u.status,
                        joinedAt: u.joined_at ?? u.joinedAt ?? new Date().toISOString().split('T')[0],
                        wonAuctions: u.won_auctions ?? u.wonAuctions ?? [],
                        photo: u.photo_url ?? u.photo ?? undefined,
                      }));
                      setUsers(usersMapped);

                      const txRes = await walletApi.allTransactions();
                      setTransactions((txRes.data || []).map((t: any) => ({
                        ...t,
                        timestamp: t.timestamp || t.created_at || t.createdAt || new Date().toISOString(),
                        amount: Number(t.amount || 0),
                      })));

                      const qRes = await walletApi.queue();
                      setPaymentQueue(qRes.data);
                    } catch (_e) {
                      // silently ignore refresh errors
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  disabled={isRefreshing}
                  className={`px-3 py-1.5 ${isRefreshing ? 'bg-slate-600 text-slate-300' : 'bg-slate-700 hover:bg-slate-600 text-white'} font-semibold text-xs rounded-lg`}
                >
                  {isRefreshing ? 'Refreshing…' : 'Refresh'}
                </button>
                <button
                  onClick={() => openAdjustmentModal('deposit', selectedUser.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg"
                >
                  Deposit
                </button>
                <button
                  onClick={() => openAdjustmentModal('withdraw', selectedUser.id)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg"
                >
                  Withdraw
                </button>
              </div>
            </div>
          )}
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Type</th>
                <th className="p-3">Method</th>
                <th className="p-3">Description</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {pagedTx.map(t => {
                const method = t.paymentMethod ?? '';
                const methodLabel = method.toLowerCase().includes('chapa') ? 'Chapa'
                  : method.toLowerCase().includes('manual') || method.toLowerCase().includes('bank') || method.toLowerCase().includes('cbe') || method.toLowerCase().includes('telebirr') ? 'Manual'
                  : method || '—';
                const methodColor = methodLabel === 'Chapa'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : methodLabel === 'Manual'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-700/50 text-slate-400 border-slate-600/30';

                const isChapaTx = methodLabel === 'Chapa' || (t.description || '').toLowerCase().includes('chapa');
                const isUnlockTx = t.type === 'bid_fee_paid' || (t.description || '').toLowerCase().includes('unlock entry fee');

                const typeBadgeLabel = isUnlockTx ? 'BID UNLOCKED'
                  : t.type === 'manual_withdrawal' ? 'MANUAL WITHDRAWAL'
                  : t.type === 'manual_adjustment' ? 'MANUAL DEPOSIT'
                  : t.type.replace(/_/g, ' ').toUpperCase();

                const typeBadgeColor = isUnlockTx
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : t.type === 'manual_withdrawal'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : t.type === 'manual_adjustment'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-purple-300 border-slate-700';

                return (
                <tr
                  key={t.id}
                  onClick={() => isChapaTx && openChapaDetailModal(t)}
                  className={`transition-colors ${isChapaTx ? 'hover:bg-purple-950/30 cursor-pointer' : 'hover:bg-slate-800/40'}`}
                >
                  <td className="p-3 font-semibold text-white">
                    <div className="flex items-center gap-1.5">
                      {isChapaTx && <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span>{t.userName}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${typeBadgeColor}`}>
                      {typeBadgeLabel}
                    </span>
                  </td>
                  <td className="p-3">
                    {methodLabel !== '—' ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${methodColor}`}>
                        {methodLabel}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-300">
                    {t.description}
                    {isChapaTx && <span className="text-[10px] text-purple-400 font-bold ml-2">(Click for Chapa Ledger Details)</span>}
                  </td>
                  <td className="p-3 font-mono font-bold">
                    <span className={Number(t.amount) >= 0 ? 'text-emerald-400' : 'text-slate-400'}>
                      {Number(t.amount) >= 0 ? `+${Number(t.amount).toFixed(2)}` : Number(t.amount).toFixed(2)} ETB
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-400">
                    {t.timestamp ? new Date(t.timestamp).toLocaleString() : '—'}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2 pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Showing <span className="text-slate-300 font-semibold">{filteredTx.length === 0 ? 0 : (txPage - 1) * TX_PER_PAGE + 1}</span>–<span className="text-slate-300 font-semibold">{Math.min(txPage * TX_PER_PAGE, filteredTx.length)}</span> of <span className="text-slate-300 font-semibold">{filteredTx.length}</span> transactions
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTxPage(p => Math.max(1, p - 1))}
              disabled={txPage === 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              ← Prev
            </button>
            {Array.from({ length: totalTxPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalTxPages || Math.abs(p - txPage) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-500 text-xs">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setTxPage(p as number)}
                    className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                      txPage === p
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
              disabled={txPage === totalTxPages}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* CHAPA AUTOMATED GATEWAY PAYMENT AUDIT MODAL */}
      {selectedChapaTx && (
        <div
          onClick={() => setSelectedChapaTx(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl cursor-default text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Chapa Automatic Gateway Audit</h3>
                  <p className="text-[10px] text-emerald-400 font-semibold">⚡ Auto-Verified &amp; Credited</p>
                </div>
              </div>
              <button onClick={() => setSelectedChapaTx(null)} className="text-slate-400 hover:text-white text-base font-bold">✕</button>
            </div>

            {/* User Profile */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">User Details</p>
              <div className="grid grid-cols-2 gap-2 text-slate-200">
                <div>
                  <p className="text-slate-500 text-[10px]">User Name</p>
                  <p className="font-bold text-white text-xs">{selectedChapaTx.userName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Phone Number</p>
                  <p className="font-mono text-cyan-300 text-xs">{selectedChapaTx.userPhone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-[10px]">Email Address</p>
                  <p className="font-mono text-slate-300 text-xs">{selectedChapaTx.userEmail}</p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payment Details</p>
              <div className="grid grid-cols-2 gap-2 text-slate-200 font-mono">
                <div>
                  <p className="text-slate-500 text-[10px] font-sans">Payment Amount</p>
                  <p className="font-black text-emerald-400 text-sm">+{selectedChapaTx.amount.toFixed(2)} ETB</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] font-sans">Gateway Ref Code</p>
                  <p className="font-bold text-amber-300 text-xs truncate">{selectedChapaTx.referenceNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-[10px] font-sans">Date &amp; Time</p>
                  <p className="text-slate-300 text-xs">{new Date(selectedChapaTx.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Before & After User Balance + Admin Balance */}
            <div className="bg-gradient-to-br from-slate-950 to-indigo-950/40 border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Platform Ledger Audit
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                  <p className="text-slate-400 text-[10px]">User Before Balance</p>
                  <p className="font-bold font-mono text-slate-300 text-xs mt-0.5">{selectedChapaTx.beforeBalance.toFixed(2)} ETB</p>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5">
                  <p className="text-emerald-400 text-[10px] font-bold">User After Balance</p>
                  <p className="font-black font-mono text-emerald-300 text-xs mt-0.5">{selectedChapaTx.afterBalance.toFixed(2)} ETB</p>
                </div>
              </div>

              <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-[10px] font-bold">Admin / Platform Balance</p>
                  <p className="text-[9px] text-slate-400">Current platform ledger balance</p>
                </div>
                <span className="font-black font-mono text-purple-200 text-sm">{selectedChapaTx.adminBalance.toFixed(2)} ETB</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedChapaTx(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors text-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Payment Receipt Verification</h3>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <img src={previewItem.receiptImage} alt="Receipt Slip" className="w-full h-56 object-cover" />
            </div>

            <div className="text-xs space-y-1 text-slate-300 font-mono">
              <p><span className="text-slate-500">Payer:</span> {previewItem.userName}</p>
              <p><span className="text-slate-500">Method:</span> {previewItem.paymentMethod}</p>
              <p><span className="text-slate-500">Ref Code:</span> {previewItem.referenceNumber}</p>
              <p><span className="text-slate-500">Amount:</span> {previewItem.amount} ETB ({previewItem.credits} Credits)</p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => {
                  rejectPayment(previewItem.id);
                  setPreviewItem(null);
                }}
                className="px-3 py-2 bg-rose-950 text-rose-300 text-xs rounded-lg font-semibold"
              >
                Reject Payment
              </button>
              <button
                onClick={() => {
                  approvePayment(previewItem.id);
                  setPreviewItem(null);
                }}
                className="px-3 py-2 bg-emerald-600 text-white text-xs rounded-lg font-semibold shadow-lg shadow-emerald-900/40"
              >
                Approve & Credit Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ADJUSTMENT FORM MODAL */}
      {showAdjustmentModal && (
        <div
          onClick={() => setShowAdjustmentModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {adjustmentMode === 'deposit' ? (
                  <><PlusCircle className="w-5 h-5 text-emerald-400" /> Manual Wallet Deposit</>
                ) : (
                  <><MinusCircle className="w-5 h-5 text-rose-400" /> Manual Wallet Withdrawal</>
                )}
              </h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="relative">
                <label className="block text-slate-300 font-semibold mb-1">Select User (Type Name or Phone)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type at least 3 chars/numbers to filter..."
                    value={modalUserSearch}
                    onFocus={() => setIsModalUserDropdownOpen(true)}
                    onChange={e => {
                      setModalUserSearch(e.target.value);
                      setIsModalUserDropdownOpen(true);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-purple-500 pr-8"
                  />
                  {modalUserSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalUserSearch('');
                        setIsModalUserDropdownOpen(true);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown User List */}
                {isModalUserDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800/50">
                    {modalUserSearch.trim().length > 0 && modalUserSearch.trim().length < 3 ? (
                      <div className="p-3 text-center text-[11px] text-amber-400 font-semibold">
                        Type at least 3 characters or numbers to start filtering...
                      </div>
                    ) : (
                      (() => {
                        const filtered = modalUserSearch.trim().length >= 3
                          ? users.filter(u => {
                              const q = modalUserSearch.toLowerCase().trim();
                              return u.name.toLowerCase().includes(q) ||
                                     (u.phone || '').includes(q) ||
                                     (u.email || '').toLowerCase().includes(q);
                            })
                          : users;

                        if (filtered.length === 0) {
                          return (
                            <div className="p-3 text-center text-xs text-slate-400">
                              No users match "{modalUserSearch}"
                            </div>
                          );
                        }

                        return filtered.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setModalUserSearch(`${u.name} (${u.phone || u.email})`);
                              setIsModalUserDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2.5 hover:bg-purple-950/40 transition-colors flex items-center justify-between ${selectedUserId === u.id ? 'bg-purple-900/30 text-purple-200' : 'text-slate-200'}`}
                          >
                            <span className="font-bold text-xs">{u.name}</span>
                            <span className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {u.phone || u.email}
                            </span>
                          </button>
                        ));
                      })()
                    )}
                  </div>
                )}
                {selectedUserObj && !isModalUserDropdownOpen && (
                  <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-2">
                    <span>Selected: <strong className="text-purple-300">{selectedUserObj.name}</strong> ({selectedUserObj.phone || selectedUserObj.email})</span>
                    <span className="font-mono text-emerald-400 ml-auto">Balance: {selectedUserObj.walletBalance} ETB</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Adjustment Type</label>
                  <select
                    value={adjustmentType}
                    onChange={e => setAdjustmentType(e.target.value as 'credit' | 'wallet')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="wallet">ETB Wallet Balance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {adjustmentMode === 'deposit' ? 'Deposit Amount (ETB)' : 'Withdrawal Amount (ETB)'}
                    {adjustmentMode === 'withdraw' && selectedUserObj && (
                      <span className="text-amber-400 font-normal text-[11px] ml-1">(User balance: {selectedUserObj.walletBalance} ETB)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={adjustmentAmount}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setAdjustmentAmount(val);
                      if (val <= 0) {
                        setAdjustState('error');
                        setAdjustMsg('Amount must be positive (> 0)');
                      } else if (adjustmentMode === 'withdraw' && selectedUserObj && val > selectedUserObj.walletBalance) {
                        setAdjustState('error');
                        setAdjustMsg(`Cannot withdraw more than user balance (${selectedUserObj.walletBalance} ETB)`);
                      } else {
                        if (adjustState === 'error') {
                          setAdjustState('idle');
                          setAdjustMsg('');
                        }
                      }
                    }}
                    placeholder="Enter positive ETB amount"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason / Admin Note</label>
                <textarea
                  rows={2}
                  value={adjustmentReason}
                  onChange={e => setAdjustmentReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Status message banner (Loading, Checkmark ✓, or X ✗) */}
              {adjustState !== 'idle' && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                  adjustState === 'loading' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                  adjustState === 'success' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                  'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}>
                  {adjustState === 'loading' && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-400" />}
                  {adjustState === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                  {adjustState === 'error'   && <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                  <span>{adjustMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setAdjustState('idle');
                  setAdjustMsg('');
                }}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adjustState === 'loading' || adjustState === 'success'}
                onClick={handleManualAdjustSubmit}
                className={`px-4 py-2 text-white text-xs rounded-lg font-semibold disabled:opacity-60 transition-all flex items-center gap-2 shadow-lg ${
                  adjustmentMode === 'deposit'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
                }`}
              >
                {adjustState === 'loading' ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Processing…</span></>
                ) : adjustState === 'success' ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 text-white" /><span>Completed!</span></>
                ) : (
                  <span>{adjustmentMode === 'deposit' ? 'Post Deposit' : 'Post Withdrawal'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AUDIT HISTORY SHORT DETAIL MODAL */}
      {historyDetailItem && (
        <div
          onClick={() => setHistoryDetailItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl cursor-default animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Payment Audit Record</h3>
              </div>
              <button
                onClick={() => setHistoryDetailItem(null)}
                className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Receipt slip if available */}
            {historyDetailItem.receiptImage && historyDetailItem.receiptImage !== 'admin-withdrawal' && (
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-48 flex items-center justify-center">
                <img
                  src={historyDetailItem.receiptImage}
                  alt="Receipt Slip"
                  className="w-full h-48 object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            {/* Audit Details */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">User / Payer:</span>
                <span className="font-bold text-white">{historyDetailItem.userName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-300">{historyDetailItem.userEmail || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                  {historyDetailItem.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reference / TXN Code:</span>
                <span className="font-mono text-amber-300 font-bold select-all">
                  {historyDetailItem.referenceNumber || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {Number(historyDetailItem.amount) >= 0 ? `+${historyDetailItem.amount}` : historyDetailItem.amount} ETB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                  historyDetailItem.status === 'approved'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}>
                  {historyDetailItem.status.toUpperCase()}
                </span>
              </div>
              {historyDetailItem.notes && (
                <div className="pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400 block mb-0.5">Notes:</span>
                  <p className="text-slate-300 italic text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-800">
                    "{historyDetailItem.notes}"
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setHistoryDetailItem(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors text-xs"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
