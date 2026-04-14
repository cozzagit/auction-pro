import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
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

    // Prevent self-deactivation
    if (id === session.userId) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Non puoi modificare il tuo account' } }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.role && ['customer', 'professional', 'admin'].includes(body.role)) updates.role = body.role;

    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!updated) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Utente non trovato' } }, { status: 404 });

    return NextResponse.json({ data: { id: updated.id, isActive: updated.isActive, role: updated.role } });
  } catch (error) {
    if (error instanceof AuthError) return error.message === 'Accesso non autorizzato' ? forbiddenResponse() : unauthorizedResponse();
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore' } }, { status: 500 });
  }
}
