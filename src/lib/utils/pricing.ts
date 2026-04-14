/**
 * Ribasta pricing formula.
 * Final amount = average of customer budget and winning bid.
 * Platform fee = 6% of final amount.
 */
export const PLATFORM_FEE_PERCENT = 6;

export function calculateFinalAmount(maxBudgetCents: number, winningBidCents: number) {
  const finalAmountCents = Math.round((maxBudgetCents + winningBidCents) / 2);
  const platformFeeCents = Math.round(finalAmountCents * PLATFORM_FEE_PERCENT / 100);

  return {
    originalAmountCents: maxBudgetCents,
    winningBidAmountCents: winningBidCents,
    finalAmountCents,
    platformFeeCents,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    savingsCents: maxBudgetCents - finalAmountCents,
  };
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
