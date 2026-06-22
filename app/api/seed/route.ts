import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    await db.execute('DELETE FROM tasks');
    await db.execute('DELETE FROM expenses');
    await db.execute('DELETE FROM items');

    const sampleItems = [
      {
        name: '2005 Yamaha F115 4-Stroke', type: 'outboard', status: 'Sold',
        year: 2005, make: 'Yamaha', model: 'F115', horsepower: 115,
        purchase_date: '2024-01-15', purchase_price: 1200,
        seller: 'Mike Johnson - Facebook', location: 'Knoxville, TN',
        notes: 'Good compression on all cylinders. Needed carb work and impeller.',
        known_issues: null,
        listed_price: 3000, listed_date: '2024-02-01', listed_platforms: '["Facebook Marketplace","Craigslist"]',
        sold_price: 2800, sold_date: '2024-02-18', buyer_name: 'Bob Smith', payment_method: 'Cash',
        sale_notes: 'Buyer drove 2 hours. Happy with it.',
        expenses: [
          { category: 'Parts', description: 'Carb rebuild kit', amount: 45, date: '2024-01-20' },
          { category: 'Parts', description: 'Water pump/impeller kit', amount: 38, date: '2024-01-20' },
          { category: 'Gear Oil', description: 'Lower unit oil (2 qts)', amount: 12, date: '2024-01-22' },
          { category: 'Fuel', description: 'Test run fuel', amount: 25, date: '2024-01-28' },
          { category: 'Travel/Mileage', description: '80 miles pickup + delivery', amount: 64, date: '2024-01-15' },
          { category: 'Marketplace Listing Fees', description: 'Craigslist', amount: 5, date: '2024-02-01' },
        ],
        tasksCompleted: 10,
      },
      {
        name: '1998 Johnson 150 V6', type: 'outboard', status: 'Listed',
        year: 1998, make: 'Johnson', model: '150 V6', horsepower: 150,
        purchase_date: '2024-03-10', purchase_price: 800,
        seller: 'Craigslist - Dave T.', location: 'Nashville, TN',
        notes: 'Ran when pulled. Sat for 2 seasons.',
        known_issues: 'Cylinder 3 slightly low compression - monitor',
        listed_price: 1800, listed_date: '2024-04-01', listed_platforms: '["Facebook Marketplace"]',
        sold_price: null, sold_date: null, buyer_name: null, payment_method: null, sale_notes: null,
        expenses: [
          { category: 'Parts', description: 'Carb rebuild kit x3', amount: 87, date: '2024-03-15' },
          { category: 'Parts', description: 'Spark plugs (6)', amount: 36, date: '2024-03-15' },
          { category: 'Gear Oil', description: 'Lower unit oil', amount: 12, date: '2024-03-20' },
          { category: 'Fuel', description: 'Test tank', amount: 18, date: '2024-03-25' },
          { category: 'Travel/Mileage', description: '55mi pickup', amount: 44, date: '2024-03-10' },
        ],
        tasksCompleted: 9,
      },
      {
        name: '2001 Mercury 90 EFI', type: 'outboard', status: 'Repairing',
        year: 2001, make: 'Mercury', model: '90 EFI', horsepower: 90,
        purchase_date: '2024-05-20', purchase_price: 650,
        seller: 'Estate sale', location: 'Cookeville, TN',
        notes: 'Would not start. Suspect fuel system.',
        known_issues: 'No spark on cyl 2. Corroded connectors on harness.',
        listed_price: null, listed_date: null, listed_platforms: '[]',
        sold_price: null, sold_date: null, buyer_name: null, payment_method: null, sale_notes: null,
        expenses: [
          { category: 'Parts', description: 'Fuel filter & VST screen', amount: 28, date: '2024-05-25' },
          { category: 'Parts', description: 'Spark plugs', amount: 24, date: '2024-05-25' },
          { category: 'Travel/Mileage', description: '45mi each way', amount: 72, date: '2024-05-20' },
        ],
        tasksCompleted: 2,
      },
      {
        name: '2010 Tracker 175 TXW + Mercury 60', type: 'bundle', status: 'Purchased',
        year: 2010, make: 'Tracker', model: '175 TXW', horsepower: 60,
        purchase_date: '2024-06-01', purchase_price: 3500,
        seller: 'Facebook - Tom B.', location: 'Sparta, TN',
        notes: 'Complete rig. Motor runs great. Boat needs carpet and wiring.',
        known_issues: 'Carpet torn/stained. Trailer lights need replacing.',
        listed_price: null, listed_date: null, listed_platforms: '[]',
        sold_price: null, sold_date: null, buyer_name: null, payment_method: null, sale_notes: null,
        expenses: [
          { category: 'Parts', description: 'Marine carpet kit', amount: 125, date: '2024-06-08' },
          { category: 'Parts', description: 'Trailer light kit', amount: 35, date: '2024-06-08' },
          { category: 'Travel/Mileage', description: '90mi pickup', amount: 72, date: '2024-06-01' },
        ],
        tasksCompleted: 1,
      },
      {
        name: '2003 Yamaha 40 2-Stroke', type: 'outboard', status: 'Passed',
        year: 2003, make: 'Yamaha', model: '40hp 2-Stroke', horsepower: 40,
        purchase_date: '2024-04-05', purchase_price: 0,
        seller: 'FB Marketplace - Steve', location: 'Murfreesboro, TN',
        notes: 'Drove 30 min to look. Cracked block. Not worth it. Passed.',
        known_issues: 'Cracked block - total loss',
        listed_price: null, listed_date: null, listed_platforms: '[]',
        sold_price: null, sold_date: null, buyer_name: null, payment_method: null, sale_notes: null,
        expenses: [
          { category: 'Travel/Mileage', description: '30mi to inspect', amount: 24, date: '2024-04-05' },
        ],
        tasksCompleted: 0,
      },
    ];

    const outboardTasks = [
      'Compression test', 'Spark test', 'Carb clean/rebuild', 'Lower unit oil change',
      'Water pump/impeller check', 'Prop condition check', 'Shift & throttle check',
      'Test run', 'Photos/videos taken', 'Ready to list',
    ];
    const bundleTasks = [
      'Compression test', 'Spark test', 'Carb clean/rebuild', 'Lower unit oil change',
      'Water pump/impeller check', 'Prop condition check', 'Shift & throttle check', 'Test run',
      'Hull & carpet inspection', 'Trailer lights & bearings', 'Photos/videos taken', 'Ready to list',
    ];

    for (const item of sampleItems) {
      const r = await db.execute({
        sql: `INSERT INTO items (name, type, status, year, make, model, horsepower,
                purchase_date, purchase_price, seller, location, notes, known_issues,
                listed_price, listed_date, listed_platforms,
                sold_price, sold_date, buyer_name, payment_method, sale_notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          item.name, item.type, item.status, item.year, item.make, item.model, item.horsepower,
          item.purchase_date, item.purchase_price, item.seller, item.location, item.notes, item.known_issues,
          item.listed_price, item.listed_date, item.listed_platforms,
          item.sold_price, item.sold_date, item.buyer_name, item.payment_method, item.sale_notes,
        ],
      });
      const id = Number(r.lastInsertRowid);

      for (const e of item.expenses) {
        await db.execute({
          sql: 'INSERT INTO expenses (item_id, category, description, amount, date) VALUES (?, ?, ?, ?, ?)',
          args: [id, e.category, e.description, e.amount, e.date],
        });
      }

      const tasks = item.type === 'bundle' ? bundleTasks : outboardTasks;
      for (const [i, taskName] of tasks.entries()) {
        await db.execute({
          sql: 'INSERT INTO tasks (item_id, name, sort_order, completed) VALUES (?, ?, ?, ?)',
          args: [id, taskName, i, i < item.tasksCompleted ? 1 : 0],
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
