import { NextResponse } from 'next/server';
import getDb, { toRows } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const rs = await db.execute(`
      SELECT
        i.id, i.name, i.type, i.status, i.year, i.make, i.model, i.horsepower,
        i.serial_number, i.purchase_date, i.purchase_price, i.seller, i.location,
        i.listed_price, i.listed_date, i.listed_platforms,
        i.sold_price, i.sold_date, i.buyer_name, i.buyer_contact, i.payment_method,
        i.notes, i.known_issues, i.sale_notes,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0) as total_expenses,
        i.purchase_price + COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0) as total_cost,
        CASE WHEN i.sold_price IS NOT NULL
          THEN i.sold_price - (i.purchase_price + COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0))
          ELSE NULL END as profit,
        CASE WHEN i.sold_price IS NOT NULL AND (i.purchase_price + COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0)) > 0
          THEN ROUND((i.sold_price - (i.purchase_price + COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0))) /
            (i.purchase_price + COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0)) * 100, 2)
          ELSE NULL END as roi_percent,
        CASE WHEN i.sold_date IS NOT NULL AND i.purchase_date IS NOT NULL
          THEN CAST(julianday(i.sold_date) - julianday(i.purchase_date) AS INTEGER)
          ELSE NULL END as days_held
      FROM items i ORDER BY i.created_at DESC
    `);

    const items = toRows(rs);
    const headers = [
      'ID','Name','Type','Status','Year','Make','Model','HP','Serial #',
      'Purchase Date','Purchase Price','Seller','Location',
      'Listed Price','Listed Date','Listed Platforms',
      'Sold Price','Sold Date','Buyer Name','Buyer Contact','Payment',
      'Notes','Known Issues','Sale Notes',
      'Total Expenses','Total Cost','Profit','ROI %','Days Held',
    ];
    const keys = [
      'id','name','type','status','year','make','model','horsepower','serial_number',
      'purchase_date','purchase_price','seller','location',
      'listed_price','listed_date','listed_platforms',
      'sold_price','sold_date','buyer_name','buyer_contact','payment_method',
      'notes','known_issues','sale_notes',
      'total_expenses','total_cost','profit','roi_percent','days_held',
    ];
    const esc = (v: unknown) => {
      if (v == null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(','), ...items.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fliptracker-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
