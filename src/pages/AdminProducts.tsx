import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../data/mockData';
import CountdownTimer from '../components/CountdownTimer';
import ImageUploader from '../components/ImageUploader';
import { Package, Search, Plus, Edit2, Trash2, Link2, CheckCircle, XCircle, Loader2, CheckSquare, Square, Gavel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROUTES } from '../utils/routes';

export default function AdminProducts() {
  const { auctions, products, addProduct, updateProduct, deleteProduct, createAuction } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showDrawer, setShowDrawer] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [viewIndex, setViewIndex] = useState(0);

  // ── Multi-select state ───────────────────────────────────────────────────
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // ── Save / Action status overlay state ───────────────────────────────────
  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [saveMsg, setSaveMsg] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [retailValue, setRetailValue] = useState(25000);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>(['']);

  function handleOpenCreate() {
    setEditingProduct(null);
    setName('');
    setCategory('Electronics');
    setRetailValue(25000);
    setDescription('');
    setImages(['']);
    setShowDrawer(true);
  }

  function handleOpenEdit(p: Product) {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setRetailValue(p.retailValue || 0);
    setDescription(p.description || '');
    setImages(p.images && p.images.length ? p.images : ['']);
    setShowDrawer(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      setSaveState('error');
      setSaveMsg('Product name is required.');
      setTimeout(() => setSaveState('idle'), 2000);
      return;
    }
    if (!Number.isFinite(Number(retailValue)) || Number(retailValue) <= 0) {
      setSaveState('error');
      setSaveMsg('Retail value must be a number greater than 0.');
      setTimeout(() => setSaveState('idle'), 2000);
      return;
    }
    const validImages = images.filter(img => img.trim() !== '');
    if (validImages.length === 0) {
      setSaveState('error');
      setSaveMsg('Please add at least one image URL.');
      setTimeout(() => setSaveState('idle'), 2000);
      return;
    }

    setSaveState('loading');
    setSaveMsg(editingProduct ? 'Updating product details...' : 'Creating new product...');

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name,
          category,
          retailValue: Number(retailValue),
          description,
          images: validImages,
        });
      } else {
        await addProduct({
          name,
          category,
          retailValue: Number(retailValue),
          description,
          images: validImages,
        });
      }
      setSaveState('success');
      setSaveMsg(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      setTimeout(() => {
        setSaveState('idle');
        setShowDrawer(false);
      }, 1400);
    } catch (err: any) {
      setSaveState('error');
      setSaveMsg(err?.message || 'Failed to save product.');
      setTimeout(() => setSaveState('idle'), 2500);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deletingProduct) return;
    setSaveState('loading');
    setSaveMsg(`Deleting product ${deletingProduct.name}...`);
    try {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      setSaveState('success');
      setSaveMsg('Product deleted successfully!');
    } catch (err: any) {
      setSaveState('error');
      setSaveMsg(err?.message || 'Failed to delete product.');
    } finally {
      setTimeout(() => setSaveState('idle'), 1500);
    }
  }

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Multi-select helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selectedProductIds.includes(p.id));
  
  function handleSelectAll() {
    if (allFilteredSelected) {
      setSelectedProductIds(prev => prev.filter(id => !filtered.some(p => p.id === id)));
    } else {
      const newIds = Array.from(new Set([...selectedProductIds, ...filtered.map(p => p.id)]));
      setSelectedProductIds(newIds);
    }
  }

  function toggleSelectProduct(id: string) {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  // ── Create Auctions for Selected Products ──────────────────────────────────
  async function handleCreateSelectedAuctions() {
    if (selectedProductIds.length === 0) return;
    const selectedProds = products.filter(p => selectedProductIds.includes(p.id));
    
    setSaveState('loading');
    setSaveMsg(`Creating auctions for ${selectedProds.length} selected product(s)...`);

    try {
      const now = new Date();
      const end = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const startIso = now.toISOString().substring(0, 16);
      const endIso = end.toISOString().substring(0, 16);

      for (const prod of selectedProds) {
        await createAuction({
          productId: prod.id,
          title: prod.name,
          description: prod.description || `Auction for ${prod.name}`,
          category: prod.category,
          image: (prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900&h=600&fit=crop',
          retailValue: prod.retailValue || 1000,
          bidPerCost: 100,
          minBid: 1,
          maxBid: 500,
          startTime: startIso,
          endTime: endIso,
          status: 'active',
        });
      }

      setSaveState('success');
      setSaveMsg(`Successfully created ${selectedProds.length} auction(s) for selected product(s)!`);
      setSelectedProductIds([]);
    } catch (err: any) {
      setSaveState('error');
      setSaveMsg(err?.message || 'Failed to create auctions for selected products.');
    } finally {
      setTimeout(() => setSaveState('idle'), 2000);
    }
  }

  // ── Batch Delete Selected Products ─────────────────────────────────────────
  async function handleDeleteSelectedProducts() {
    if (selectedProductIds.length === 0) return;
    setSaveState('loading');
    setSaveMsg(`Deleting ${selectedProductIds.length} selected product(s)...`);

    try {
      for (const id of selectedProductIds) {
        await deleteProduct(id);
      }
      setSaveState('success');
      setSaveMsg(`${selectedProductIds.length} Product(s) deleted successfully!`);
      setSelectedProductIds([]);
    } catch (err: any) {
      setSaveState('error');
      setSaveMsg(err?.message || 'Failed to delete selected products.');
    } finally {
      setTimeout(() => setSaveState('idle'), 2000);
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Status Feedback Overlay (Spinner, Right Tick Sign, X Cross Sign & Message Display) ── */}
      {saveState !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-md transition-all">
          <div className="flex flex-col items-center justify-center gap-4 bg-slate-900 border border-slate-700/80 rounded-3xl p-8 shadow-2xl min-w-[280px] max-w-sm text-center">
            {/* Loading Spinner */}
            {saveState === 'loading' && (
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-14 h-14 text-purple-400 animate-spin" />
              </div>
            )}
            {/* Right Sign (Success Tick) */}
            {saveState === 'success' && (
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/50 animate-bounce">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
            )}
            {/* X Sign (Error Cross) */}
            {saveState === 'error' && (
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-950/50">
                <XCircle className="w-10 h-10 text-rose-400" />
              </div>
            )}
            {/* Message display under the sign */}
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white uppercase tracking-wider">
                {saveState === 'loading' ? 'Processing Action' : saveState === 'success' ? 'Success' : 'Error Occurred'}
              </h4>
              <p className="text-xs font-semibold text-slate-300 max-w-[240px] leading-relaxed">
                {saveMsg}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" /> Product Inventory Catalog
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage standalone physical products, retail values, and linked auction status before publishing.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Product Entry
        </button>
      </div>

      {/* Batch Selection Action Bar */}
      {selectedProductIds.length > 0 && (
        <div className="p-4 bg-purple-950/60 border border-purple-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <span>{selectedProductIds.length} Product(s) Selected</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCreateSelectedAuctions}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <Gavel className="w-3.5 h-3.5" />
              Create Auctions for Selected ({selectedProductIds.length})
            </button>
            <button
              onClick={handleDeleteSelectedProducts}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedProductIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Master Table */}
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
                <th className="p-4">Product Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Retail Value</th>
                <th className="p-4">Linked Auction Status</th>
                <th className="p-4">Auction Countdown</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const isLinked = !!p.linkedAuctionId && !!p.linkedAuctionStatus;
                const auctionEndTime = p.linkedAuctionEndTime ?? auctions.find(a => a.id === p.linkedAuctionId)?.endTime;
                const auctionStatus = p.linkedAuctionStatus;
                const createdDate = p.createdAt
                  ? new Date(p.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
                  : '—';

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors cursor-pointer ${isSelected ? 'bg-purple-950/30' : 'hover:bg-slate-800/40'}`}
                    onClick={() => { setViewProduct(p); setViewIndex(0); }}
                  >
                    {/* Multi-select Checkbox */}
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleSelectProduct(p.id)} className="text-slate-400 hover:text-purple-400">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                    </td>

                    {/* Product Details */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={(p.images && p.images[0]) || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900&h=600&fit=crop'}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white text-xs">{p.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="bg-slate-800 text-purple-300 border border-slate-700 px-2.5 py-1 rounded-md text-xs font-medium">
                        {p.category}
                      </span>
                    </td>

                    {/* Retail Value */}
                    <td className="p-4 font-mono font-bold text-slate-200">
                      {(typeof p.retailValue === 'number' ? p.retailValue : 0).toLocaleString()} ETB
                    </td>

                    {/* Linked Auction Status */}
                    <td className="p-4">
                      {isLinked ? (
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                            auctionStatus === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : auctionStatus === 'paused'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : auctionStatus === 'closed'
                              ? 'bg-slate-700/50 text-slate-300 border-slate-600/40'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {auctionStatus?.toUpperCase()}
                        </span>
                      ) : (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigate(ADMIN_ROUTES.AUCTIONS, {
                              state: { prefillProduct: p }
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-md text-[11px] font-semibold transition-colors"
                          title="Go to Auctions to create an auction for this product"
                        >
                          <Link2 className="w-3 h-3" /> Create Auction
                        </button>
                      )}
                    </td>

                    {/* Auction Countdown */}
                    <td className="p-4">
                      {isLinked && auctionEndTime && auctionStatus ? (
                        <CountdownTimer endTime={auctionEndTime} status={auctionStatus} />
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="p-4 text-slate-400 font-mono text-[11px]">{createdDate}</td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-md transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingProduct(p); }}
                          className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT FORM MODAL */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setShowDrawer(false)}>
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-y-auto max-h-[90vh] p-6 flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-400" />
                  {editingProduct ? 'Edit Product Details' : 'Add Standalone Product'}
                </h2>
                <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Product Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. DJI Mavic 3 Drone Combo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
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
                    <label className="block text-slate-300 font-semibold mb-1">Retail Price (ETB)</label>
                    <input
                      type="number"
                      value={retailValue}
                      onChange={(e) => setRetailValue(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Product Specifications</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Technical specs, model year, condition..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Product Images <span className="text-slate-500 font-normal">(at least 1, max 8 — uploaded to cloud)</span>
                  </label>
                  <div className="space-y-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                        <div className="flex-1">
                          <ImageUploader
                            value={img}
                            label={`Image ${idx + 1}`}
                            onUploaded={(url) =>
                              setImages((prev) => prev.map((v, i) => (i === idx ? url : v)))
                            }
                            onRemove={() =>
                              setImages((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : [''])
                            }
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => images.length < 8 && setImages((prev) => [...prev, ''])}
                      disabled={images.length >= 8}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-40 text-xs transition-colors flex items-center gap-1.5"
                    >
                      + Add Another Image ({images.length}/8)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Inline drawer status display */}
            {saveState !== 'idle' && (
              <div className="mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold bg-slate-950/80 border-slate-800">
                {saveState === 'loading' && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
                {saveState === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {saveState === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
                <span className={saveState === 'error' ? 'text-rose-400' : saveState === 'success' ? 'text-emerald-400' : 'text-slate-300'}>
                  {saveMsg}
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
              <button onClick={() => setShowDrawer(false)} className="px-4 py-2 bg-slate-800 text-slate-200 rounded text-xs">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveState === 'loading'}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                {saveState === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm w-full max-w-sm">
            <p className="text-slate-200">
              Delete <strong className="text-white">{deletingProduct.name}</strong>?
            </p>
            <p className="text-slate-400 text-xs mt-1">This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-3 py-1.5 bg-slate-700 text-slate-200 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product View Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 flex items-start gap-4">
              <div className="w-2/3">
                <div className="relative bg-black">
                  <img
                    src={(viewProduct.images ?? [])[viewIndex] ?? 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900&h=600&fit=crop'}
                    alt={viewProduct.name}
                    className="w-full h-80 object-cover"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2 overflow-x-auto p-2">
                  {(viewProduct.images ?? []).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setViewIndex(i)}
                      className={`flex-shrink-0 w-20 h-12 overflow-hidden rounded ${i === viewIndex ? 'ring-2 ring-purple-500' : ''}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-1/3 p-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-white">{viewProduct.name}</h3>
                  <button onClick={() => setViewProduct(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
                </div>
                <p className="text-sm text-slate-300 mt-2">{viewProduct.description}</p>
                <div className="mt-4 space-y-2 text-xs text-slate-400">
                  <div><strong>Category:</strong> {viewProduct.category}</div>
                  <div><strong>Retail Value:</strong> {(viewProduct.retailValue || 0).toLocaleString()} ETB</div>
                  <div>
                    <strong>Linked Auction:</strong>{' '}
                    {viewProduct.linkedAuctionId
                      ? `${viewProduct.linkedAuctionId} (${viewProduct.linkedAuctionStatus})`
                      : 'Unlinked'}
                  </div>
                  {viewProduct.linkedAuctionId ? (
                    (() => {
                      const auction = auctions.find((a) => a.id === viewProduct.linkedAuctionId);
                      return auction ? (
                        <div>
                          <strong>Auction Time:</strong>
                          <div className="mt-1">
                            <CountdownTimer endTime={auction.endTime} status={auction.status} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-[11px]">Auction data unavailable</div>
                      );
                    })()
                  ) : null}
                  <div><strong>Created:</strong> {viewProduct.createdAt}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
