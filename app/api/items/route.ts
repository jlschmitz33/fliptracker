import { NextRequest, NextResponse } from 'next/server';
import getDb, { toRows, firstRow, InValue } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let sql = `
      SELECT
        i.*,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0) as total_expenses,
        i.purchase_price + COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0) as total_cost,
        (SELECT COUNT(*) FROM tasks WHERE item_id = i.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE item_id = i.id AND completed = 1) as tasks_completed
      FROM items i WHERE 1=1
    `;
    const args: InValue[] = [];

    if (status && status !== 'All') { sql += ' AND i.status = ?'; args.push(status); }
    if (type && type !== 'all') { sql += ' AND i.type = ?'; args.push(type); }
    if (search) {
      sql += ' AND (i.name LIKE ? OR i.make LIKE ? OR i.model LIKE ? OR i.notes LIKE ? OR i.seller LIKE ? OR i.location LIKE ?)';
      const like = `%${search}%`;
      args.push(like, like, like, like, like, like);
    }
    sql += ' ORDER BY i.created_at DESC';

    const rs = await db.execute({ sql, args });
    return NextResponse.json(toRows(rs));
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      name, type = 'outboard', status = 'Purchased',
      year, make, model, horsepower, serial_number,
      purchase_date, purchase_price = 0, seller, location, notes, known_issues,
    } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const result = await db.execute({
      sql: `INSERT INTO items (name, type, status, year, make, model, horsepower, serial_number,
              purchase_date, purchase_price, seller, location, notes, known_issues)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [name, type, status,
        year || null, make || null, model || null, horsepower || null, serial_number || null,
        purchase_date || null, purchase_price || 0, seller || null, location || null,
        notes || null, known_issues || null],
    });
    const itemId = Number(result.lastInsertRowid);

    const outboardTasks = [
      'Compression test', 'Spark test', 'Carb clean/rebuild', 'Lower unit oil change',
      'Water pump/impeller check', 'Prop condition check', 'Shift & throttle check',
      'Test run', 'Photos/videos taken', 'Ready to list',
    ];
    const boatTasks = [
      'Hull inspection', 'Bilge/drain plug check', 'Wiring/electronics check',
      'Trailer lights & bearings', 'Motor test (if applicable)', 'Photos/videos taken', 'Ready to list',
    ];
    const trailerTasks = [
      'Frame condition check', 'Lights & wiring', 'Wheel bearings',
      'Tires & rims', 'Winch & straps', 'Bunks/rollers', 'Ready to list',
    ];
    const taskList = type === 'outboard' || type === 'bundle' ? outboardTasks
      : type === 'boat' ? boatTasks : type === 'trailer' ? trailerTasks : [];

    for (const [i, taskName] of taskList.entries()) {
      await db.execute({ sql: 'INSERT INTO tasks (item_id, name, sort_order) VALUES (?, ?, ?)', args: [itemId, taskName, i] });
    }

    const itemRs = await db.execute({ sql: 'SELECT * FROM items WHERE id = ?', args: [itemId] });
    return NextResponse.json(firstRow(itemRs), { status: 201 });
  } catch (error) {
    console.error('POST /api/items error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
