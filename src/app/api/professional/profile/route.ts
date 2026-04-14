import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { professionals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getRequiredSession, AuthError, unauthorizedResponse } from '@/lib/auth/get-session';

export async function GET() {
  try {
    const session = await getRequiredSession();
    const [pro] = await db.select().from(professionals).where(eq(professionals.userId, session.userId));
    if (!pro) return NextResponse.json({ data: null });
    return NextResponse.json({ data: pro });
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedResponse();
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getRequiredSession();
    const body = await request.json();

    const [existing] = await db.select({ id: professionals.id }).from(professionals).where(eq(professionals.userId, session.userId));
    if (existing) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'Profilo gia esistente' } }, { status: 409 });
    }

    const [pro] = await db.insert(professionals).values({
      userId: session.userId,
      businessName: body.businessName?.trim() || '',
      vatNumber: body.vatNumber?.trim() || '',
      description: body.description?.trim() || null,
      experience: body.experience?.trim() || null,
      address: body.address?.trim() || null,
      city: body.city?.trim() || null,
      province: body.province?.trim()?.toUpperCase() || null,
      zipCode: body.zipCode?.trim() || null,
      hasInsurance: body.hasInsurance || false,
      hasLicense: body.hasLicense || false,
    }).returning();

    return NextResponse.json({ data: pro }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedResponse();
    console.error('POST /api/professional/profile error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore' } }, { status: 500 });
  }
}
