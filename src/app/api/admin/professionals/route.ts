import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { professionals, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRequiredSession, AuthError, unauthorizedResponse, forbiddenResponse, requireRole } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getRequiredSession();
    requireRole(session, 'admin');

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(professionals.status, status as 'pending'));
    }

    const pros = await db
      .select({
        id: professionals.id,
        userId: professionals.userId,
        businessName: professionals.businessName,
        vatNumber: professionals.vatNumber,
        status: professionals.status,
        city: professionals.city,
        province: professionals.province,
        hasInsurance: professionals.hasInsurance,
        hasLicense: professionals.hasLicense,
        userName: users.firstName,
        userEmail: users.email,
      })
      .from(professionals)
      .innerJoin(users, eq(professionals.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({ data: pros });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.message === 'Accesso non autorizzato' ? forbiddenResponse() : unauthorizedResponse();
    }
    console.error('GET /api/admin/professionals error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore' } }, { status: 500 });
  }
}
