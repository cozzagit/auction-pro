'use client';

import { useCountdown } from '@/hooks/use-countdown';

interface Props {
  expiresAt: string | Date | null;
  compact?: boolean;
}

export function CountdownTimer({ expiresAt, compact }: Props) {
  const { label, isExpired, isUrgent } = useCountdown(expiresAt);

  if (isExpired) {
    return (
      <span className={`font-semibold text-[var(--danger)] ${compact ? 'text-xs' : 'text-sm'}`}>
        Scaduta
      </span>
    );
  }

  return (
    <span className={`font-mono font-semibold tabular-nums ${compact ? 'text-xs' : 'text-sm'} ${
      isUrgent ? 'text-[var(--danger)] animate-pulse' : 'text-[var(--accent)]'
    }`}>
      ⏱ {label}
    </span>
  );
}
