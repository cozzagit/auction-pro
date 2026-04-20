'use client';

import { useState, useRef } from 'react';

interface PhotoItem { url: string; name: string; size: number }
interface DocItem { url: string; name: string; size: number }

interface Props {
  photos: PhotoItem[];
  documents: DocItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  onDocsChange: (docs: DocItem[]) => void;
}

export function FileUploader({ photos, documents, onPhotosChange, onDocsChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, type: 'photo' | 'document') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error?.message || 'Errore upload');
    }
    return (await res.json()).data;
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      for (const file of files) {
        const data = await uploadFile(file, 'photo');
        onPhotosChange([...photos, { url: data.url, name: data.name, size: data.size }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore upload');
    }
    setUploading(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  async function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      for (const file of files) {
        const data = await uploadFile(file, 'document');
        onDocsChange([...documents, { url: data.url, name: data.name, size: data.size }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore upload');
    }
    setUploading(false);
    if (docInputRef.current) docInputRef.current.value = '';
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-2.5 rounded-xl bg-[var(--danger-light)] text-[var(--danger)] text-sm font-medium">
          {error}
        </div>
      )}

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          📷 Foto (opzionale)
          <span className="text-xs text-[var(--muted)] font-normal ml-1">— max 10MB ciascuna</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-[var(--border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onPhotosChange(photos.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
          >
            <span className="text-2xl">📷</span>
            <span className="text-xs text-[var(--muted)]">{uploading ? 'Carica...' : 'Aggiungi'}</span>
          </button>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />
      </div>

      {/* Documents */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          📄 Documenti (opzionale)
          <span className="text-xs text-[var(--muted)] font-normal ml-1">— PDF, Word, TXT. Max 20MB</span>
        </label>
        {documents.length > 0 && (
          <div className="space-y-2 mb-2">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--border-light)] border border-[var(--border)]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">📄</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--foreground)] truncate">{doc.name}</div>
                    <div className="text-xs text-[var(--muted)]">{formatSize(doc.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDocsChange(documents.filter((_, idx) => idx !== i))}
                  className="shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => docInputRef.current?.click()}
          disabled={uploading}
          className="w-full p-3 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm text-[var(--muted)] disabled:opacity-50"
        >
          <span className="text-xl">📎</span>
          <span>{uploading ? 'Caricamento...' : 'Aggiungi documento'}</span>
        </button>
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          multiple
          onChange={handleDocSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
