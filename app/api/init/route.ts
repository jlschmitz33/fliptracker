import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'outboard',
        status TEXT NOT NULL DEFAULT 'Looking At',
        year INTEGER,
        make TEXT,
        model TEXT,
        horsepower INTEGER,
        serial_number TEXT,
        purchase_date TEXT,
        purchase_price REAL NOT NULL DEFAULT 0,
        seller TEXT,
        location TEXT,
        notes TEXT,
        known_issues TEXT,
        photos TEXT NOT NULL DEFAULT '[]',
        listed_price REAL,
        listed_date TEXT,
        listed_platforms TEXT NOT NULL DEFAULT '[]',
        buyer_name TEXT,
        buyer_contact TEXT,
        sold_price REAL,
        sold_date TEXT,
        payment_method TEXT,
        sale_notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        date TEXT NOT NULL DEFAULT (date('now')),
        receipts TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        completed_date TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS overhead_expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        date TEXT NOT NULL DEFAULT (date('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
