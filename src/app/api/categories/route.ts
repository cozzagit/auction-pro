import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return NextResponse.json({ data: allCategories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Errore nel caricamento categorie' } },
      { status: 500 },
    );
  }
}
