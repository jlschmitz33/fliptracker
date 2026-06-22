import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    await db.execute('DELETE FROM tasks');
    await db.execute('DELETE FROM expenses');
    await db.execute('DELETE FROM items');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
