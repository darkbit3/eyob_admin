import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bid, Product } from '../data/mockData';
import { Trophy, Lock, ShieldCheck, Phone, DollarSign } from 'lucide-react';
import { bidsApi } from '../utils/api';

export default function AdminWinners() {
  const { auctions, bids, users, products, setBids } = useApp();

  // Product selection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!selectedProduct) return;

    const auctionIds = auctions
      .filter(auction => auction.productId === selectedProduct.id)
      .map(auction => auction.id);

    if (!auctionIds.length) return;

    let cancelled = false;

    Promise.all(
      auctionIds.map(async auctionId => {
        try {
          const res = await bidsApi.forAuction(auctionId);
          return (res.data || []).map((bid: any) => ({
            id: bid.id,
            auctionId: bid.auction_id ?? bid.auctionId ?? auctionId,
            bidderId: bid.bidder_id ?? bid.bidderId ?? '',
            maskedBidderId: bid.masked_bidder_id ?? bid.maskedBidderId ?? '',
            amount: Number(bid.amount ?? 0),
            timestamp: bid.created_at ?? bid.timestamp ?? new Date().toISOString(),
            isDuplicate: Boolean(bid.is_duplicate ?? bid.isDuplicate ?? false),
            isLowestUnique: Boolean(bid.is_lowest_unique ?? bid.isLowestUnique ?? false),
          } as Bid));
        } catch {
          return [] as Bid[];
        }
      })
    )
      .then(results => {
        if (cancelled) return;
        const merged = results.flat();
        const deduped = new Map<string, Bid>();
        for (const bid of merged) deduped.set(bid.id, bid);
        setBids(prev => {
          const others = prev.filter(item => !auctionIds.includes(item.auctionId));
          const existing = new Map<string, Bid>();
          for (const item of others) existing.set(item.id, item);
          for (const item of deduped.values()) existing.set(item.id, item);
          return Array.from(existing.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedProduct, auctions, setBids]);

  // Filters
  const [bidFilter, setBidFilter] = useState<'all' | 'unique' | 'duplicate'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'ended'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'open' | 'coming-soon' | 'ended' | 'paused'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<'all' | string>('all');

  const productCategories = useMemo(
    () => Array.from(new Set(products.map(p => p.category))).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const auctionsForProduct = auctions.filter(a => a.productId === product.id);
      const statusPriority = auctionsForProduct.some(a => a.status === 'active')
        ? 'open'
        : auctionsForProduct.some(a => a.status === 'upcoming')
          ? 'coming-soon'
          : auctionsForProduct.some(a => a.status === 'closed')
            ? 'ended'
            : auctionsForProduct.some(a => a.status === 'paused')
              ? 'paused'
              : 'all';

      const matchesStatus = productStatusFilter === 'all' || statusPriority === productStatusFilter;
      const matchesCategory = productCategoryFilter === 'all' || product.category === productCategoryFilter;
      return matchesStatus && matchesCategory;
    });
  }, [products, auctions, productStatusFilter, productCategoryFilter]);

  // Get auctions for selected product
  const productAuctions = selectedProduct
    ? auctions.filter(a => a.productId === selectedProduct.id)
    : [];

  // Get all bids for product auctions
  const productBids = productAuctions.length > 0
    ? bids.filter(b => productAuctions.some(a => a.id === b.auctionId))
    : [];

  // Apply filters
  const filteredBids = useMemo(() => {
    return productBids.filter(bid => {
      // Bid type filter
      if (bidFilter === 'unique' && bid.isDuplicate) return false;
      if (bidFilter === 'duplicate' && !bid.isDuplicate) return false;

      // Status filter
      if (statusFilter !== 'all') {
        const auction = productAuctions.find(a => a.id === bid.auctionId);
        if (statusFilter === 'open' && auction?.status !== 'active') return false;
        if (statusFilter === 'ended' && auction?.status !== 'closed') return false;
      }

      // Date filter
      if (dateFilter) {
        const bidDate = new Date(bid.timestamp).toLocaleDateString();
        const filterDate = new Date(dateFilter).toLocaleDateString();
        if (bidDate !== filterDate) return false;
      }

      return true;
    });
  }, [productBids, bidFilter, statusFilter, dateFilter, productAuctions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-purple-950 border border-emerald-800/40 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-black text-white tracking-tight">Winner Verification & Oversight</h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Algorithmic Engine
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              Read-only transparent bid log verification. Winners are automatically selected by the lowest non-duplicate bid logic.
            </p>
          </div>

          <div className="px-4 py-2 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-amber-400 font-bold text-xs uppercase tracking-wider">Zero Manual Overrides</p>
              <p className="text-[10px] text-slate-400">Cryptographically immutable winner state</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Products List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Products ({filteredProducts.length})</h2>
          </div>

          <div className="space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</label>
            <select
              value={productStatusFilter}
              onChange={e => setProductStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="coming-soon">Coming Soon</option>
              <option value="ended">Ended</option>
              <option value="paused">Paused</option>
            </select>
            <select
              value={productCategoryFilter}
              onChange={e => setProductCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Categories</option>
              {productCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto">
            {filteredProducts.map(p => {
              const productAuctionsForThisProduct = auctions.filter(a => a.productId === p.id);
              const productAuctionCount = productAuctionsForThisProduct.length;
              const newestAuction = productAuctionsForThisProduct.sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0];
              const displayTime = newestAuction ? new Date(newestAuction.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'No auction';
              const isSelected = selectedProduct?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-950/50 border-purple-500/80 shadow-lg shadow-purple-950/50 ring-1 ring-purple-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="absolute top-2 right-2 text-[9px] font-semibold text-slate-300 bg-slate-950/80 border border-slate-700 rounded px-1.5 py-0.5">
                    {displayTime}
                  </div>
                  <div className="flex items-center gap-3 pr-20">
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop'} alt={p.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.category}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30">
                          {productAuctionCount} Auction{productAuctionCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="p-6 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                No products match the current filter.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Bids Details & Filters */}
        {selectedProduct ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Product Header */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Selected Product</span>
                <h3 className="text-lg font-black text-white mt-0.5">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Category: {selectedProduct.category} • Retail: {selectedProduct.retailValue?.toLocaleString()} ETB</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bid Filters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Bid Type</label>
                  <select
                    value={bidFilter}
                    onChange={e => setBidFilter(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none mt-1"
                  >
                    <option value="all">All Bids</option>
                    <option value="unique">Unique Bids</option>
                    <option value="duplicate">Duplicate Bids</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Auction Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none mt-1"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open Auctions</option>
                    <option value="ended">Ended Auctions</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Filter by Date</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Bids Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Bids Log ({filteredBids.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Phone numbers and amounts for all bids on this product</p>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Bidder</th>
                      <th className="p-3 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</th>
                      <th className="p-3 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Amount</th>
                      <th className="p-3">Bid Status</th>
                      <th className="p-3">Auction Status</th>
                      <th className="p-3 text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredBids.length > 0 ? (
                      filteredBids.map((b, idx) => {
                        const bidder = users.find(u => u.id === b.bidderId);
                        const auction = productAuctions.find(a => a.id === b.auctionId);
                        return (
                          <tr
                            key={b.id}
                            className={`transition-colors ${
                              b.isLowestUnique
                                ? 'bg-emerald-950/40 font-bold border-l-4 border-l-emerald-500'
                                : b.isDuplicate
                                ? 'hover:bg-slate-800/30 opacity-75'
                                : 'hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="p-3">
                              {b.isLowestUnique ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> #1
                                </span>
                              ) : (
                                <span className="text-slate-500 font-mono">#{idx + 1}</span>
                              )}
                            </td>
                            <td className="p-3 text-white font-semibold text-sm truncate">
                              {bidder?.name || 'Unknown'}
                            </td>
                            <td className="p-3 font-mono text-slate-300">
                              {bidder?.phone || '—'}
                            </td>
                            <td className="p-3 font-mono text-base font-bold text-emerald-400">
                              {b.amount} ETB
                            </td>
                            <td className="p-3">
                              {b.isLowestUnique ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Lowest Unique
                                </span>
                              ) : b.isDuplicate ? (
                                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px]">
                                  Duplicate
                                </span>
                              ) : (
                                <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded text-[10px]">
                                  Unique
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                auction?.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-700/30 text-slate-300 border-slate-600/30'
                              }`}>
                                {auction?.status === 'active' ? 'Open' : 'Ended'}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-[11px] text-slate-400">
                              {new Date(b.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No bids found with the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            Select a product on the left to view its bids and details.
          </div>
        )}
      </div>
    </div>
  );
}
