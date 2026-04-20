'use client';

import { useState } from 'react';

interface Props {
  photos: string[];
}

export function PhotoGallery({ photos }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className={`grid gap-2 ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {photos.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className={`relative overflow-hidden rounded-xl bg-[var(--border-light)] hover:ring-2 ring-[var(--primary)] transition-all active:scale-[0.98] ${
              photos.length === 1 ? 'aspect-video' : 'aspect-square'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected !== null && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSelected(null); }}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur text-white text-xl hover:bg-white/20 transition-colors"
          >
            ✕
          </button>

          {selected > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelected(selected - 1); }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur text-white text-2xl hover:bg-white/20 transition-colors"
            >
              ←
            </button>
          )}

          {selected < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelected(selected + 1); }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur text-white text-2xl hover:bg-white/20 transition-colors"
            >
              →
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[selected]}
            alt={`Foto ${selected + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-white text-sm">
            {selected + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
