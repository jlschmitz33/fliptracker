import { NextRequest, NextResponse } from 'next/server';
import getDb, { firstRow } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { item_id, name } = body;
    if (!item_id || !name) return NextResponse.json({ error: 'item_id and name are required' }, { status: 400 });

    const maxRs = await db.execute({ sql: 'SELECT MAX(sort_order) as mx FROM tasks WHERE item_id = ?', args: [item_id] });
    const mx = (firstRow<{ mx: number | null }>(maxRs))?.mx ?? -1;

    const result = await db.execute({
      sql: 'INSERT INTO tasks (item_id, name, sort_order) VALUES (?, ?, ?)',
      args: [item_id, name, (mx ?? -1) + 1],
    });
    const rs = await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [Number(result.lastInsertRowid)] });
    return NextResponse.json(firstRow(rs), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
