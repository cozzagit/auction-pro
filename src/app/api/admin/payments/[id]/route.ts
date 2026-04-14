import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments } from '@/lib/db/schema';
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

    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    if (!payment) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Pagamento non trovato' } }, { status: 404 });

    if (status === 'paid' && payment.status !== 'pending') {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'Solo pagamenti in attesa possono essere confermati' } }, { status: 409 });
    }
    if (status === 'refunded' && payment.status !== 'paid') {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'Solo pagamenti completati possono essere rimborsati' } }, { status: 409 });
    }

    const updates: Record<string, unknown> = { status };
    if (status === 'paid') updates.paidAt = new Date();

    const [updated] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof AuthError) return error.message === 'Accesso non autorizzato' ? forbiddenResponse() : unauthorizedResponse();
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore' } }, { status: 500 });
  }
}
