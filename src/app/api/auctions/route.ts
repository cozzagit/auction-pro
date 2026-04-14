import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auctions, auctionServices, bids } from '@/lib/db/schema';
import { eq, desc, asc, sql, and } from 'drizzle-orm';
import { getRequiredSession, AuthError, unauthorizedResponse } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const conditions = [];
    if (status) conditions.push(eq(auctions.status, status as 'active'));

    const list = await db
      .select()
      .from(auctions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auctions.createdAt))
      .limit(50);

    return NextResponse.json({ data: list });
  } catch (error) {
    console.error('GET /api/auctions error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Errore' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getRequiredSession();
    const body = await request.json();

    const { title, description, maxBudget, city, province, expiresAt, services: selectedServices } = body;

    if (!title || title.length < 5) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Il titolo deve avere almeno 5 caratteri' } }, { status: 400 });
    }
    if (!description || description.length < 20) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'La descrizione deve avere almeno 20 caratteri' } }, { status: 400 });
    }
    if (!maxBudget || maxBudget <= 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Il budget deve essere positivo' } }, { status: 400 });
    }

    const [auction] = await db
      .insert(auctions)
      .values({
        userId: session.userId,
        title: title.trim(),
        description: description.trim(),
        maxBudget: Math.round(maxBudget * 100),
        city: city?.trim() || null,
        province: province?.trim()?.toUpperCase() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning();

    // Insert auction services
    if (selectedServices && Array.isArray(selectedServices)) {
      for (const svc of selectedServices) {
        await db.insert(auctionServices).values({
          auctionId: auction.id,
          serviceId: svc.serviceId,
          parameters: svc.parameters || {},
        });
      }
    }

    return NextResponse.json({ data: auction }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedResponse();
    console.error('POST /api/auctions error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Errore nella creazione asta' } },
      { status: 500 },
    );
  }
}
