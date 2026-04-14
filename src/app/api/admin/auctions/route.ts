import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auctions, users } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { getRequiredSession, AuthError, unauthorizedResponse, forbiddenResponse, requireRole } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getRequiredSession();
    requireRole(session, 'admin');

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const conditions = [];
    if (status) conditions.push(eq(auctions.status, status as 'active'));

    const list = await db
      .select({
        id: auctions.id, title: auctions.title, maxBudget: auctions.maxBudget,
        city: auctions.city, status: auctions.status, createdAt: auctions.createdAt,
        creatorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        bidCount: sql<number>`(SELECT count(*)::int FROM bids WHERE auction_id = ${auctions.id})`,
        lowestBid: sql<number | null>`(SELECT min(amount_cents) FROM bids WHERE auction_id = ${auctions.id})`,
      })
      .from(auctions)
      .innerJoin(users, eq(auctions.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auctions.createdAt))
      .limit(200);

    return NextResponse.json({ data: list });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.message === 'Accesso non autorizzato' ? forbiddenResponse() : unauthorizedResponse();
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore' } }, { status: 500 });
  }
}
