import { NextRequest, NextResponse } from 'next/server';
import getDb, { toRows } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const rs = await db.execute('SELECT * FROM overhead_expenses ORDER BY date DESC, created_at DESC');
    return NextResponse.json(toRows(rs));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { category, description, amount, date } = await request.json();
    if (!category || !amount) return NextResponse.json({ error: 'category and amount required' }, { status: 400 });
    const rs = await db.execute({
      sql: `INSERT INTO overhead_expenses (category, description, amount, date)
            VALUES (?, ?, ?, ?) RETURNING *`,
      args: [category, description || null, parseFloat(amount), date || new Date().toISOString().split('T')[0]],
    });
    return NextResponse.json(rs.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
