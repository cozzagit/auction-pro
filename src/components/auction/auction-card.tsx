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
  catIcon?: string | null;
  catColor?: string | null;
  catName?: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'Attiva', color: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Scaduta', color: 'bg-red-100 text-red-700' },
  awarded: { label: 'Assegnata', color: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In corso', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completata', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annullata', color: 'bg-gray-100 text-gray-600' },
};

export function AuctionCard({ auction, bidCount = 0, lowestBid, creatorName, catIcon, catColor, catName }: Props) {
  const status = STATUS_MAP[auction.status] || STATUS_MAP.active;
  const location = [auction.city, auction.province].filter(Boolean).join(', ');
  const photoCount = auction.photos?.length || 0;
  const docCount = auction.documents?.length || 0;
  const coverPhoto = photoCount > 0 ? auction.photos![0] : null;
  const color = catColor || '#3B82F6';
  const icon = catIcon || '📦';

  return (
    <Link href={`/aste/${auction.id}`} className="card block hover:border-[var(--primary)]/30 transition-all group hover-lift overflow-hidden flex flex-col">
      {/* Cover uniforme sempre presente */}
      <div className="relative aspect-[16/9] overflow-hidden shrink-0">
        {coverPhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPhoto} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {photoCount > 1 && (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur">
                +{photoCount - 1} foto
              </span>
            )}
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
            style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}0a 100%)` }}
          >
            <div className="text-center">
              <div className="text-5xl mb-2 opacity-80">{icon}</div>
              {catName && (
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{catName}</div>
              )}
            </div>
          </div>
        )}
        {/* Status badge top-right */}
        <span className={`absolute top-2 right-2 badge ${status.color} shadow-sm`}>{status.label}</span>
        {/* Category top-left */}
        {catName && (
          <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] font-bold flex items-center gap-1 shadow-sm" style={{ color }}>
            {icon} {catName}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 min-h-[2.75rem] mb-2">
          {auction.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)] mb-3">
          {location && <span>📍 {location}</span>}
          {creatorName && <span>👤 {creatorName}</span>}
          {docCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">
              📎 {docCount}
            </span>
          )}
        </div>

        <div className="flex-1" />

        <div className="pt-3 border-t border-[var(--border)] flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Budget max</div>
            <div className="font-extrabold text-[var(--foreground)]">{formatCurrency(auction.maxBudget)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{bidCount} {bidCount === 1 ? 'offerta' : 'offerte'}</div>
            {lowestBid ? (
              <div className="font-extrabold text-[var(--success)]">{formatCurrency(lowestBid)}</div>
            ) : (
              <div className="text-xs text-[var(--muted)] italic">Nessuna</div>
            )}
          </div>
        </div>

        {auction.status === 'active' && auction.expiresAt && (
          <div className="mt-2 flex justify-center">
            <CountdownTimer expiresAt={auction.expiresAt} compact />
          </div>
        )}
      </div>

      {auction.status === 'active' && <div className="timer-strip" />}
    </Link>
  );
}
