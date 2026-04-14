import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auctions, bids, payments, contracts, users, professionals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRequiredSession, AuthError, unauthorizedResponse } from '@/lib/auth/get-session';
import { calculateFinalAmount } from '@/lib/utils/pricing';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
    if (!auction) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Asta non trovata' } }, { status: 404 });
    }
    return NextResponse.json({ data: auction });
  } catch (error) {
    console.error('GET /api/auctions/[id] error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getRequiredSession();
    const body = await request.json();

    // Accept bid flow
    if (body.acceptBidId) {
      const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
      if (!auction || auction.userId !== session.userId) {
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Non autorizzato' } }, { status: 403 });
      }
      if (auction.status !== 'active') {
        return NextResponse.json({ error: { code: 'CONFLICT', message: 'L\'asta non e piu attiva' } }, { status: 409 });
      }

      const [bid] = await db.select().from(bids).where(and(eq(bids.id, body.acceptBidId), eq(bids.auctionId, id)));
      if (!bid) {
        return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Offerta non trovata' } }, { status: 404 });
      }

      // Calculate pricing
      const pricing = calculateFinalAmount(auction.maxBudget, bid.amountCents);

      // Create payment
      const [payment] = await db.insert(payments).values({
        auctionId: id,
        bidId: bid.id,
        clientUserId: auction.userId,
        professionalUserId: bid.professionalId,
        originalAmountCents: pricing.originalAmountCents,
        winningBidAmountCents: pricing.winningBidAmountCents,
        finalAmountCents: pricing.finalAmountCents,
        platformFeeCents: pricing.platformFeeCents,
        platformFeePercent: pricing.platformFeePercent,
      }).returning();

      // Update auction status
      await db.update(auctions).set({
        status: 'awarded',
        winningBidId: bid.id,
        updatedAt: new Date(),
      }).where(eq(auctions.id, id));

      // Update bid status
      await db.update(bids).set({ status: 'accepted', updatedAt: new Date() }).where(eq(bids.id, bid.id));

      // Reject other bids
      await db.update(bids).set({ status: 'rejected', updatedAt: new Date() })
        .where(and(eq(bids.auctionId, id), eq(bids.status, 'pending')));

      // Create contract with contact info
      const [client] = await db.select().from(users).where(eq(users.id, auction.userId));
      const [pro] = await db.select().from(users).where(eq(users.id, bid.professionalId));
      const [proProfile] = await db.select().from(professionals).where(eq(professionals.userId, bid.professionalId));

      await db.insert(contracts).values({
        auctionId: id,
        paymentId: payment.id,
        clientUserId: auction.userId,
        professionalUserId: bid.professionalId,
        clientContactInfo: { name: `${client.firstName} ${client.lastName}`, email: client.email, phone: client.phone || '' },
        professionalContactInfo: { name: `${pro.firstName} ${pro.lastName}`, email: pro.email, businessName: proProfile?.businessName || '', phone: pro.phone || '' },
      });

      return NextResponse.json({ data: { paymentId: payment.id } });
    }

    // Status update
    if (body.status) {
      const [updated] = await db.update(auctions).set({
        status: body.status,
        updatedAt: new Date(),
        ...(body.status === 'completed' ? { closedAt: new Date() } : {}),
      }).where(eq(auctions.id, id)).returning();

      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Nessuna azione valida' } }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedResponse();
    console.error('PATCH /api/auctions/[id] error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore' } }, { status: 500 });
  }
}
