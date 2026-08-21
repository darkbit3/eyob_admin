import { useEffect, useState } from 'react';
import { advertisementsApi } from '../utils/api';
import ImageUploader from '../components/ImageUploader';
import { Megaphone, Plus, Pencil, Trash2, X, Loader2, CheckCircle, PauseCircle } from 'lucide-react';

type Advertisement = {
  id: string; title: string; subtitle: string; image_url: string; target_url: string;
  cta_label: string; status: 'active' | 'paused'; sort_order: number;
};

type FormState = Omit<Advertisement, 'id'>;
type FormErrors = Partial<Record<keyof FormState, string>>;
const emptyForm: FormState = { title: '', subtitle: '', image_url: '', target_url: '', cta_label: 'Explore', status: 'active', sort_order: 0 };

export default function AdminAdvertisements() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  async function loadAds() {
    setLoading(true);
    try { const response = await advertisementsApi.list(); setAds(response.data || []); }
    catch (error: any) { setMessage(error.message || 'Could not load advertisements.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadAds(); }, []);

  function openCreate() { setEditing(null); setForm(emptyForm); setFormErrors({}); setOpen(true); }
  function openEdit(ad: Advertisement) { setEditing(ad); setForm({ ...ad }); setFormErrors({}); setOpen(true); }
  function closeForm() { if (!saving) setOpen(false); }
  function change(field: keyof FormState, value: string | number) {
    setForm(current => ({ ...current, [field]: value }));
    setFormErrors(current => ({ ...current, [field]: undefined }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const errors: FormErrors = {};
    if (!form.title.trim()) errors.title = 'Advertisement name is required.';
    if (!form.image_url.trim()) errors.image_url = 'Import an advertisement image.';
    else { try { new URL(form.image_url); } catch { errors.image_url = 'Upload a valid image first.'; } }
    if (form.target_url.trim()) {
      try { new URL(form.target_url); } catch { errors.target_url = 'Enter a valid destination URL.'; }
    }
    if (!Number.isInteger(Number(form.sort_order)) || Number(form.sort_order) < 0) errors.sort_order = 'Use a whole number of 0 or higher.';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSaving(true); setMessage('');
    try {
      if (editing) await advertisementsApi.update(editing.id, form);
      else await advertisementsApi.create(form);
      setOpen(false); await loadAds(); setMessage(editing ? 'Advertisement updated.' : 'Advertisement published.');
    } catch (error: any) { setMessage(error.message || 'Could not save advertisement.'); }
    finally { setSaving(false); }
  }
  async function remove(ad: Advertisement) {
    if (!window.confirm(`Delete "${ad.title}"?`)) return;
    try { await advertisementsApi.delete(ad.id); await loadAds(); setMessage('Advertisement deleted.'); }
    catch (error: any) { setMessage(error.message || 'Could not delete advertisement.'); }
  }
  async function toggle(ad: Advertisement) {
    try { await advertisementsApi.update(ad.id, { status: ad.status === 'active' ? 'paused' : 'active' }); await loadAds(); }
    catch (error: any) { setMessage(error.message || 'Could not update advertisement.'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-purple-400" /> Advertisements</h1>
          <p className="text-slate-400 text-xs mt-1">Publish the promotional cards shown across the customer dashboard.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl"><Plus className="w-4 h-4" /> Create Advertisement</button>
      </div>

      {message && <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"><CheckCircle className="w-4 h-4 text-emerald-400" /> {message}</div>}

      <div className="grid gap-4">
        {loading ? <div className="p-10 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading advertisements...</div> : ads.length === 0 ? <div className="p-10 text-center bg-slate-900 border border-dashed border-slate-700 rounded-2xl text-slate-400 text-sm">No advertisements yet. Create the first one.</div> : ads.map(ad => (
          <div key={ad.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
            <img src={ad.image_url} alt="" className="w-full md:w-56 h-32 object-cover rounded-xl bg-slate-800" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-white">{ad.title}</h2><p className="text-xs text-slate-400 mt-1">{ad.subtitle || 'No supporting copy'}</p></div><span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${ad.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{ad.status}</span></div>
              <div className="flex flex-wrap gap-2 mt-5 text-[10px] text-slate-400"><span>Order {ad.sort_order}</span><span>CTA: {ad.cta_label}</span>{ad.target_url && <span className="truncate max-w-xs">Link: {ad.target_url}</span>}</div>
              <div className="flex gap-2 mt-4"><button onClick={() => toggle(ad)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"><PauseCircle className="w-3.5 h-3.5" /> {ad.status === 'active' ? 'Pause' : 'Activate'}</button><button onClick={() => openEdit(ad)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"><Pencil className="w-3.5 h-3.5" /> Edit</button><button onClick={() => remove(ad)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/50 text-xs text-rose-300 hover:bg-rose-900"><Trash2 className="w-3.5 h-3.5" /> Delete</button></div>
            </div>
          </div>
        ))}
      </div>

      {open && <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={save} className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between mb-5"><h2 className="font-bold text-white">{editing ? 'Edit Advertisement' : 'Create Advertisement'}</h2><button type="button" onClick={closeForm} className="p-1.5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div><div className="grid sm:grid-cols-2 gap-4">
        {([['title', 'Advertisement name', 'text'], ['subtitle', 'Supporting copy', 'text'], ['target_url', 'Destination URL', 'url'], ['cta_label', 'Button label', 'text']] as const).map(([field, label, type]) => <label key={field} className={field === 'subtitle' ? 'sm:col-span-2' : ''}><span className="block text-[11px] font-bold text-slate-400 mb-1">{label}</span><input type={type} value={form[field]} onChange={e => change(field, e.target.value)} className={`w-full bg-slate-950 border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500 ${formErrors[field] ? 'border-rose-500' : 'border-slate-700'}`} />{formErrors[field] && <span className="block mt-1 text-[11px] font-semibold text-rose-400">{formErrors[field]}</span>}</label>)}
        <div className="sm:col-span-2"><ImageUploader value={form.image_url} onUploaded={url => change('image_url', url)} onRemove={() => change('image_url', '')} label="Advertisement image from computer (Cloudinary)" />{formErrors.image_url && <p className="mt-1 text-[11px] font-semibold text-rose-400">{formErrors.image_url}</p>}</div>
        <label><span className="block text-[11px] font-bold text-slate-400 mb-1">Display order</span><input type="number" min="0" step="1" value={form.sort_order} onChange={e => change('sort_order', Number(e.target.value))} className={`w-full bg-slate-950 border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500 ${formErrors.sort_order ? 'border-rose-500' : 'border-slate-700'}`} />{formErrors.sort_order && <span className="block mt-1 text-[11px] font-semibold text-rose-400">{formErrors.sort_order}</span>}</label>
        <label><span className="block text-[11px] font-bold text-slate-400 mb-1">Status</span><select value={form.status} onChange={e => change('status', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"><option value="active">Active and visible</option><option value="paused">Paused and hidden</option></select></label>
      </div><button type="submit" disabled={saving} className="mt-5 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-bold">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Publish Advertisement'}</button></form></div>}
    </div>
  );
}
