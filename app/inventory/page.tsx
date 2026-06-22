'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';

interface Item {
  id: number;
  name: string;
  type: string;
  status: string;
  year?: number;
  make?: string;
  model?: string;
  horsepower?: number;
  purchase_date?: string;
  purchase_price: number;
  total_expenses: number;
  total_cost: number;
  sold_price?: number;
  listed_price?: number;
  task_count: number;
  tasks_completed: number;
}

const STATUSES = ['All', 'Looking At', 'Purchased', 'Repairing', 'Listed', 'Sold', 'Passed'];
const TYPES = ['all', 'outboard', 'boat', 'trailer', 'bundle'];

const STATUS_COLORS: Record<string, string> = {
  'Looking At': 'bg-slate-200 text-slate-700',
  'Purchased': 'bg-blue-100 text-blue-700',
  'Repairing': 'bg-yellow-100 text-yellow-700',
  'Listed': 'bg-purple-100 text-purple-700',
  'Sold': 'bg-green-100 text-green-700',
  'Passed': 'bg-red-100 text-red-700',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (statusFilter !== 'All') p.set('status', statusFilter);
    if (typeFilter !== 'all') p.set('type', typeFilter);
    if (search) p.set('search', search);
    const res = await fetch(`/api/items?${p}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [statusFilter, typeFilter, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <Link href="/inventory/new"
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Item
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, make, model, seller, notes..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
        {TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
              typeFilter === t ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {t === 'all' ? 'All Types' : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="font-medium">No items found</p>
          <Link href="/inventory/new" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            Add your first item →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => {
            const profit = item.sold_price != null ? item.sold_price - item.total_cost : null;
            const roi = profit !== null && item.total_cost > 0 ? (profit / item.total_cost) * 100 : null;
            const taskPct = item.task_count > 0 ? Math.round((item.tasks_completed / item.task_count) * 100) : 0;
            return (
              <Link key={item.id} href={`/inventory/${item.id}`}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-transparent hover:border-blue-100">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">{item.type}</span>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm leading-snug">{item.name}</h3>
                {(item.make || item.year || item.horsepower) && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {[item.year, item.make, item.model, item.horsepower && `${item.horsepower}hp`]
                      .filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Invested</span>
                    <span className="text-slate-700 font-medium">{fmt(item.total_cost)}</span>
                  </div>
                  {item.status === 'Listed' && item.listed_price != null && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Listed for</span>
                      <span className="text-purple-600 font-medium">{fmt(item.listed_price)}</span>
                    </div>
                  )}
                  {profit !== null && (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Profit</span>
                        <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(profit)}</span>
                      </div>
                      {roi !== null && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">ROI</span>
                          <span className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{roi.toFixed(0)}%</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {item.task_count > 0 && item.status !== 'Sold' && item.status !== 'Passed' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Checklist</span>
                      <span>{item.tasks_completed}/{item.task_count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${taskPct}%` }} />
                    </div>
                  </div>
                )}
                {item.purchase_date && (
                  <p className="text-xs text-slate-400 mt-2.5">
                    Purchased {new Date(item.purchase_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
