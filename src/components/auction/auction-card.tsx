'use client';

import Link from 'next/link';
import { CountdownTimer } from './countdown-timer';
import { formatCurrency } from '@/lib/utils/pricing';

interface Props {
  auction: {
    id: string;
    title: string;
    maxBudget: number;
    status: string;
    city: string | null;
    province: string | null;
    expiresAt: string | Date | null;
    createdAt: string | Date;
    photos?: string[] | null;
    documents?: Array<{ name: string; url: string; size: number }> | null;
  };
  bidCount?: number;
  lowestBid?: number | null;
  creatorName?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'Attiva', color: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Scaduta', color: 'bg-red-100 text-red-700' },
  awarded: { label: 'Assegnata', color: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In corso', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completata', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annullata', color: 'bg-gray-100 text-gray-600' },
};

export function AuctionCard({ auction, bidCount = 0, lowestBid, creatorName }: Props) {
  const status = STATUS_MAP[auction.status] || STATUS_MAP.active;
  const location = [auction.city, auction.province].filter(Boolean).join(', ');
  const photoCount = auction.photos?.length || 0;
  const docCount = auction.documents?.length || 0;
  const coverPhoto = photoCount > 0 ? auction.photos![0] : null;

  return (
    <Link href={`/aste/${auction.id}`} className="card block hover:border-[var(--primary)]/30 transition-all group hover-lift overflow-hidden">
      {coverPhoto && (
        <div className="relative aspect-[16/9] bg-[var(--border-light)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverPhoto} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {photoCount > 1 && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur">
              +{photoCount - 1} foto
            </span>
          )}
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
            {auction.title}
          </h3>
          <span className={`badge shrink-0 ${status.color}`}>{status.label}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)] mb-3">
          {location && <span>📍 {location}</span>}
          {creatorName && <span>👤 {creatorName}</span>}
          {!coverPhoto && photoCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium">
              📷 {photoCount}
            </span>
          )}
          {docCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
              📎 {docCount}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-[var(--muted)]">Budget max</div>
              <div className="font-bold text-[var(--foreground)]">{formatCurrency(auction.maxBudget)}</div>
            </div>
            {lowestBid && (
              <div>
                <div className="text-xs text-[var(--muted)]">Migliore offerta</div>
                <div className="font-bold text-[var(--success)]">{formatCurrency(lowestBid)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-[var(--muted)]">Offerte</div>
              <div className="font-bold text-[var(--foreground)]">{bidCount}</div>
            </div>
          </div>

          {auction.status === 'active' && auction.expiresAt && (
            <CountdownTimer expiresAt={auction.expiresAt} compact />
          )}
        </div>
      </div>

      {/* Timer strip */}
      {auction.status === 'active' && (
        <div className="timer-strip" />
      )}
    </Link>
  );
}
