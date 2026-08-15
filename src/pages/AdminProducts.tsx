import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../data/mockData';
import CountdownTimer from '../components/CountdownTimer';
import { Package, Search, Plus, Edit2, Trash2, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROUTES } from '../utils/routes';

export default function AdminProducts() {
  const { auctions, products, addProduct, updateProduct, deleteProduct } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showDrawer, setShowDrawer] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [viewIndex, setViewIndex] = useState(0);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [retailValue, setRetailValue] = useState(25000);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900&h=600&fit=crop',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&h=600&fit=crop',
    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=900&h=600&fit=crop',
  ]);

  function handleOpenCreate() {
    setEditingProduct(null);
    setName('');
    setCategory('Electronics');
    setRetailValue(25000);
    setDescription('');
    setImages([
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=900&h=600&fit=crop',
    ]);
    setShowDrawer(true);
  }

  function handleOpenEdit(p: Product) {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setRetailValue(p.retailValue || 0);
    setDescription(p.description || '');
    setImages(p.images ?? []);
    setShowDrawer(true);
  }

  function handleSave() {
    if (!name.trim()) return;
    if (!images || images.length < 3) {
      alert('Please provide at least 3 images for the product (max 8).');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        category,
        retailValue: Number(retailValue),
        description,
        images,
      });
    } else {
      addProduct({
        name,
        category,
        retailValue: Number(retailValue),
        description,
        images,
      });
    }

    setShowDrawer(false);
  }

  function handleDeleteConfirmed() {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
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

  return (
    <div className="space-y-6">
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
                const isLinked = !!p.linkedAuctionId && !!p.linkedAuctionStatus;
                const auctionEndTime = p.linkedAuctionEndTime ?? auctions.find(a => a.id === p.linkedAuctionId)?.endTime;
                const auctionStartTime = p.linkedAuctionStartTime ?? auctions.find(a => a.id === p.linkedAuctionId)?.startTime;
                const auctionStatus = p.linkedAuctionStatus;
                const createdDate = p.createdAt
                  ? new Date(p.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
                  : '—';

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => { setViewProduct(p); setViewIndex(0); }}
                  >
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

                    {/* Retail Value — from backend */}
                    <td className="p-4 font-mono font-bold text-slate-200">
                      {(typeof p.retailValue === 'number' ? p.retailValue : 0).toLocaleString()} ETB
                    </td>

                    {/* Linked Auction Status — or "Create Auction" button */}
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
                            navigate(ADMIN_ROUTES.AUCTIONS);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-md text-[11px] font-semibold transition-colors"
                          title="Go to Auctions to create an auction for this product"
                        >
                          <Link2 className="w-3 h-3" /> Create Auction
                        </button>
                      )}
                    </td>

                    {/* Auction Countdown — only if linked */}
                    <td className="p-4">
                      {isLinked && auctionEndTime && auctionStatus ? (
                        <CountdownTimer endTime={auctionEndTime} status={auctionStatus} />
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Created Date — from DB */}
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
                  <label className="block text-slate-300 font-semibold mb-1">Images (min 3, max 8)</label>
                  <div className="space-y-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={img}
                          onChange={(e) =>
                            setImages((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                          }
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                        />
                        <button
                          onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={images.length <= 3}
                          className="px-2 py-1 bg-rose-600 text-white rounded disabled:opacity-40 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => images.length < 8 && setImages((prev) => [...prev, ''])}
                        disabled={images.length >= 8}
                        className="px-3 py-2 bg-purple-600 text-white rounded disabled:opacity-40 text-xs"
                      >
                        Add Image
                      </button>
                      <span className="text-[11px] text-slate-400">{images.length} / 8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
              <button onClick={() => setShowDrawer(false)} className="px-4 py-2 bg-slate-800 text-slate-200 rounded text-xs">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold">
                Save Product
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
