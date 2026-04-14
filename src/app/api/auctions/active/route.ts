import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auctions, bids, users } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const activeAuctions = await db
      .select({
        auction: auctions,
        creatorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        bidCount: sql<number>`(SELECT count(*)::int FROM bids WHERE auction_id = ${auctions.id})`,
        lowestBid: sql<number | null>`(SELECT min(amount_cents) FROM bids WHERE auction_id = ${auctions.id})`,
      })
      .from(auctions)
      .innerJoin(users, eq(auctions.userId, users.id))
      .where(eq(auctions.status, 'active'))
      .orderBy(desc(auctions.createdAt))
      .limit(50);

    return NextResponse.json({
      data: activeAuctions.map(r => ({
        ...r.auction,
        creatorName: r.creatorName,
        bidCount: r.bidCount,
        lowestBid: r.lowestBid,
      })),
    });
  } catch (error) {
    console.error('GET /api/auctions/active error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Errore' } },
      { status: 500 },
    );
  }
}
