import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Auction, AuctionStatus, Product } from '../data/mockData';
import { bidsApi, auctionsApi } from '../utils/api';
import ImageUploader from '../components/ImageUploader';
import { useLocation } from 'react-router-dom';
import {
  Gavel, Search, Plus, Edit2, PauseCircle, PlayCircle, XCircle, ShieldAlert,
  ChevronDown, ChevronUp, Users, Trophy, CheckCircle, Loader2, RefreshCw, Package, CheckSquare, Square
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BidRow {
  id: string;
  bidderId: string;
  maskedBidderId: string;
  bidderName: string;
  bidderPhone: string;
  bidderPhoto: string | null;
  amount: number;
  timestamp: string;
  isDuplicate: boolean;
  isLowestUnique: boolean;
}

// Helper: Get current datetime string in East Africa / Ethiopia Time (UTC+3) formatted for datetime-local
function getEatNowString(offsetMinutes = 0): string {
  const now = new Date(Date.now() + offsetMinutes * 60 * 1000);
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const eatDate = new Date(utc + 3 * 3600000);
  const year = eatDate.getFullYear();
  const month = String(eatDate.getMonth() + 1).padStart(2, '0');
  const day = String(eatDate.getDate()).padStart(2, '0');
  const hours = String(eatDate.getHours()).padStart(2, '0');
  const minutes = String(eatDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AdminAuctions() {
  const { auctions, products, createAuction, updateAuction, pauseAuction, resumeAuction, cancelAuction, setAuctions } = useApp();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [productId, setProductId] = useState<string>('');

  const [showDrawer, setShowDrawer] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);

  // ── Multi-select state ───────────────────────────────────────────────────
  const [selectedAuctionIds, setSelectedAuctionIds] = useState<string[]>([]);

  // ── Feedback Overlay State ───────────────────────────────────────────────
  const [actionState, setActionState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [actionMsg, setActionMsg] = useState('');

  // ── Expanded bid rows ─────────────────────────────────────────────────────
  const [expandedAuctionId, setExpandedAuctionId] = useState<string | null>(null);
  const [bidData, setBidData] = useState<BidRow[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  function fetchBids(auctionId: string, showSpinner = true) {
    if (showSpinner) setBidsLoading(true);
    bidsApi.forAuction(auctionId)
      .then(res => {
        setBidData((res.data || []).map((b: any) => ({
          id: b.id,
          bidderId: b.bidder_id ?? b.bidderId ?? '',
          maskedBidderId: b.masked_bidder_id ?? b.maskedBidderId ?? `#${String(b.bidder_id ?? '').slice(-4)}`,
          bidderName: b.bidder_name ?? b.bidderName ?? '',
          bidderPhone: b.bidder_phone ?? b.bidderPhone ?? '',
          bidderPhoto: b.bidder_photo ?? b.bidderPhoto ?? null,
          amount: Number(b.amount ?? 0),
          timestamp: b.created_at ?? b.timestamp ?? '',
          isDuplicate: Boolean(b.is_duplicate ?? false),
          isLowestUnique: Boolean(b.is_lowest_unique ?? false),
        })));
      })
      .catch(() => setBidData([]))
      .finally(() => setBidsLoading(false));
  }

  // ── Manual refresh ────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await auctionsApi.list();
      setAuctions(res.data.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description ?? '',
        image: a.image_url ?? a.image ?? '',
        retailValue: Number(a.retail_value ?? a.retailValue ?? 0),
        bidPerCost: Number(a.bid_per_cost ?? a.bidPerCost ?? 100),
        category: a.category,
        status: a.status,
        startTime: a.start_time ?? a.startTime ?? '',
        endTime: a.end_time ?? a.endTime ?? '',
        minBid: Number(a.min_bid ?? a.minBid ?? 1),
        maxBid: Number(a.max_bid ?? a.maxBid ?? 500),
        totalParticipants: Number(a.total_participants ?? a.totalParticipants ?? 0),
        totalBids: Number(a.total_bids ?? a.totalBids ?? 0),
        productId: a.product_id ?? a.productId ?? undefined,
      })));
      setLastRefreshed(new Date());
      if (expandedAuctionId) fetchBids(expandedAuctionId, false);
    } catch (e) {}
    finally { setRefreshing(false); }
  }, [expandedAuctionId]);

  // Live-poll bids every 15s while a panel is open
  useEffect(() => {
    if (!expandedAuctionId) return;
    const id = window.setInterval(() => fetchBids(expandedAuctionId, false), 15000);
    return () => window.clearInterval(id);
  }, [expandedAuctionId]);

  function toggleBidders(auctionId: string) {
    if (expandedAuctionId === auctionId) {
      setExpandedAuctionId(null);
      setBidData([]);
      return;
    }
    setExpandedAuctionId(auctionId);
    setBidData([]);
    fetchBids(auctionId, true);
  }

  // ── Form state ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [retailValue, setRetailValue] = useState(50000);
  const [bidPerCost, setBidPerCost] = useState(100);
  const [minBid, setMinBid] = useState(1);
  const [maxBid, setMaxBid] = useState(500);
  const [startTime, setStartTime] = useState(getEatNowString());
  const [endTime, setEndTime] = useState(getEatNowString(7 * 24 * 60));
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=400&fit=crop');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmActionModal, setConfirmActionModal] = useState<{
    type: 'pause' | 'resume' | 'cancel';
    auction: Auction;
  } | null>(null);

  // ── Pre-fill from Products page navigation ────────────────────────────────
  useEffect(() => {
    const state = location.state as { prefillProduct?: Product } | null;
    if (state?.prefillProduct) {
      const p = state.prefillProduct;
      setEditingAuction(null);
      setTitle(p.name);
      setDescription(p.description ?? '');
      setCategory(p.category);
      setRetailValue(p.retailValue);
      setBidPerCost(100);
      setMinBid(1);
      setMaxBid(500);
      setImageUrl((p.images && p.images[0]) ?? '');
      setProductId(p.id);
      setSelectedProduct(p);
      setStartTime(getEatNowString());
      setEndTime(getEatNowString(7 * 24 * 60));
      setShowDrawer(true);
      // Clear the state so refreshing doesn't re-open
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  function resetForm() {
    setEditingAuction(null);
    setTitle('');
    setDescription('');
    setCategory('Electronics');
    setRetailValue(50000);
    setBidPerCost(100);
    setMinBid(1);
    setMaxBid(500);
    setStartTime('2026-08-10T08:00');
    setEndTime('2026-08-20T20:00');
    setImageUrl('https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=400&fit=crop');
    setProductId('');
    setSelectedProduct(null);
  }

  function handleOpenCreate() {
    resetForm();
    setShowDrawer(true);
  }

  function handleOpenEdit(a: Auction) {
    setEditingAuction(a);
    setTitle(a.title);
    setDescription(a.description);
    setCategory(a.category);
    setRetailValue(a.retailValue);
    setBidPerCost(a.bidPerCost || 100);
    setMinBid(a.minBid);
    setMaxBid(a.maxBid);
    setStartTime(a.startTime.substring(0, 16));
    setEndTime(a.endTime.substring(0, 16));
    setImageUrl(a.image);
    setProductId(a.productId ?? '');
    setSelectedProduct(products.find(p => p.id === a.productId) ?? null);
    setShowDrawer(true);
  }

  async function handleSave(asDraft = false) {
    if (!title.trim()) return;

    const eatNow = getEatNowString();
    // Validate that starting time cannot go back from now (allow editing existing past auctions if already active)
    if (!editingAuction && startTime < eatNow) {
      setActionState('error');
      setActionMsg('Start date & time cannot be in the past. Please select the current or future time (EAT UTC+3).');
      setTimeout(() => setActionState('idle'), 4000);
      return;
    }

    if (endTime <= startTime) {
      setActionState('error');
      setActionMsg('End date & time must be strictly after the start date & time.');
      setTimeout(() => setActionState('idle'), 4000);
      return;
    }

    setActionState('loading');
    setActionMsg(
      editingAuction
        ? 'Updating auction parameters...'
        : asDraft
        ? 'Saving auction as draft...'
        : 'Publishing auction live...'
    );

    const payload = {
      product_id: productId || null,
      title,
      description,
      category,
      retail_value: retailValue,
      bid_per_cost: bidPerCost,
      min_bid: minBid,
      max_bid: maxBid,
      start_time: startTime,
      end_time: endTime,
      image_url: imageUrl,
      status: asDraft ? ('draft' as AuctionStatus) : ('active' as AuctionStatus),
    };

    try {
      if (editingAuction) {
        await updateAuction(editingAuction.id, {
          title,
          description,
          category,
          image: imageUrl,
          retailValue,
          bidPerCost,
          minBid,
          maxBid,
          startTime,
          endTime,
          status: payload.status as AuctionStatus,
          productId: productId || undefined,
        });
      } else {
        await createAuction({
          productId: productId || undefined,
          title,
          description,
          category,
          image: imageUrl,
          retailValue,
          bidPerCost,
          minBid,
          maxBid,
          startTime,
          endTime,
          status: payload.status as AuctionStatus,
        });
      }

      setActionState('success');
      setActionMsg(
        editingAuction
          ? 'Auction updated successfully!'
          : asDraft
          ? 'Auction saved as draft!'
          : 'Auction published live successfully!'
      );
      setTimeout(() => {
        setActionState('idle');
        setShowDrawer(false);
      }, 1400);
    } catch (err: any) {
      setActionState('error');
      setActionMsg(err?.message || 'Failed to save auction.');
      setTimeout(() => setActionState('idle'), 2500);
    }
  }

  async function executeConfirmedAction() {
    if (!confirmActionModal) return;
    const { type, auction } = confirmActionModal;

    setActionState('loading');
    setActionMsg(`Processing ${type} action on "${auction.title}"...`);
    setConfirmActionModal(null);

    try {
      if (type === 'pause') await pauseAuction(auction.id);
      if (type === 'resume') await resumeAuction(auction.id);
      if (type === 'cancel') await cancelAuction(auction.id);

      setActionState('success');
      setActionMsg(`Auction ${type}d successfully!`);
    } catch (error: any) {
      setActionState('error');
      setActionMsg(error?.message || `Failed to ${type} auction.`);
    } finally {
      setTimeout(() => setActionState('idle'), 1800);
    }
  }

  const filtered = auctions.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesCat = categoryFilter === 'all' || a.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const categories = Array.from(new Set(auctions.map(a => a.category)));
  const productOptions = [{ id: '', name: 'None (standalone auction)' }, ...products.map(p => ({ id: p.id, name: p.name }))];

  // ── Multi-select Helpers & Batch Actions ───────────────────────────────────
  const allFilteredSelected = filtered.length > 0 && filtered.every(a => selectedAuctionIds.includes(a.id));

  function handleSelectAll() {
    if (allFilteredSelected) {
      setSelectedAuctionIds(prev => prev.filter(id => !filtered.some(a => a.id === id)));
    } else {
      const newIds = Array.from(new Set([...selectedAuctionIds, ...filtered.map(a => a.id)]));
      setSelectedAuctionIds(newIds);
    }
  }

  function toggleSelectAuction(id: string) {
    setSelectedAuctionIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  async function handleBatchPublishSelected() {
    if (selectedAuctionIds.length === 0) return;
    setActionState('loading');
    setActionMsg(`Publishing ${selectedAuctionIds.length} selected auction(s)...`);

    try {
      for (const id of selectedAuctionIds) {
        await updateAuction(id, { status: 'active' });
      }
      setActionState('success');
      setActionMsg(`Successfully published ${selectedAuctionIds.length} selected auction(s)!`);
      setSelectedAuctionIds([]);
    } catch (err: any) {
      setActionState('error');
      setActionMsg(err?.message || 'Failed to publish selected auctions.');
    } finally {
      setTimeout(() => setActionState('idle'), 2000);
    }
  }

  async function handleBatchPauseSelected() {
    if (selectedAuctionIds.length === 0) return;
    setActionState('loading');
    setActionMsg(`Pausing ${selectedAuctionIds.length} selected auction(s)...`);

    try {
      for (const id of selectedAuctionIds) {
        await pauseAuction(id);
      }
      setActionState('success');
      setActionMsg(`Successfully paused ${selectedAuctionIds.length} selected auction(s)!`);
      setSelectedAuctionIds([]);
    } catch (err: any) {
      setActionState('error');
      setActionMsg(err?.message || 'Failed to pause selected auctions.');
    } finally {
      setTimeout(() => setActionState('idle'), 2000);
    }
  }

  async function handleBatchResumeSelected() {
    if (selectedAuctionIds.length === 0) return;
    setActionState('loading');
    setActionMsg(`Resuming ${selectedAuctionIds.length} selected auction(s)...`);

    try {
      for (const id of selectedAuctionIds) {
        await resumeAuction(id);
      }
      setActionState('success');
      setActionMsg(`Successfully resumed ${selectedAuctionIds.length} selected auction(s)!`);
      setSelectedAuctionIds([]);
    } catch (err: any) {
      setActionState('error');
      setActionMsg(err?.message || 'Failed to resume selected auctions.');
    } finally {
      setTimeout(() => setActionState('idle'), 2000);
    }
  }

  async function handleBatchCancelSelected() {
    if (selectedAuctionIds.length === 0) return;
    setActionState('loading');
    setActionMsg(`Cancelling ${selectedAuctionIds.length} selected auction(s)...`);

    try {
      for (const id of selectedAuctionIds) {
        await cancelAuction(id);
      }
      setActionState('success');
      setActionMsg(`Successfully cancelled ${selectedAuctionIds.length} selected auction(s)!`);
      setSelectedAuctionIds([]);
    } catch (err: any) {
      setActionState('error');
      setActionMsg(err?.message || 'Failed to cancel selected auctions.');
    } finally {
      setTimeout(() => setActionState('idle'), 2000);
    }
  }

  const statusBadge = (s: AuctionStatus) => {
    switch (s) {
      case 'active':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-semibold">Active</span>;
      case 'paused':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs font-semibold">Paused</span>;
      case 'upcoming':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md text-xs font-semibold">Upcoming</span>;
      case 'closed':
        return <span className="bg-slate-700/50 text-slate-300 border border-slate-600/40 px-2.5 py-1 rounded-md text-xs font-semibold">Closed</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md text-xs">Draft</span>;
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Status Feedback Overlay (Spinner, Right Tick Sign, X Cross Sign & Message Display) ── */}
      {actionState !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-md transition-all">
          <div className="flex flex-col items-center justify-center gap-4 bg-slate-900 border border-slate-700/80 rounded-3xl p-8 shadow-2xl min-w-[280px] max-w-sm text-center">
            {/* Loading Spinner */}
            {actionState === 'loading' && (
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-14 h-14 text-purple-400 animate-spin" />
              </div>
            )}
            {/* Right Sign (Success Tick) */}
            {actionState === 'success' && (
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/50 animate-bounce">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
            )}
            {/* X Sign (Error Cross) */}
            {actionState === 'error' && (
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-950/50">
                <XCircle className="w-10 h-10 text-rose-400" />
              </div>
            )}
            {/* Message display under the sign */}
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white uppercase tracking-wider">
                {actionState === 'loading' ? 'Processing Action' : actionState === 'success' ? 'Success' : 'Error Occurred'}
              </h4>
              <p className="text-xs font-semibold text-slate-300 max-w-[240px] leading-relaxed">
                {actionMsg}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Gavel className="w-5 h-5 text-purple-400" /> Auction Management
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Configure bid ranges, schedules, and live execution parameters for platform auctions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Last refreshed + manual refresh */}
          <span className="text-slate-500 text-[10px] font-mono hidden sm:block">
            Updated {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={manualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all disabled:opacity-50"
            title="Refresh auction data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Auction
          </button>
        </div>
      </div>

      {/* Sticky Multi-select Action Bar */}
      {selectedAuctionIds.length > 0 && (
        <div className="p-4 bg-purple-950/60 border border-purple-500/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <span>{selectedAuctionIds.length} Auction(s) Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleBatchPublishSelected}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Publish Selected ({selectedAuctionIds.length})
            </button>
            <button
              onClick={handleBatchPauseSelected}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              Pause Selected ({selectedAuctionIds.length})
            </button>
            <button
              onClick={handleBatchResumeSelected}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Resume Selected ({selectedAuctionIds.length})
            </button>
            <button
              onClick={handleBatchCancelSelected}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Selected ({selectedAuctionIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Auctions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-white transition-colors">
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </th>
                <th className="p-4">Auction Item</th>
                <th className="p-4">Status</th>
                <th className="p-4">Retail Value</th>
                <th className="p-4">Bid Range</th>
                <th className="p-4">Bids / Users</th>
                <th className="p-4">Schedule</th>
                <th className="p-4 text-right">Common Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(a => {
                const isSelected = selectedAuctionIds.includes(a.id);
                const isExpanded = expandedAuctionId === a.id;

                // Compute stats from fetched bid data when expanded
                const amountCounts: Record<number, number> = {};
                if (isExpanded) {
                  bidData.forEach(b => { amountCounts[b.amount] = (amountCounts[b.amount] || 0) + 1; });
                }
                const uniqueAmounts = Object.keys(amountCounts).map(Number).filter(amt => amountCounts[amt] === 1).sort((a, b) => a - b);
                const lowestUnique = uniqueAmounts[0] ?? null;
                const winningBid = lowestUnique !== null ? bidData.find(b => b.amount === lowestUnique) : null;
                const participantCount = new Set(bidData.map(b => b.bidderId)).size;

                return (
                  <>
                    {/* ── Main row ─────────────────────────────────────────── */}
                    <tr
                      key={a.id}
                      onClick={() => toggleBidders(a.id)}
                      className={`transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'bg-purple-950/40 border-l-2 border-l-purple-500'
                          : isExpanded
                          ? 'bg-slate-800/60 border-l-2 border-l-purple-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleSelectAuction(a.id)} className="text-slate-400 hover:text-purple-400">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={a.image} alt={a.title} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                          <div>
                            <p className="font-bold text-white text-xs">{a.title}</p>
                            <p className="text-[10px] text-purple-400 font-mono">{a.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{statusBadge(a.status)}</td>
                      <td className="p-4 font-mono font-semibold text-slate-200">
                        {a.retailValue.toLocaleString()} ETB
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {a.minBid} – {a.maxBid} ETB
                      </td>
                      <td className="p-4">
                        <div className="text-slate-200 font-bold">{a.totalBids} bids</div>
                        <div className="text-[10px] text-slate-500">{a.totalParticipants} bidders</div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        <div>Start: {new Date(a.startTime).toLocaleDateString()}</div>
                        <div>End: {new Date(a.endTime).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle indicator */}
                          <span className="text-slate-500 mr-1">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-purple-400" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </span>

                          <button
                            onClick={e => { e.stopPropagation(); handleOpenEdit(a); }}
                            className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-md transition-colors"
                            title="Edit Auction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={e => { e.stopPropagation(); a.status === 'active' && setConfirmActionModal({ type: 'pause', auction: a }); }}
                            disabled={a.status !== 'active'}
                            className={`p-1.5 rounded-md transition-colors ${a.status === 'active' ? 'text-amber-400 hover:bg-amber-950/40' : 'text-slate-600 bg-slate-900/60 cursor-not-allowed'}`}
                            title={a.status === 'active' ? 'Pause Auction' : 'Pause unavailable'}
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={e => { e.stopPropagation(); a.status === 'paused' && setConfirmActionModal({ type: 'resume', auction: a }); }}
                            disabled={a.status !== 'paused'}
                            className={`p-1.5 rounded-md transition-colors ${a.status === 'paused' ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-slate-600 bg-slate-900/60 cursor-not-allowed'}`}
                            title={a.status === 'paused' ? 'Resume Auction' : 'Resume unavailable'}
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={e => { e.stopPropagation(); a.status !== 'closed' && setConfirmActionModal({ type: 'cancel', auction: a }); }}
                            disabled={a.status === 'closed'}
                            className={`p-1.5 rounded-md transition-colors ${a.status !== 'closed' ? 'text-rose-400 hover:bg-rose-950/40' : 'text-slate-600 bg-slate-900/60 cursor-not-allowed'}`}
                            title={a.status !== 'closed' ? 'Cancel Auction' : 'Already closed'}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded bidders panel ────────────────────────────── */}
                    {isExpanded && (
                      <tr key={`${a.id}-bids`} className="bg-slate-950/60">
                        <td colSpan={8} className="px-6 pb-6 pt-2">
                          {/* Summary stats */}
                          <div className="flex items-center gap-6 mb-4 text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-purple-400" />
                              {bidsLoading ? '…' : participantCount} Participants
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Gavel className="w-3.5 h-3.5 text-blue-400" />
                              {bidsLoading ? '…' : bidData.length} Total Bids
                            </span>
                            <span className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              {bidsLoading ? '…' : uniqueAmounts.length} Unique Bids
                            </span>
                            {lowestUnique !== null && (
                              <span className="flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                Lowest Unique: <span className="text-amber-300 font-bold ml-1">{lowestUnique.toFixed(1)} ETB</span>
                              </span>
                            )}
                          </div>

                          {bidsLoading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                              <Loader2 className="w-4 h-4 animate-spin" /> Loading bids…
                            </div>
                          ) : bidData.length === 0 ? (
                            <p className="text-slate-500 text-xs py-4">No bids placed on this auction yet.</p>
                          ) : (
                            <div className="rounded-xl border border-slate-800 overflow-hidden">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                                  <tr>
                                    <th className="px-4 py-2.5">#</th>
                                    <th className="px-4 py-2.5">Bidder</th>
                                    <th className="px-4 py-2.5">Phone</th>
                                    <th className="px-4 py-2.5">Bid Amount</th>
                                    <th className="px-4 py-2.5">Time</th>
                                    <th className="px-4 py-2.5">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                  {bidData.map((b, idx) => {
                                    const count = amountCounts[b.amount] || 1;
                                    const isDup = count > 1;
                                    const isWinner = winningBid?.id === b.id;
                                    const avatarSeed = b.bidderName || b.maskedBidderId;
                                    return (
                                      <tr
                                        key={b.id}
                                        className={`text-slate-300 ${isWinner ? 'bg-emerald-900/30' : isDup ? 'bg-rose-900/20' : 'hover:bg-slate-800/30'}`}
                                      >
                                        <td className="px-4 py-2.5 text-slate-500 font-mono">{idx + 1}</td>
                                        <td className="px-4 py-2.5">
                                          <div className="flex items-center gap-2.5">
                                            <img
                                              src={b.bidderPhoto ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                                              alt={b.bidderName || 'Bidder'}
                                              className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0"
                                              onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`; }}
                                            />
                                            <div>
                                              <p className="font-semibold text-white text-xs leading-tight">
                                                {b.bidderName || '—'}
                                                {isWinner && <Trophy className="w-3 h-3 text-amber-400 inline ml-1" />}
                                              </p>
                                              <p className="text-[10px] text-purple-400 font-mono">
                                                {b.maskedBidderId || `Bidder #${b.bidderId.slice(-4)}`}
                                              </p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-slate-400 text-[11px]">
                                          {b.bidderPhone || '—'}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono font-bold">
                                          <span className={isDup ? 'line-through text-rose-400' : isWinner ? 'text-amber-300' : 'text-white'}>
                                            {b.amount.toFixed(1)} ETB
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                                          {b.timestamp ? new Date(b.timestamp).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-4 py-2.5">
                                          {isWinner ? (
                                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                              <Trophy className="w-3 h-3" /> WINNER
                                            </span>
                                          ) : isDup ? (
                                            <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                              <XCircle className="w-3 h-3" /> DUPLICATE ×{count}
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                              <CheckCircle className="w-3 h-3" /> UNIQUE
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT POPUP */}
      {showDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
          onClick={() => setShowDrawer(false)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-y-auto max-h-[90vh] p-6 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-purple-400" />
                  {editingAuction ? 'Edit Auction Parameters' : 'Create New Auction'}
                </h2>
                <button type="button" onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Auction Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Samsung Galaxy S25 Ultra"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Provide full specifications..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Linked Product</label>
                    <select
                      value={productId}
                      onChange={e => {
                        setProductId(e.target.value);
                        setSelectedProduct(products.find(p => p.id === e.target.value) ?? null);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                    >
                      {productOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Vehicles">Vehicles</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Home Appliances">Home Appliances</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Retail Value (ETB)</label>
                    <input
                      type="number"
                      value={retailValue}
                      onChange={e => setRetailValue(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Bid Per Cost (ETB)</label>
                    <input
                      type="number"
                      value={bidPerCost}
                      onChange={e => setBidPerCost(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Min Bid Allowed (ETB)</label>
                    <input
                      type="number"
                      value={minBid}
                      onChange={e => setMinBid(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Max Bid Ceiling (ETB)</label>
                    <input
                      type="number"
                      value={maxBid}
                      onChange={e => setMaxBid(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-semibold text-xs">Start Date & Time</label>
                      <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/20">
                        EAT (UTC+3)
                      </span>
                    </div>
                    <input
                      type="datetime-local"
                      value={startTime}
                      min={!editingAuction ? getEatNowString() : undefined}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-semibold text-xs">End Date & Time</label>
                      <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/20">
                        EAT (UTC+3)
                      </span>
                    </div>
                    <input
                      type="datetime-local"
                      value={endTime}
                      min={startTime || getEatNowString()}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <ImageUploader
                    value={imageUrl}
                    label="Auction Image (uploaded to Cloudinary)"
                    onUploaded={(url) => setImageUrl(url)}
                    onRemove={() => setImageUrl('')}
                  />
                  {selectedProduct && (
                    <div className="mt-3 p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center gap-3">
                      <img
                        src={(selectedProduct.images && selectedProduct.images[0]) ?? ''}
                        alt={selectedProduct.name}
                        className="w-14 h-14 object-cover rounded-lg border border-slate-700 flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Package className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Linked Product</span>
                        </div>
                        <p className="font-bold text-white text-xs truncate">{selectedProduct.name}</p>
                        <p className="text-[10px] text-slate-400">{selectedProduct.category} · {selectedProduct.retailValue.toLocaleString()} ETB retail</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedProduct(null); setProductId(''); }}
                        className="text-slate-500 hover:text-rose-400 text-lg leading-none flex-shrink-0"
                        title="Unlink product"
                      >✕</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inline drawer status display */}
            {actionState !== 'idle' && (
              <div className="mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold bg-slate-950/80 border-slate-800">
                {actionState === 'loading' && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
                {actionState === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {actionState === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
                <span className={actionState === 'error' ? 'text-rose-400' : actionState === 'success' ? 'text-emerald-400' : 'text-slate-300'}>
                  {actionMsg}
                </span>
              </div>
            )}

            <div className="border-t border-slate-800 pt-4 mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => handleSave(true)}
                disabled={actionState === 'loading'}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                {actionState === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save as Draft
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={actionState === 'loading'}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-purple-900/40 flex items-center gap-1.5"
              >
                {actionState === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Publish Auction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Confirm {confirmActionModal.type} Action
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Target: <span className="text-white font-semibold">{confirmActionModal.auction.title}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to {confirmActionModal.type} this auction? All active bidder updates will be synchronized instantly across the platform.
            </p>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => setConfirmActionModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg font-semibold shadow-lg shadow-amber-900/40"
              >
                Proceed & Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
