import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Auction, AuctionStatus, Product } from '../data/mockData';
import {
  Gavel, Search, Plus, Edit2, PauseCircle, PlayCircle, XCircle, ShieldAlert
} from 'lucide-react';

export default function AdminAuctions() {
  const { auctions, products, createAuction, updateAuction, pauseAuction, resumeAuction, cancelAuction } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [productId, setProductId] = useState<string>('');

  const [showDrawer, setShowDrawer] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [retailValue, setRetailValue] = useState(50000);
  const [minBid, setMinBid] = useState(1);
  const [maxBid, setMaxBid] = useState(500);
  const [startTime, setStartTime] = useState('2026-08-10T08:00');
  const [endTime, setEndTime] = useState('2026-08-20T20:00');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=400&fit=crop');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [confirmActionModal, setConfirmActionModal] = useState<{
    type: 'pause' | 'resume' | 'cancel';
    auction: Auction;
  } | null>(null);

  function resetForm() {
    setEditingAuction(null);
    setTitle('');
    setDescription('');
    setCategory('Electronics');
    setRetailValue(50000);
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

    const payload = {
      product_id: productId || null,
      title,
      description,
      category,
      retail_value: retailValue,
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
          minBid,
          maxBid,
          startTime,
          endTime,
          status: payload.status as AuctionStatus,
        });
      }
      setShowDrawer(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function executeConfirmedAction() {
    if (!confirmActionModal) return;
    const { type, auction } = confirmActionModal;
    try {
      if (type === 'pause') await pauseAuction(auction.id);
      if (type === 'resume') await resumeAuction(auction.id);
      if (type === 'cancel') await cancelAuction(auction.id);
    } catch (error) {
      console.error('Auction action failed', error);
    } finally {
      setConfirmActionModal(null);
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

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Auction
        </button>
      </div>

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
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
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
                      <button
                        onClick={() => handleOpenEdit(a)}
                        className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-md transition-colors"
                        title="Edit Auction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => a.status === 'active' && setConfirmActionModal({ type: 'pause', auction: a })}
                        disabled={a.status !== 'active'}
                        className={`p-1.5 rounded-md transition-colors ${a.status === 'active' ? 'text-amber-400 hover:bg-amber-950/40' : 'text-slate-600 bg-slate-900/60 cursor-not-allowed'}`}
                        title={a.status === 'active' ? 'Pause Auction' : 'Pause unavailable'}
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => a.status === 'paused' && setConfirmActionModal({ type: 'resume', auction: a })}
                        disabled={a.status !== 'paused'}
                        className={`p-1.5 rounded-md transition-colors ${a.status === 'paused' ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-slate-600 bg-slate-900/60 cursor-not-allowed'}`}
                        title={a.status === 'paused' ? 'Resume Auction' : 'Resume unavailable'}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => a.status !== 'closed' && setConfirmActionModal({ type: 'cancel', auction: a })}
                        disabled={a.status === 'closed'}
                        className={`p-1.5 rounded-md transition-colors ${a.status !== 'closed' ? 'text-rose-400 hover:bg-rose-950/40' : 'text-slate-600 bg-slate-900/60 cursor-not-allowed'}`}
                        title={a.status !== 'closed' ? 'Cancel Auction' : 'Already closed'}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                    <label className="block text-slate-300 font-semibold mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Image Thumbnail URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                  />
                  {imageUrl && (
                    <div className="mt-2 p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-3">
                      <img src={imageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-md" />
                      <span className="text-[10px] text-slate-400">Mock thumbnail preview</span>
                    </div>
                  )}
                  {selectedProduct && (
                    <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300">
                      <div className="font-semibold text-slate-100">Linked Product Preview</div>
                      <div className="mt-2 text-slate-400">{selectedProduct.name}</div>
                      <div className="text-slate-500 text-[10px]">{selectedProduct.category} • {selectedProduct.retailValue.toLocaleString()} ETB</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => handleSave(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSave(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-purple-900/40"
              >
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
