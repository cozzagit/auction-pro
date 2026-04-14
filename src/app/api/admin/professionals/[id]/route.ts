import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { professionals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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
    const { status } = body;

    if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Stato non valido' } }, { status: 400 });
    }

    const [updated] = await db
      .update(professionals)
      .set({ status, updatedAt: new Date() })
      .where(eq(professionals.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Professionista non trovato' } }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.message === 'Accesso non autorizzato' ? forbiddenResponse() : unauthorizedResponse();
    }
    console.error('PATCH /api/admin/professionals/[id] error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore' } }, { status: 500 });
  }
}
