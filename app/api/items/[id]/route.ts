import { NextRequest, NextResponse } from 'next/server';
import getDb, { toRows, firstRow } from '@/lib/db';

const ITEM_WITH_TOTALS = `
  SELECT i.*,
    COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0) as total_expenses,
    i.purchase_price + COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0) as total_cost
  FROM items i WHERE i.id = ?
`;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const id = parseInt(params.id);

    const [itemRs, expRs, taskRs] = await Promise.all([
      db.execute({ sql: ITEM_WITH_TOTALS, args: [id] }),
      db.execute({ sql: 'SELECT * FROM expenses WHERE item_id = ? ORDER BY date DESC, created_at DESC', args: [id] }),
      db.execute({ sql: 'SELECT * FROM tasks WHERE item_id = ? ORDER BY sort_order, created_at', args: [id] }),
    ]);

    const item = firstRow(itemRs);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    return NextResponse.json({ ...item, expenses: toRows(expRs), tasks: toRows(taskRs) });
  } catch (error) {
    console.error('GET /api/items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const id = parseInt(params.id);
    const body = await request.json();

    const allowed = [
      'name', 'type', 'status', 'year', 'make', 'model', 'horsepower', 'serial_number',
      'purchase_date', 'purchase_price', 'seller', 'location', 'notes', 'known_issues',
      'photos', 'listed_price', 'listed_date', 'listed_platforms',
      'buyer_name', 'buyer_contact', 'sold_price', 'sold_date', 'payment_method', 'sale_notes',
    ];
    const updates: string[] = [];
    const args: unknown[] = [];
    for (const field of allowed) {
      if (field in body) {
        updates.push(`${field} = ?`);
        args.push(body[field] === '' ? null : body[field]);
      }
    }
    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    updates.push("updated_at = datetime('now')");
    args.push(id);

    await db.execute({ sql: `UPDATE items SET ${updates.join(', ')} WHERE id = ?`, args: args as never[] });
    const rs = await db.execute({ sql: ITEM_WITH_TOTALS, args: [id] });
    return NextResponse.json(firstRow(rs));
  } catch (error) {
    console.error('PUT /api/items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM items WHERE id = ?', args: [parseInt(params.id)] });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
