'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package,
  Trophy, AlertCircle, Plus,
} from 'lucide-react';

interface Stats {
  totalSales: number;
  totalProfit: number;
  unsoldValue: number;
  soldCount: number;
  activeCount: number;
  bestFlip: { name: string; profit: number; roi: number } | null;
  worstFlip: { name: string; profit: number; roi: number } | null;
  avgProfit: number;
  avgRoi: number;
  avgDays: number;
  monthly: Array<{ month: string; profit: number; revenue: number; count: number }>;
}

interface Item {
  id: number;
  name: string;
  type: string;
  status: string;
  purchase_price: number;
  total_cost: number;
  sold_price?: number;
  listed_price?: number;
  purchase_date?: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Looking At': 'bg-slate-200 text-slate-700',
  'Purchased': 'bg-blue-100 text-blue-700',
  'Repairing': 'bg-yellow-100 text-yellow-700',
  'Listed': 'bg-purple-100 text-purple-700',
  'Sold': 'bg-green-100 text-green-700',
  'Passed': 'bg-red-100 text-red-700',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}

function KpiCard({
  label, value, sub, color = 'blue', icon: Icon,
}: {
  label: string; value: string; sub?: string; color?: string; icon: React.ElementType;
}) {
  const cls: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-3">
      <div className={`p-2.5 rounded-lg ${cls[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide truncate">{label}</p>
        <p className={`text-xl font-bold ${cls[color].split(' ')[0]}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/items').then(r => r.json()),
    ]).then(([s, i]) => {
      setStats(s);
      setItems(Array.isArray(i) ? i : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSeed = async () => {
    if (!confirm('Load sample data? This will delete all existing data.')) return;
    await fetch('/api/seed', { method: 'POST' });
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const monthlyData = (stats?.monthly || []).map(m => ({
    ...m,
    label: new Date(m.month + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
  }));

  const recentItems = items.slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex gap-2">
          {items.length === 0 && (
            <button onClick={handleSeed} className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-300">
              Load Sample Data
            </button>
          )}
          <Link href="/inventory/new" className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Item
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Profit" value={fmt(stats?.totalProfit || 0)}
          sub={`${stats?.soldCount || 0} sold`} color="green" icon={TrendingUp} />
        <KpiCard label="Total Sales" value={fmt(stats?.totalSales || 0)}
          sub={`avg ${fmt(stats?.avgProfit || 0)}/flip`} color="blue" icon={DollarSign} />
        <KpiCard label="Unsold Inventory" value={fmt(stats?.unsoldValue || 0)}
          sub={`${stats?.activeCount || 0} active items`} color="orange" icon={Package} />
        <KpiCard label="Avg ROI" value={`${(stats?.avgRoi || 0).toFixed(0)}%`}
          sub={`~${Math.round(stats?.avgDays || 0)} days avg hold`} color="purple" icon={Trophy} />
      </div>

      {/* Best / Worst */}
      {(stats?.bestFlip || stats?.worstFlip) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats?.bestFlip && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1 mb-1">
                <Trophy className="w-3.5 h-3.5" /> Best Flip
              </p>
              <p className="font-semibold text-slate-800 text-sm leading-snug">{stats.bestFlip.name}</p>
              <p className="text-green-700 font-bold text-lg">{fmt(stats.bestFlip.profit)}</p>
              <p className="text-green-600 text-xs">{stats.bestFlip.roi.toFixed(0)}% ROI</p>
            </div>
          )}
          {stats?.worstFlip && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide flex items-center gap-1 mb-1">
                <TrendingDown className="w-3.5 h-3.5" /> Worst Flip
              </p>
              <p className="font-semibold text-slate-800 text-sm leading-snug">{stats.worstFlip.name}</p>
              <p className="text-red-700 font-bold text-lg">{fmt(stats.worstFlip.profit)}</p>
              <p className="text-red-600 text-xs">{stats.worstFlip.roi.toFixed(0)}% ROI</p>
            </div>
          )}
        </div>
      )}

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Monthly Profit</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip
                formatter={(v: number) => [fmt(v), 'Profit']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, i) => (
                  <Cell key={i} fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">Recent Items</h2>
          <Link href="/inventory" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-500">No items yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your first item or load sample data</p>
            <div className="flex gap-3 justify-center mt-5">
              <Link href="/inventory/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                Add Item
              </Link>
              <button onClick={handleSeed} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-300">
                Load Sample Data
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentItems.map(item => {
              const profit = item.sold_price != null ? item.sold_price - item.total_cost : null;
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
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Invested</span>
                      <span className="text-slate-600 font-medium">{fmt(item.total_cost)}</span>
                    </div>
                    {item.status === 'Listed' && item.listed_price != null && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Listed</span>
                        <span className="text-purple-600 font-medium">{fmt(item.listed_price)}</span>
                      </div>
                    )}
                    {profit !== null && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Profit</span>
                        <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fmt(profit)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
