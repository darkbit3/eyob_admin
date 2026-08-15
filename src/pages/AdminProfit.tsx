import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { reportsApi } from '../utils/api';
import {
  TrendingUp, Gavel, Package, CreditCard, ArrowDownLeft, ArrowUpRight,
  Search, ChevronUp, ChevronDown, Trophy, Clock, CheckCircle, XCircle, Minus,
  Calendar, RefreshCw, Loader2, Filter, Eye, X
} from 'lucide-react';

function fmt(n: number | string | undefined | null) {
  const num = Number(n ?? 0);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SortKey = 'title' | 'retail_value' | 'total_bid_per_cost_revenue' | 'total_bid_amount' | 'admin_gain' | 'status' | 'total_bids';
type SortDir = 'asc' | 'desc';

interface AuctionProfitItem {
  id: string;
  title: string;
  category: string;
  status: string;
  image: string;
  retail_value: number;
  bid_per_cost: number;
  total_bids: number;
  total_participants: number;
  start_time: string;
  end_time: string;
  created_at: string;
  lowest_unique_bid: number | null;
  winner_id: string | null;
  winner_name: string | null;
  total_bid_amount: number;
  total_bid_per_cost_revenue: number;
  admin_gain: number;
}

interface ProfitSummary {
  auction_count: number;
  total_retail_value: number;
  total_bid_fee_revenue: number;
  total_bid_amount: number;
  total_deposits: number;
  total_withdrawals: number;
  net_profit: number;
}

export default function AdminProfit() {
  const { auctions: contextAuctions, bids: contextBids, transactions: contextTxs } = useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auctions, setAuctions] = useState<AuctionProfitItem[]>([]);
  const [summary, setSummary] = useState<ProfitSummary>({
    auction_count: 0,
    total_retail_value: 0,
    total_bid_fee_revenue: 0,
    total_bid_amount: 0,
    total_deposits: 0,
    total_withdrawals: 0,
    net_profit: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [search, setSearch] = useState('');

  // Selected Auction for Header Spotlight Focus
  const [selectedAuction, setSelectedAuction] = useState<AuctionProfitItem | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('admin_gain');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Fallback builder from AppContext live memory/data
  const buildFromContext = useCallback(() => {
    const list: AuctionProfitItem[] = (contextAuctions || [])
      .filter((a: any) => statusFilter === 'all' || a.status === statusFilter)
      .map((a: any) => {
        const aBids = (contextBids || []).filter((b: any) => b.auctionId === a.id);
        const aTxs = (contextTxs || []).filter((t: any) => t.type === 'bid_placed' && t.description?.includes(a.id));
        const totalBids = a.totalBids ?? aBids.length;
        const bidCost = Number(a.bidPerCost ?? 100);
        const feeRev = totalBids * bidCost;
        const retVal = Number(a.retailValue ?? 0);
        const bidAmt = aTxs.reduce((s: number, t: any) => s + Math.abs(Number(t.amount ?? 0)), 0)
          || aBids.reduce((s: number, b: any) => s + Math.abs(Number(b.amount ?? bidCost)), 0);

        return {
          id: a.id,
          title: a.title,
          category: a.category,
          status: a.status,
          image: a.image,
          retail_value: retVal,
          bid_per_cost: bidCost,
          total_bids: totalBids,
          total_participants: a.totalParticipants ?? aBids.length,
          start_time: a.startTime,
          end_time: a.endTime,
          created_at: a.startTime || new Date().toISOString(),
          lowest_unique_bid: a.lowestUniqueBid ?? null,
          winner_id: a.winnerId ?? null,
          winner_name: a.winnerName ?? null,
          total_bid_amount: bidAmt,
          total_bid_per_cost_revenue: feeRev,
          admin_gain: feeRev - retVal,
        };
      });

    const sumRetail = list.reduce((s: number, r: AuctionProfitItem) => s + r.retail_value, 0);
    const sumFeeRev = list.reduce((s: number, r: AuctionProfitItem) => s + r.total_bid_per_cost_revenue, 0);
    const sumBidAmt = (contextTxs || []).filter((t: any) => t.type === 'bid_placed').reduce((s: number, t: any) => s + Math.abs(Number(t.amount ?? 0)), 0);
    const sumDep = (contextTxs || []).filter((t: any) => ['credit_purchase', 'wallet_deposit', 'manual_adjustment'].includes(t.type) && Number(t.amount) > 0).reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);
    const sumWd = (contextTxs || []).filter((t: any) => t.type === 'manual_adjustment' && Number(t.amount) < 0).reduce((s: number, t: any) => s + Math.abs(Number(t.amount ?? 0)), 0);

    setAuctions(list);
    setSummary({
      auction_count: list.length,
      total_retail_value: sumRetail,
      total_bid_fee_revenue: sumFeeRev,
      total_bid_amount: sumBidAmt,
      total_deposits: sumDep,
      total_withdrawals: sumWd,
      net_profit: sumFeeRev - sumWd,
    });
  }, [contextAuctions, contextBids, contextTxs, statusFilter]);

  // Fetch real-time data from database via backend API with fallback
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await reportsApi.profit({
        status: statusFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      if (res.success && res.data && Array.isArray(res.data.auctions) && res.data.auctions.length > 0) {
        const rawAuctions = res.data.auctions;
        const formatted: AuctionProfitItem[] = rawAuctions.map((a: any) => ({
          ...a,
          retail_value: Number(a.retail_value ?? 0),
          bid_per_cost: Number(a.bid_per_cost ?? 100),
          total_bids: Number(a.total_bids ?? 0),
          total_participants: Number(a.total_participants ?? 0),
          total_bid_amount: Number(a.total_bid_amount ?? 0),
          total_bid_per_cost_revenue: Number(a.total_bid_per_cost_revenue ?? (Number(a.bid_per_cost ?? 100) * Number(a.total_bids ?? 0))),
          admin_gain: Number(a.admin_gain ?? ((Number(a.bid_per_cost ?? 100) * Number(a.total_bids ?? 0)) - Number(a.retail_value ?? 0))),
        }));
        setAuctions(formatted);

        if (selectedAuction) {
          const updatedSelected = formatted.find((item: any) => item.id === selectedAuction.id);
          if (updatedSelected) setSelectedAuction(updatedSelected);
        }

        if (res.data.summary) {
          setSummary({
            auction_count: Number(res.data.summary.auction_count ?? formatted.length),
            total_retail_value: Number(res.data.summary.total_retail_value ?? 0),
            total_bid_fee_revenue: Number(res.data.summary.total_bid_fee_revenue ?? 0),
            total_bid_amount: Number(res.data.summary.total_bid_amount ?? 0),
            total_deposits: Number(res.data.summary.total_deposits ?? 0),
            total_withdrawals: Number(res.data.summary.total_withdrawals ?? 0),
            net_profit: Number(res.data.summary.net_profit ?? 0),
          });
        }
      } else {
        // Fallback to client context if API returns 0 items
        buildFromContext();
      }
    } catch (err) {
      console.warn('API profit report error, using AppContext fallback:', err);
      buildFromContext();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, dateFrom, dateTo, selectedAuction?.id, buildFromContext]);

  useEffect(() => {
    fetchData();
  }, [statusFilter, dateFrom, dateTo, contextAuctions]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const filteredAuctions = useMemo(() => {
    return auctions
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
  }, [auctions, search, sortKey, sortDir]);

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
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[status] || map.draft}`}>
        {icons[status]} {status.toUpperCase()}
      </span>
    );
  }

  const statCards = [
    {
      label: 'Total Auction Retail Value',
      value: `${fmt(selectedAuction ? selectedAuction.retail_value : summary.total_retail_value)} ETB`,
      icon: <Package className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/30 bg-blue-500/5',
      desc: selectedAuction ? `Retail for this selected auction` : `Across ${summary.auction_count} auctions`,
    },
    {
      label: 'Total Bid Per Cost Revenue',
      value: `${fmt(selectedAuction ? selectedAuction.total_bid_per_cost_revenue : summary.total_bid_fee_revenue)} ETB`,
      icon: <CreditCard className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-500/5',
      desc: selectedAuction ? `Collected from this auction (${selectedAuction.total_bids} bids)` : 'Sum of all bid fees paid',
    },
    {
      label: 'Total Bid Amount Placed',
      value: `${fmt(selectedAuction ? selectedAuction.total_bid_amount : summary.total_bid_amount)} ETB`,
      icon: <Gavel className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-500/5',
      desc: selectedAuction ? `Bids placed on this auction` : 'All bids placed by users',
    },
    {
      label: 'Total Deposits',
      value: `+${fmt(summary.total_deposits)} ETB`,
      icon: <ArrowDownLeft className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-500/5',
      desc: 'All approved deposits',
    },
    {
      label: 'Total Withdrawals',
      value: `-${fmt(summary.total_withdrawals)} ETB`,
      icon: <ArrowUpRight className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/30 bg-rose-500/5',
      desc: 'All processed withdrawals',
    },
    {
      label: selectedAuction ? 'Admin Net Gain (This Auction)' : 'Net Profit',
      value: `${fmt(selectedAuction ? selectedAuction.admin_gain : summary.net_profit)} ETB`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-300" />,
      color: 'border-emerald-400/40 bg-emerald-500/10',
      desc: selectedAuction ? 'Bid fees revenue minus item retail value' : 'Bid fees minus withdrawals',
      highlight: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Profit &amp; Revenue Overview (Real-Time)
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Live database financial calculations: auction retail, bid per cost revenue, admin net profit, and date/status filters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold rounded-xl border border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Selected Auction Spotlight Banner */}
      {selectedAuction && (
        <div className="p-4 bg-gradient-to-r from-purple-950/80 via-slate-900 to-emerald-950/80 border border-purple-500/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <img
              src={selectedAuction.image}
              alt={selectedAuction.title}
              className="w-14 h-14 rounded-xl object-cover border-2 border-purple-400/50 shadow-md"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500 text-white px-2 py-0.5 rounded-md">
                  ★ Selected Auction Focus
                </span>
                <StatusBadge status={selectedAuction.status} />
              </div>
              <h2 className="text-base font-black text-white mt-1">{selectedAuction.title}</h2>
              <p className="text-xs text-slate-300 font-mono">
                Retail: <strong className="text-blue-300">{fmt(selectedAuction.retail_value)} ETB</strong> &bull; Total Bids: <strong className="text-amber-300">{selectedAuction.total_bids}</strong> &bull; Revenue: <strong className="text-purple-300">{fmt(selectedAuction.total_bid_per_cost_revenue)} ETB</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Admin Gain</span>
              <p className={`text-xl font-black font-mono ${selectedAuction.admin_gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedAuction.admin_gain >= 0 ? '+' : ''}{fmt(selectedAuction.admin_gain)} ETB
              </p>
            </div>
            <button
              onClick={() => setSelectedAuction(null)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.color} ${s.highlight ? 'ring-1 ring-emerald-500/40' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-slate-800/60 rounded-xl">{s.icon}</div>
              {s.highlight && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                  {selectedAuction ? 'Auction Gain' : 'Net Profit'}
                </span>
              )}
            </div>
            <p className={`text-2xl font-black ${s.highlight ? 'text-emerald-300' : 'text-white'}`}>{s.value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">{s.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar: Status, Date From, Date To, Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Filters &amp; Date Range</span>
          </div>
          {(statusFilter !== 'all' || dateFrom || dateTo || search) && (
            <button
              onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); setSearch(''); }}
              className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Auction Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-purple-500 font-semibold"
            >
              <option value="all">All Auctions</option>
              <option value="active">Active (Live)</option>
              <option value="upcoming">Upcoming</option>
              <option value="closed">Closed (Finished)</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-400" /> Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-400" /> Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search Keyword</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Title or category…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Per-Auction Profit Breakdown Table ─────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Title Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Gavel className="w-4 h-4 text-purple-400" /> Auction Financial List
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click on any auction row to select and display its statistics at the top.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            {filteredAuctions.length} / {auctions.length} Auctions Shown
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <p className="text-xs font-semibold">Calculating live profits from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[950px]">
              <thead className="bg-slate-950 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Auction Details</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-300 whitespace-nowrap" onClick={() => toggleSort('status')}>
                    Status <SortIcon k="status" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-300 text-right whitespace-nowrap" onClick={() => toggleSort('retail_value')}>
                    Retail Value <SortIcon k="retail_value" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-300 text-right whitespace-nowrap" onClick={() => toggleSort('total_bids')}>
                    Total Bids <SortIcon k="total_bids" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-300 text-right whitespace-nowrap" onClick={() => toggleSort('total_bid_per_cost_revenue')}>
                    Bid Fee Revenue <SortIcon k="total_bid_per_cost_revenue" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-300 text-right whitespace-nowrap" onClick={() => toggleSort('total_bid_amount')}>
                    Bid Amount <SortIcon k="total_bid_amount" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-300 text-right whitespace-nowrap" onClick={() => toggleSort('admin_gain')}>
                    Admin Gain <SortIcon k="admin_gain" />
                  </th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Winner</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAuctions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-500 text-sm">
                      No auctions match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAuctions.map(row => {
                    const isSelected = selectedAuction?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedAuction(isSelected ? null : row)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-950/40 border-l-4 border-purple-500'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Auction */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={row.image}
                              alt={row.title}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <div>
                              <p className="font-bold text-white text-xs leading-tight max-w-[200px] truncate">{row.title}</p>
                              <p className="text-[10px] text-purple-300 font-semibold mt-0.5">{row.category}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Bid fee: {row.bid_per_cost} ETB &bull; {row.total_participants} participants
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
                          <span className="font-mono text-blue-300 font-bold">{fmt(row.retail_value)}</span>
                          <span className="text-slate-500 ml-1 text-[10px]">ETB</span>
                        </td>

                        {/* Total Bids */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-amber-300 font-bold">{row.total_bids.toLocaleString()}</span>
                          <span className="text-slate-500 ml-1 text-[10px]">bids</span>
                        </td>

                        {/* Bid Fee Revenue */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-purple-300 font-bold">{fmt(row.total_bid_per_cost_revenue)}</span>
                          <span className="text-slate-500 ml-1 text-[10px]">ETB</span>
                        </td>

                        {/* Total Bid Amount */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-slate-300 font-bold">{fmt(row.total_bid_amount)}</span>
                          <span className="text-slate-500 ml-1 text-[10px]">ETB</span>
                        </td>

                        {/* Admin Gain */}
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono font-black text-sm ${row.admin_gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {row.admin_gain >= 0 ? '+' : ''}{fmt(row.admin_gain)}
                          </span>
                          <span className="text-slate-500 ml-1 text-[10px]">ETB</span>
                          <div className="text-[9px] text-slate-600 mt-0.5 font-mono">
                            fee rev &minus; retail
                          </div>
                        </td>

                        {/* Winner */}
                        <td className="px-4 py-3 text-center">
                          {row.winner_name ? (
                            <div>
                              <div className="flex items-center justify-center gap-1 text-amber-300 font-bold text-[11px]">
                                <Trophy className="w-3 h-3" /> {row.winner_name}
                              </div>
                              {row.lowest_unique_bid != null && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Bid: {row.lowest_unique_bid} ETB
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[10px] italic">—</span>
                          )}
                        </td>

                        {/* Focus Button */}
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAuction(isSelected ? null : row);
                            }}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-purple-300'
                            }`}
                            title={isSelected ? 'Clear Top Focus' : 'Focus on Top'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table footer totals */}
              {filteredAuctions.length > 0 && (
                <tfoot className="bg-slate-950/90 border-t border-slate-700">
                  <tr>
                    <td className="px-4 py-3 font-black text-slate-300 text-xs" colSpan={2}>
                      TOTALS ({filteredAuctions.length} visible)
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-blue-300">
                      {fmt(filteredAuctions.reduce((s, r) => s + r.retail_value, 0))} ETB
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-amber-300">
                      {filteredAuctions.reduce((s, r) => s + r.total_bids, 0).toLocaleString()} bids
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-purple-300">
                      {fmt(filteredAuctions.reduce((s, r) => s + r.total_bid_per_cost_revenue, 0))} ETB
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-slate-300">
                      {fmt(filteredAuctions.reduce((s, r) => s + r.total_bid_amount, 0))} ETB
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(() => {
                        const total = filteredAuctions.reduce((s, r) => s + r.admin_gain, 0);
                        return (
                          <span className={`font-mono font-black text-sm ${total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {total >= 0 ? '+' : ''}{fmt(total)} ETB
                          </span>
                        );
                      })()}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
