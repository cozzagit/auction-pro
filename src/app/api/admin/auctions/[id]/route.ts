import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auctions, bids } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRequiredSession, AuthError, unauthorizedResponse, forbiddenResponse, requireRole } from '@/lib/auth/get-session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getRequiredSession();
    requireRole(session, 'admin');

    const body = await request.json();
    const { action, reason, extendDays } = body;

    const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
    if (!auction) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Asta non trovata' } }, { status: 404 });

    if (action === 'cancel') {
      if (!['active', 'awarded'].includes(auction.status)) {
        return NextResponse.json({ error: { code: 'CONFLICT', message: 'Solo aste attive o assegnate possono essere annullate' } }, { status: 409 });
      }
      await db.update(auctions).set({ status: 'cancelled', closedAt: new Date(), updatedAt: new Date() }).where(eq(auctions.id, id));
      // Reject all pending bids
      await db.update(bids).set({ status: 'rejected', updatedAt: new Date() }).where(and(eq(bids.auctionId, id), eq(bids.status, 'pending')));
      return NextResponse.json({ data: { action: 'cancelled', reason } });
    }

    if (action === 'force_close') {
      if (auction.status !== 'active') {
        return NextResponse.json({ error: { code: 'CONFLICT', message: 'Solo aste attive possono essere chiuse forzatamente' } }, { status: 409 });
      }
      await db.update(auctions).set({ status: 'expired', closedAt: new Date(), updatedAt: new Date() }).where(eq(auctions.id, id));
      return NextResponse.json({ data: { action: 'force_closed' } });
    }

    if (action === 'extend') {
      if (auction.status !== 'active') {
        return NextResponse.json({ error: { code: 'CONFLICT', message: 'Solo aste attive possono essere estese' } }, { status: 409 });
      }
      const days = Math.min(Math.max(extendDays || 3, 1), 30);
      const currentExpiry = auction.expiresAt || new Date();
      const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
      await db.update(auctions).set({ expiresAt: newExpiry, updatedAt: new Date() }).where(eq(auctions.id, id));
      return NextResponse.json({ data: { action: 'extended', newExpiresAt: newExpiry } });
    }

    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Azione non valida' } }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) return error.message === 'Accesso non autorizzato' ? forbiddenResponse() : unauthorizedResponse();
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore' } }, { status: 500 });
  }
}
