import { NextResponse } from 'next/server';
import getDb, { toRows } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    const [soldRs, activeRs, monthlyRs] = await Promise.all([
      db.execute(`
        SELECT i.name, i.sold_price, i.sold_date, i.purchase_date,
          i.purchase_price + COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0) as total_cost
        FROM items i WHERE i.status = 'Sold' AND i.sold_price IS NOT NULL
      `),
      db.execute(`
        SELECT i.purchase_price + COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0) as total_cost
        FROM items i WHERE i.status NOT IN ('Sold', 'Passed')
      `),
      db.execute(`
        SELECT strftime('%Y-%m', i.sold_date) as month,
          SUM(i.sold_price) as revenue,
          SUM(i.purchase_price + COALESCE((SELECT SUM(amount) FROM expenses WHERE item_id = i.id), 0)) as cost,
          COUNT(*) as count
        FROM items i WHERE i.status = 'Sold' AND i.sold_date IS NOT NULL
        GROUP BY month ORDER BY month ASC LIMIT 18
      `),
    ]);

    type SoldRow = { name: string; sold_price: number; total_cost: number; sold_date: string; purchase_date: string };
    const soldItems = toRows<SoldRow>(soldRs);
    const activeItems = toRows<{ total_cost: number }>(activeRs);

    const totalSales = soldItems.reduce((s, i) => s + Number(i.sold_price), 0);
    const totalCOGS = soldItems.reduce((s, i) => s + Number(i.total_cost), 0);
    const totalProfit = totalSales - totalCOGS;
    const unsoldValue = activeItems.reduce((s, i) => s + Number(i.total_cost), 0);

    const profits = soldItems.map(i => ({
      name: i.name,
      profit: Number(i.sold_price) - Number(i.total_cost),
      roi: Number(i.total_cost) > 0 ? ((Number(i.sold_price) - Number(i.total_cost)) / Number(i.total_cost)) * 100 : 0,
      days: i.purchase_date && i.sold_date
        ? Math.round((new Date(i.sold_date as string).getTime() - new Date(i.purchase_date as string + 'T12:00:00').getTime()) / 86400000)
        : null,
    }));

    const bestFlip = profits.length > 0 ? profits.reduce((b, c) => c.profit > b.profit ? c : b) : null;
    const worstFlip = profits.length > 0 ? profits.reduce((w, c) => c.profit < w.profit ? c : w) : null;
    const avgProfit = profits.length > 0 ? totalProfit / profits.length : 0;
    const avgRoi = profits.length > 0 ? profits.reduce((s, i) => s + i.roi, 0) / profits.length : 0;
    const daysArr = profits.filter(p => p.days != null);
    const avgDays = daysArr.length > 0 ? daysArr.reduce((s, i) => s + (i.days || 0), 0) / daysArr.length : 0;

    type MonthRow = { month: string; revenue: number; cost: number; count: number };
    const monthly = toRows<MonthRow>(monthlyRs).map(m => ({
      month: m.month,
      profit: Number(m.revenue) - Number(m.cost),
      revenue: Number(m.revenue),
      count: Number(m.count),
    }));

    return NextResponse.json({
      totalSales, totalCOGS, totalProfit, unsoldValue,
      soldCount: soldItems.length, activeCount: activeItems.length,
      bestFlip, worstFlip, avgProfit, avgRoi, avgDays, monthly,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
