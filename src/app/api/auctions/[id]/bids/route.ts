import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bids, auctions, users, professionals } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getRequiredSession, AuthError, unauthorizedResponse } from '@/lib/auth/get-session';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auctionId } = await params;

  try {
    const auctionBids = await db
      .select({
        bid: bids,
        professionalName: users.firstName,
        professionalLastName: users.lastName,
        businessName: professionals.businessName,
        rating: professionals.rating,
        totalJobs: professionals.totalJobs,
      })
      .from(bids)
      .innerJoin(users, eq(bids.professionalId, users.id))
      .leftJoin(professionals, eq(professionals.userId, users.id))
      .where(eq(bids.auctionId, auctionId))
      .orderBy(asc(bids.amountCents));

    return NextResponse.json({
      data: auctionBids.map(r => ({
        ...r.bid,
        professionalName: `${r.professionalName} ${r.professionalLastName}`,
        businessName: r.businessName,
        rating: r.rating,
        totalJobs: r.totalJobs,
      })),
    });
  } catch (error) {
    console.error('GET /api/auctions/[id]/bids error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Errore' } },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auctionId } = await params;

  try {
    const session = await getRequiredSession();

    if (session.role !== 'professional') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Solo i professionisti possono fare offerte' } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { amount, message } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'L\'importo deve essere positivo' } },
        { status: 400 },
      );
    }

    // Check auction exists and is active
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, auctionId));
    if (!auction || auction.status !== 'active') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Asta non trovata o non attiva' } },
        { status: 404 },
      );
    }

    // Check not already bid
    const [existing] = await db
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.auctionId, auctionId), eq(bids.professionalId, session.userId)));

    if (existing) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Hai gia fatto un\'offerta su questa asta' } },
        { status: 409 },
      );
    }

    // Check bid < maxBudget
    const amountCents = Math.round(amount * 100);
    if (amountCents >= auction.maxBudget) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'L\'offerta deve essere inferiore al budget massimo' } },
        { status: 400 },
      );
    }

    const [bid] = await db
      .insert(bids)
      .values({
        auctionId,
        professionalId: session.userId,
        amountCents,
        message: message?.trim() || null,
      })
      .returning();

    return NextResponse.json({ data: bid }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedResponse();
    console.error('POST /api/auctions/[id]/bids error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Errore' } },
      { status: 500 },
    );
  }
}
