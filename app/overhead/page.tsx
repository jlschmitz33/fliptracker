'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Receipt } from 'lucide-react';

interface OverheadExpense {
  id: number;
  category: string;
  description?: string;
  amount: number;
  date: string;
}

const CATEGORIES = [
  'Gas/Fuel', 'Oil & Lubricants', 'Tools', 'Wiring/Parts',
  'Storage/Shop Rent', 'Phone/Internet', 'Insurance', 'Marketing', 'Other',
];

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
function fmtDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function OverheadPage() {
  const [expenses, setExpenses] = useState<OverheadExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    category: 'Gas/Fuel',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchExpenses = useCallback(async () => {
    const res = await fetch('/api/overhead');
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    const res = await fetch('/api/overhead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (res.ok) {
      const exp = await res.json();
      setExpenses(prev => [exp as OverheadExpense, ...prev]);
      setForm(f => ({ ...f, description: '', amount: '' }));
      setAdding(false);
    }
  };

  const deleteExpense = async (id: number) => {
    await fetch(`/api/overhead/${id}`, { method: 'DELETE' });
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  // Group by month
  const byMonth = expenses.reduce<Record<string, OverheadExpense[]>>((acc, e) => {
    const month = e.date.slice(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(e);
    return acc;
  }, {});

  const months = Object.keys(byMonth).sort().reverse();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overhead Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">Business costs not tied to a specific item</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Total card */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
        <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
          <Receipt className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Total Overhead</p>
          <p className="text-2xl font-bold text-slate-900">{fmt(total)}</p>
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">By Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amt]) => (
                <div key={cat} className="bg-slate-50 rounded-lg p-2.5 text-xs">
                  <p className="text-slate-500">{cat}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{fmt(amt)}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">New Overhead Expense</h2>
          <form onSubmit={addExpense} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Amount ($)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" min="0" step="0.01" className={inputCls} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description (optional)</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Gas to pick up motor in Lansing" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
                Save Expense
              </button>
              <button type="button" onClick={() => setAdding(false)}
                className="px-4 py-2.5 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense list grouped by month */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="font-medium">No overhead expenses yet</p>
          <p className="text-sm mt-1">Track gas, tools, shop costs, etc.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {months.map(month => {
            const monthExpenses = byMonth[month];
            const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
            const label = new Date(month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return (
              <div key={month} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
                  <span className="text-sm font-bold text-slate-800">{fmt(monthTotal)}</span>
                </div>
                <div className="space-y-1">
                  {monthExpenses.map(exp => (
                    <div key={exp.id} className="flex items-center justify-between py-2 group border-b border-slate-50 last:border-0">
                      <div className="min-w-0">
                        <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-medium">
                          {exp.category}
                        </span>
                        {exp.description && (
                          <span className="text-sm text-slate-700 ml-2">{exp.description}</span>
                        )}
                        <span className="text-xs text-slate-400 ml-2">{fmtDate(exp.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-sm font-semibold text-slate-800">{fmt(exp.amount)}</span>
                        <button onClick={() => deleteExpense(exp.id)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pb-6" />
    </div>
  );
}
