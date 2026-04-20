import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getRequiredSession, AuthError, unauthorizedResponse } from '@/lib/auth/get-session';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: NextRequest) {
  try {
    await getRequiredSession();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'photo'; // 'photo' or 'document'

    if (!file) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'File mancante' } }, { status: 400 });
    }

    const allowed = type === 'photo' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
    const maxSize = type === 'photo' ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;

    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: `Tipo file non supportato: ${file.type}` } }, { status: 400 });
    }
    if (file.size > maxSize) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: `File troppo grande (max ${maxSize / 1024 / 1024}MB)` } }, { status: 400 });
    }

    // Create uploads dir if needed
    const uploadsDir = join(process.cwd(), 'public', 'uploads', type === 'photo' ? 'photos' : 'documents');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin';
    const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    const filename = `${randomUUID()}.${safeExt}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/uploads/${type === 'photo' ? 'photos' : 'documents'}/${filename}`;

    return NextResponse.json({
      data: {
        url,
        name: file.name,
        size: file.size,
        type: file.type,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedResponse();
    console.error('POST /api/upload error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Errore upload' } }, { status: 500 });
  }
}
