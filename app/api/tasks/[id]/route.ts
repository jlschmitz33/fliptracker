import { NextRequest, NextResponse } from 'next/server';
import getDb, { firstRow } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();

    const updates: string[] = [];
    const args: unknown[] = [];

    if ('completed' in body) {
      updates.push('completed = ?');
      args.push(body.completed ? 1 : 0);
      updates.push(body.completed ? "completed_date = date('now')" : 'completed_date = NULL');
    }
    if ('name' in body) { updates.push('name = ?'); args.push(body.name); }
    if ('notes' in body) { updates.push('notes = ?'); args.push(body.notes || null); }
    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    args.push(id);
    await db.execute({ sql: `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, args: args as never[] });
    const rs = await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [id] });
    return NextResponse.json(firstRow(rs));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    await getDb().execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [parseInt(paramId)] });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
