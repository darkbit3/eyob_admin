import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { walletApi } from '../utils/api';
import {
  TrendingUp, Gavel, Package, CreditCard, ArrowDownLeft, ArrowUpRight,
  RefreshCw, Loader2, CheckCircle, XCircle, ExternalLink, Building2,
  Copy, Check, DollarSign
} from 'lucide-react';

// ── Chapa logo inline ─────────────────────────────────────────────────────────
function ChapaIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
      <circle cx="20" cy="20" r="20" fill="#2563EB" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">C</text>
    </svg>
  );
}

export default function AdminProfit() {
  const { auctions, transactions, currentUser, refreshCurrentUser } = useApp();

  // ── Profit metrics computed from live data ────────────────────────────────
  const totalRetailValue   = auctions.reduce((s, a) => s + Number(a.retailValue  ?? 0), 0);
  const totalBidPerCost    = auctions.reduce((s, a) => s + Number(a.bidPerCost   ?? 0) * Number(a.totalBids ?? 0), 0);
  const totalBidAmount     = transactions
    .filter(t => t.type === 'bid_placed')
    .reduce((s, t) => s + Math.abs(Number(t.amount ?? 0)), 0);
  const totalDeposits      = transactions
    .filter(t => ['credit_purchase', 'wallet_deposit', 'manual_adjustment'].includes(t.type) && Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount ?? 0), 0);
  const totalWithdrawals   = transactions
    .filter(t => t.type === 'manual_adjustment' && Number(t.amount) < 0)
    .reduce((s, t) => s + Math.abs(Number(t.amount ?? 0)), 0);
  const netProfit          = totalBidPerCost - totalWithdrawals;

  // ── Admin self wallet state ───────────────────────────────────────────────
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [copiedBank, setCopiedBank] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

  // Withdraw fields
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [withdrawAccNo, setWithdrawAccNo] = useState('');
  const [withdrawAccName, setWithdrawAccName] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  const bankAccounts = [
    { name: 'Commercial Bank of Ethiopia (CBE)', accNo: '1000 4829 10482', holder: 'BidLow Auctions PLC' },
    { name: 'Telebirr Transfer',                 accNo: '0911 002 233',    holder: 'BidLow Telebirr Merchant' },
    { name: 'Dashen Bank / Amole',               accNo: '0132 9845 2011',  holder: 'BidLow Auctions PLC' },
  ];

  // ── Chapa deposit ─────────────────────────────────────────────────────────
  async function handleChapaDeposit() {
    const amt = Number(amount);
    if (!amt || amt < 10) { setMsg('Minimum deposit is 10 ETB.'); setMsgType('error'); return; }
    setLoading(true);
    setMsg('Redirecting to Chapa…');
    setMsgType('info');
    try {
      const res = await walletApi.chapaInitialize(amt);
      if (res.success && res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        setMsg('Failed to initialize Chapa payment.'); setMsgType('error');
      }
    } catch (err: any) {
      setMsg(err?.message || 'Chapa initialization failed.'); setMsgType('error');
    } finally {
      setLoading(false);
    }
  }

  // ── Withdraw request ──────────────────────────────────────────────────────
  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) { setWithdrawMsg('Enter a valid amount.'); return; }
    if (amt > (currentUser?.walletBalance ?? 0)) { setWithdrawMsg('Insufficient balance.'); return; }
    if (!withdrawAccNo || !withdrawAccName) { setWithdrawMsg('Provide account number and holder name.'); return; }
    setWithdrawLoading(true);
    setWithdrawMsg('');
    try {
      await walletApi.submitDeposit({
        amount: -amt,
        credits: 0,
        payment_method: withdrawBank,
        reference_number: `WD-ADMIN-${Date.now()}`,
        receipt_image: 'admin-withdrawal',
        notes: `Admin withdrawal to ${withdrawBank} — ${withdrawAccName} (${withdrawAccNo})`,
      });
      setWithdrawMsg(`✅ Withdrawal of ${amt} ETB submitted successfully.`);
      setWithdrawAmount('');
      setWithdrawAccNo('');
      setWithdrawAccName('');
      await refreshCurrentUser();
    } catch (err: any) {
      setWithdrawMsg(err?.message || 'Withdrawal failed.');
    } finally {
      setWithdrawLoading(false);
    }
  }

  // ── Auto-verify Chapa on return ───────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef  = params.get('tx_ref');
    const status = params.get('status');
    if (!txRef || status !== 'success') return;
    window.history.replaceState({}, '', window.location.pathname);
    setMsg('Verifying Chapa payment…'); setMsgType('info');
    walletApi.chapaVerify(txRef)
      .then(res => {
        if (res.success && res.data?.status === 'approved') {
          setMsg(`✅ ${res.message || 'Payment confirmed! Wallet credited.'}`);
          setMsgType('success');
          refreshCurrentUser();
        } else {
          setMsg('⚠️ Payment pending confirmation.'); setMsgType('info');
        }
      })
      .catch(() => { setMsg('Could not auto-verify payment.'); setMsgType('error'); });
  }, []);

  const statCards = [
    {
      label: 'Total Auction Retail Value',
      value: `${totalRetailValue.toLocaleString()} ETB`,
      icon: <Package className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/30 bg-blue-500/5',
      desc: `Across ${auctions.length} auctions`,
    },
    {
      label: 'Total Bid Per Cost Revenue',
      value: `${totalBidPerCost.toLocaleString()} ETB`,
      icon: <CreditCard className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-500/5',
      desc: 'Sum of all bid fees paid',
    },
    {
      label: 'Total Bid Amount Placed',
      value: `${totalBidAmount.toLocaleString()} ETB`,
      icon: <Gavel className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-500/5',
      desc: 'All bids placed by users',
    },
    {
      label: 'Total Deposits',
      value: `+${totalDeposits.toLocaleString()} ETB`,
      icon: <ArrowDownLeft className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-500/5',
      desc: 'All approved deposits',
    },
    {
      label: 'Total Withdrawals',
      value: `-${totalWithdrawals.toLocaleString()} ETB`,
      icon: <ArrowUpRight className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/30 bg-rose-500/5',
      desc: 'All processed withdrawals',
    },
    {
      label: 'Net Profit',
      value: `${netProfit.toLocaleString()} ETB`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-300" />,
      color: 'border-emerald-400/40 bg-emerald-500/10',
      desc: 'Bid fees minus withdrawals',
      highlight: true,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Profit & Revenue Overview
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Platform financial summary — auction revenue, bid fees, and wallet activity.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Admin Balance</p>
          <p className="text-2xl font-black text-emerald-400">{(currentUser?.walletBalance ?? 0).toLocaleString()} ETB</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.color} ${s.highlight ? 'ring-1 ring-emerald-500/40' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-slate-800/60 rounded-xl">{s.icon}</div>
              {s.highlight && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">Net Profit</span>}
            </div>
            <p className={`text-2xl font-black ${s.highlight ? 'text-emerald-300' : 'text-white'}`}>{s.value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">{s.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Admin Wallet — Deposit / Withdraw */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">

        {/* Chapa verify message */}
        {msg && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            msgType === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
            msgType === 'error'   ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
            'bg-blue-500/10 text-blue-300 border-blue-500/30'
          }`}>
            {msgType === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
            {msgType === 'error'   && <XCircle className="w-4 h-4 shrink-0" />}
            {msgType === 'info'    && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
            {msg}
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Admin Wallet
          </h2>
          {/* Deposit / Withdraw toggle */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setWalletTab('deposit')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                walletTab === 'deposit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >↓ Deposit</button>
            <button
              onClick={() => setWalletTab('withdraw')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                walletTab === 'withdraw' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >↑ Withdraw</button>
          </div>
        </div>

        {/* ── DEPOSIT TAB ──────────────────────────────────────────────────── */}
        {walletTab === 'deposit' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Top up your admin wallet via Chapa or manual bank transfer.</p>

            {/* Amount pills */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Select Amount (ETB)</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {['100', '250', '500', '1000'].map(val => (
                  <button key={val} type="button" onClick={() => setAmount(val)}
                    className={`py-2 text-xs font-black rounded-xl border transition-all ${
                      amount === val
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}>
                    {val} ETB
                  </button>
                ))}
              </div>
              <input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                placeholder="Or enter custom amount"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Chapa info */}
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-300 font-medium">
              🔒 You'll be redirected to Chapa's secure checkout. Supports Telebirr, CBE Birr, Mobile Banking &amp; Cards.
              After payment, you'll return here automatically and your wallet will be credited instantly.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleChapaDeposit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                Pay {amount || 0} ETB via Chapa
              </button>

              <button
                type="button"
                onClick={() => setShowBankDetails(v => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                {showBankDetails ? 'Hide bank details ▲' : 'Manual bank transfer ▼'}
              </button>
            </div>

            {/* Bank details reveal */}
            {showBankDetails && (
              <div className="p-4 bg-slate-950 border border-slate-700 rounded-2xl space-y-2">
                <p className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Transfer to Any Official Account:
                </p>
                <div className="space-y-2 mt-2">
                  {bankAccounts.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <p className="font-bold text-white">{b.name}</p>
                        <p className="text-[10px] text-slate-500">{b.holder}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(b.accNo); setCopiedBank(true); setTimeout(() => setCopiedBank(false), 2000); }}
                        className="flex items-center gap-1 font-mono font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded transition-colors"
                      >
                        {b.accNo}
                        {copiedBank ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── WITHDRAW TAB ─────────────────────────────────────────────────── */}
        {walletTab === 'withdraw' && (
          <form onSubmit={handleWithdraw} className="space-y-4 max-w-lg">
            <p className="text-xs text-slate-400">Withdraw funds from your admin wallet to your bank or Telebirr account.</p>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-medium">
              Available balance: <strong className="text-white">{(currentUser?.walletBalance ?? 0).toLocaleString()} ETB</strong>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Amount (ETB)</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {['100', '250', '500', '1000'].map(val => (
                  <button key={val} type="button" onClick={() => setWithdrawAmount(val)}
                    className={`py-2 text-xs font-black rounded-xl border transition-all ${
                      withdrawAmount === val ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}>
                    {val} ETB
                  </button>
                ))}
              </div>
              <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Or enter custom amount"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500" />
            </div>

            {/* Bank */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Destination Bank</label>
              <select value={withdrawBank} onChange={e => setWithdrawBank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-rose-500">
                <option value="Commercial Bank of Ethiopia (CBE)">CBE</option>
                <option value="Telebirr Transfer">Telebirr</option>
                <option value="Dashen Bank / Amole">Dashen Bank / Amole</option>
              </select>
            </div>

            {/* Account */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Account / Phone No.</label>
                <input type="text" value={withdrawAccNo} onChange={e => setWithdrawAccNo(e.target.value)}
                  placeholder="e.g. 1000 4829 10482"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Account Holder Name</label>
                <input type="text" value={withdrawAccName} onChange={e => setWithdrawAccName(e.target.value)}
                  placeholder="Name on account"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500" />
              </div>
            </div>

            {withdrawMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold border ${
                withdrawMsg.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>{withdrawMsg}</div>
            )}

            <button type="submit" disabled={withdrawLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50">
              {withdrawLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              Submit Withdrawal Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
