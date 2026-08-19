import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { uploadApi } from '../utils/api';
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  /** Current image URL (shown as preview) */
  value: string;
  /** Called with the new Cloudinary URL after a successful upload */
  onUploaded: (url: string) => void;
  /** Called when the image is removed */
  onRemove?: () => void;
  label?: string;
  className?: string;
}

export default function ImageUploader({
  value,
  onUploaded,
  onRemove,
  label = 'Upload Image',
  className = '',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('File must be smaller than 8 MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadApi.uploadImage(file);
      onUploaded(url);
    } catch (e: any) {
      setError(e?.message || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = '';
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <p className="text-xs font-semibold text-slate-300">{label}</p>
      )}

      {/* Preview when image exists */}
      {value ? (
        <div className="relative group inline-block">
          <img
            src={value}
            alt="Uploaded"
            className="h-32 w-48 object-cover rounded-xl border border-slate-700"
          />
          {/* overlay buttons */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Change
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        /* Drop zone when no image */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors select-none ${
            dragging
              ? 'border-purple-500 bg-purple-950/30'
              : 'border-slate-700 bg-slate-950/40 hover:border-purple-600 hover:bg-purple-950/20'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-xs text-slate-400">Uploading to cloud…</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <Upload className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-xs text-slate-300 font-semibold text-center">
                Click or drag &amp; drop to upload
              </p>
              <p className="text-[10px] text-slate-500">PNG, JPG, WEBP — max 8 MB</p>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-semibold">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Success indicator (brief) */}
      {!uploading && value && !error && (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
          <CheckCircle className="w-3 h-3" /> Saved to cloud
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}

