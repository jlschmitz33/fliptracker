import { NextRequest, NextResponse } from 'next/server';
import getDb, { firstRow } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { item_id, category, description, amount, date } = body;
    if (!item_id || !category || amount == null) {
      return NextResponse.json({ error: 'item_id, category, and amount are required' }, { status: 400 });
    }
    const today = new Date().toISOString().split('T')[0];
    const result = await db.execute({
      sql: 'INSERT INTO expenses (item_id, category, description, amount, date) VALUES (?, ?, ?, ?, ?)',
      args: [item_id, category, description || null, parseFloat(amount), date || today],
    });
    const rs = await db.execute({ sql: 'SELECT * FROM expenses WHERE id = ?', args: [Number(result.lastInsertRowid)] });
    return NextResponse.json(firstRow(rs), { status: 201 });
  } catch (error) {
    console.error('POST /api/expenses error:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
