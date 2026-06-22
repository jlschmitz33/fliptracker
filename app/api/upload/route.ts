import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const itemId = (formData.get('item_id') as string) || 'general';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Images only' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Use Vercel Blob if token is available (production), otherwise local storage (dev)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`fliptracker/${itemId}/${filename}`, buffer, {
        access: 'public',
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url }, { status: 201 });
    }

    // Local fallback for development
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', itemId);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    return NextResponse.json({ url: `/uploads/${itemId}/${filename}` }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
