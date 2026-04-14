import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Tutti i campi sono obbligatori' } },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'La password deve avere almeno 8 caratteri' } },
        { status: 400 },
      );
    }

    const validRoles = ['customer', 'professional'];
    const userRole = validRoles.includes(role) ? role : 'customer';

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase().trim()));
    if (existing) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Email già registrata' } },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: userRole,
      })
      .returning({ id: users.id, email: users.email, role: users.role });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Errore nella registrazione' } },
      { status: 500 },
    );
  }
}
