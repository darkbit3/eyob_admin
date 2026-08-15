import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp, Gavel, Package, CreditCard, ArrowDownLeft, ArrowUpRight,
  Search, ChevronUp, ChevronDown, Trophy, Clock, CheckCircle, XCircle, Minus
} from 'lucide-react';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SortKey = 'title' | 'retailValue' | 'totalBidPerCost' | 'totalBidAmount' | 'adminGain' | 'status' | 'totalBids';
type SortDir = 'asc' | 'desc';

export default function AdminProfit() {
  const { auctions, transactions, bids } = useApp();

  // ── Global summary metrics ─────────────────────────────────────────────────
  const totalRetailValue = auctions.reduce((s, a) => s + Number(a.retailValue ?? 0), 0);
  const totalBidPerCost  = auctions.reduce((s, a) => s + Number(a.bidPerCost ?? 0) * Number(a.totalBids ?? 0), 0);
  const totalBidAmount   = transactions
    .filter(t => t.type === 'bid_placed')
    .reduce((s, t) => s + Math.abs(Number(t.amount ?? 0)), 0);
  const totalDeposits    = transactions
    .filter(t => ['credit_purchase', 'wallet_deposit', 'manual_adjustment'].includes(t.type) && Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount ?? 0), 0);
  const totalWithdrawals = transactions
    .filter(t => t.type === 'manual_adjustment' && Number(t.amount) < 0)
    .reduce((s, t) => s + Math.abs(Number(t.amount ?? 0)), 0);
  const netProfit = totalBidPerCost - totalWithdrawals;

  // ── Per-auction table data ──────────────────────────────────────────────────
  const auctionRows = useMemo(() => {
    return auctions.map(a => {
      // All bids placed in this auction
      const auctionBids = bids.filter(b => b.auctionId === a.id);
      const auctionTxs  = transactions.filter(t =>
        t.type === 'bid_placed' && t.description?.toLowerCase().includes(a.id)
      );

      const bidCount         = a.totalBids ?? auctionBids.length;
      const bidPerCost       = Number(a.bidPerCost ?? 0);
      const totalBidPerCost  = bidPerCost * bidCount;
      // Sum of bid amounts paid (deducted from wallets) for this auction
      const totalBidAmount   = auctionTxs.reduce((s, t) => s + Math.abs(Number(t.amount ?? 0)), 0)
                             || auctionBids.reduce((s, b) => s + Math.abs(Number(b.amount ?? bidPerCost)), 0);
      const retailValue      = Number(a.retailValue ?? 0);
      // Admin gain = bid fees collected - retail value of item (profit after giving away the item)
      const adminGain        = totalBidPerCost - retailValue;

      return {
        id:            a.id,
        title:         a.title,
        category:      a.category,
        status:        a.status,
        image:         a.image,
        retailValue,
        bidPerCost,
        totalBids:     bidCount,
        totalBidPerCost,
        totalBidAmount,
        adminGain,
        winnerName:    a.winnerName || null,
        lowestUniqueBid: a.lowestUniqueBid ?? null,
        startTime:     a.startTime,
        endTime:       a.endTime,
        totalParticipants: a.totalParticipants ?? 0,
      };
    });
  }, [auctions, bids, transactions]);

  // ── Sorting & filtering ────────────────────────────────────────────────────
  const [search, setSearch]     = useState('');
  const [sortKey, setSortKey]   = useState<SortKey>('adminGain');
  const [sortDir, setSortDir]   = useState<SortDir>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const filtered = useMemo(() => {
    return auctionRows
      .filter(r => statusFilter === 'all' || r.status === statusFilter)
      .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let va: any = a[sortKey];
        let vb: any = b[sortKey];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [auctionRows, search, sortKey, sortDir, statusFilter]);

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <Minus className="w-3 h-3 text-slate-600 inline ml-0.5" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-purple-400 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 text-purple-400 inline ml-0.5" />;
  }

  function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
      active:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      upcoming: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      closed:   'bg-slate-700/60 text-slate-400 border-slate-700',
      paused:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
      draft:    'bg-slate-800 text-slate-500 border-slate-700',
    };
    const icons: Record<string, any> = {
      active:   <CheckCircle className="w-3 h-3" />,
      upcoming: <Clock className="w-3 h-3" />,
      closed:   <XCircle className="w-3 h-3" />,
      paused:   <Clock className="w-3 h-3" />,
      draft:    <Minus className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[status] || map.draft}`}>
        {icons[status]} {status.toUpperCase()}
      </span>
    );
  }

  const statCards = [
    {
      label: 'Total Auction Retail Value',
      value: `${fmt(totalRetailValue)} ETB`,
      icon: <Package className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/30 bg-blue-500/5',
      desc: `Across ${auctions.length} auctions`,
    },
    {
      label: 'Total Bid Per Cost Revenue',
      value: `${fmt(totalBidPerCost)} ETB`,
      icon: <CreditCard className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-500/5',
      desc: 'Sum of all bid fees collected',
    },
    {
      label: 'Total Bid Amount Placed',
      value: `${fmt(totalBidAmount)} ETB`,
      icon: <Gavel className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-500/5',
      desc: 'All bids placed by users',
    },
    {
      label: 'Total Deposits',
      value: `+${fmt(totalDeposits)} ETB`,
      icon: <ArrowDownLeft className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-500/5',
      desc: 'All approved deposits',
    },
    {
      label: 'Total Withdrawals',
      value: `-${fmt(totalWithdrawals)} ETB`,
      icon: <ArrowUpRight className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/30 bg-rose-500/5',
      desc: 'All processed withdrawals',
    },
    {
      label: 'Net Platform Profit',
      value: `${fmt(netProfit)} ETB`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-300" />,
      color: 'border-emerald-400/40 bg-emerald-500/10',
      desc: 'Bid fees minus withdrawals',
      highlight: true,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" /> Profit &amp; Revenue Overview
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Platform financial summary — auction revenue, bid fees, and per-auction profit breakdown.
        </p>
      </div>

      {/* Summary Stat Cards */}
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

      {/* ── Per-Auction Profit Breakdown Table ─────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Gavel className="w-4 h-4 text-purple-400" /> Per-Auction Profit Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filtered.length} auction{filtered.length !== 1 ? 's' : ''} shown
              {' '}&mdash; sorted by {sortKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="closed">Closed</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search auction or category…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-950 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Auction</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-300 whitespace-nowrap" onClick={() => toggleSort('status')}>
                  Status <SortIcon k="status" />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-300 text-right whitespace-nowrap" onClick={() => toggleSort('retailValue')}>
                  Retail Value <SortIcon k="retailValue" />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-300 text-right whitespace-nowrap" onClick={() => toggleSort('totalBids')}>
                  Total Bids <SortIcon k="totalBids" />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-300 text-right whitespace-nowrap" onClick={() => toggleSort('totalBidPerCost')}>
                  Bid Fee Revenue <SortIcon k="totalBidPerCost" />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-300 text-right whitespace-nowrap" onClick={() => toggleSort('totalBidAmount')}>
                  Bid Amount <SortIcon k="totalBidAmount" />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-300 text-right whitespace-nowrap" onClick={() => toggleSort('adminGain')}>
                  Admin Gain <SortIcon k="adminGain" />
                </th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Winner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-sm">
                    No auctions found.
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Auction */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={row.image}
                          alt={row.title}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div>
                          <p className="font-bold text-white text-xs leading-tight max-w-[180px] truncate">{row.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{row.category}</p>
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                            Bid fee: {row.bidPerCost} ETB &bull; {row.totalParticipants} participants
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>

                    {/* Retail Value */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-blue-300 font-bold">{fmt(row.retailValue)}</span>
                      <span className="text-slate-500 ml-1 text-[10px]">ETB</span>
                    </td>

                    {/* Total Bids */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-amber-300 font-bold">{row.totalBids.toLocaleString()}</span>
                      <span className="text-slate-500 ml-1 text-[10px]">bids</span>
                    </td>

                    {/* Bid Fee Revenue (totalBidPerCost) */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-purple-300 font-bold">{fmt(row.totalBidPerCost)}</span>
                      <span className="text-slate-500 ml-1 text-[10px]">ETB</span>
                    </td>

                    {/* Total Bid Amount placed */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-slate-300 font-bold">{fmt(row.totalBidAmount)}</span>
                      <span className="text-slate-500 ml-1 text-[10px]">ETB</span>
                    </td>

                    {/* Admin Gain */}
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono font-black text-sm ${row.adminGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {row.adminGain >= 0 ? '+' : ''}{fmt(row.adminGain)}
                      </span>
                      <span className="text-slate-500 ml-1 text-[10px]">ETB</span>
                      <div className="text-[9px] text-slate-600 mt-0.5 font-mono">
                        fee rev &minus; retail
                      </div>
                    </td>

                    {/* Winner */}
                    <td className="px-4 py-3 text-center">
                      {row.winnerName ? (
                        <div>
                          <div className="flex items-center justify-center gap-1 text-amber-300 font-bold text-[11px]">
                            <Trophy className="w-3 h-3" /> {row.winnerName}
                          </div>
                          {row.lowestUniqueBid != null && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Bid: {row.lowestUniqueBid} ETB
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px] italic">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table footer totals */}
            {filtered.length > 0 && (
              <tfoot className="bg-slate-950/80 border-t border-slate-700">
                <tr>
                  <td className="px-4 py-3 font-black text-slate-300 text-xs" colSpan={2}>
                    TOTALS ({filtered.length} auctions)
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-blue-300">
                    {fmt(filtered.reduce((s, r) => s + r.retailValue, 0))} ETB
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-amber-300">
                    {filtered.reduce((s, r) => s + r.totalBids, 0).toLocaleString()} bids
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-purple-300">
                    {fmt(filtered.reduce((s, r) => s + r.totalBidPerCost, 0))} ETB
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-slate-300">
                    {fmt(filtered.reduce((s, r) => s + r.totalBidAmount, 0))} ETB
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const total = filtered.reduce((s, r) => s + r.adminGain, 0);
                      return (
                        <span className={`font-mono font-black text-sm ${total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {total >= 0 ? '+' : ''}{fmt(total)} ETB
                        </span>
                      );
                    })()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
