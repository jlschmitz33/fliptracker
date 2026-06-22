'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Edit2, Save, X, Plus, Trash2, Check,
  Camera, DollarSign, Wrench, Tag, AlertTriangle,
} from 'lucide-react';

// ---- Types ----
interface Expense {
  id: number;
  item_id: number;
  category: string;
  description?: string;
  amount: number;
  date: string;
}

interface Task {
  id: number;
  item_id: number;
  name: string;
  completed: number;
  notes?: string;
  sort_order: number;
}

interface Item {
  id: number;
  name: string;
  type: string;
  status: string;
  year?: number;
  make?: string;
  model?: string;
  horsepower?: number;
  serial_number?: string;
  purchase_date?: string;
  purchase_price: number;
  seller?: string;
  location?: string;
  notes?: string;
  known_issues?: string;
  photos: string;
  listed_price?: number;
  listed_date?: string;
  listed_platforms: string;
  buyer_name?: string;
  buyer_contact?: string;
  sold_price?: number;
  sold_date?: string;
  payment_method?: string;
  sale_notes?: string;
  total_expenses: number;
  total_cost: number;
  expenses: Expense[];
  tasks: Task[];
}

// ---- Constants ----
const STATUSES = ['Looking At', 'Purchased', 'Repairing', 'Listed', 'Sold', 'Passed'];
const TYPES = ['outboard', 'boat', 'trailer', 'bundle'];
const PLATFORMS = ['Facebook Marketplace', 'Craigslist', 'eBay', 'OfferUp', 'Boat Trader', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Venmo', 'PayPal', 'Zelle', 'Check', 'Bank Transfer', 'Other'];
const EXPENSE_CATEGORIES = [
  'Parts', 'Fuel', 'Gear Oil', 'Propeller', 'Battery',
  'Registration/Title', 'Tools/Supplies', 'Marketplace Listing Fees',
  'Travel/Mileage', 'Other',
];

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
function fmtDate(s?: string) {
  if (!s) return '—';
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

// ---- Editable Field ----
function EditableField({ label, value, onSave, type = 'text', options }: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  type?: string;
  options?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (!editing) {
    return (
      <div className="flex items-start justify-between group min-h-[36px]">
        <div>
          <p className="text-xs text-slate-400 font-medium">{label}</p>
          <p className="text-sm text-slate-800 mt-0.5">{value || <span className="text-slate-300 italic">—</span>}</p>
        </div>
        <button onClick={() => { setDraft(value); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity mt-0.5 shrink-0">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      {options ? (
        <select value={draft} onChange={e => setDraft(e.target.value)} className={inputCls}>
          <option value="">— none —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3}
          className={`${inputCls} resize-none`} />
      ) : (
        <input type={type} value={draft} onChange={e => setDraft(e.target.value)} className={inputCls} />
      )}
      <div className="flex gap-2 mt-1.5">
        <button onClick={save} className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
          <Save className="w-3 h-3" /> Save
        </button>
        <button onClick={cancel} className="flex items-center gap-1 text-xs text-slate-500 px-2 py-1.5 hover:text-slate-700">
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

// ---- Section wrapper ----
function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">
        <Icon className="w-4 h-4" />
        {title}
      </h2>
      {children}
    </div>
  );
}

// ---- Main Page ----
export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Expense form state
  const [expForm, setExpForm] = useState({ category: 'Parts', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [addingExp, setAddingExp] = useState(false);

  // Task form state
  const [newTaskName, setNewTaskName] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  const fetchItem = useCallback(async () => {
    const res = await fetch(`/api/items/${params.id}`);
    if (!res.ok) { router.push('/inventory'); return; }
    const data = await res.json();
    setItem(data);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  const patch = useCallback(async (fields: Partial<Item>) => {
    const res = await fetch(`/api/items/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      const updated = await res.json();
      setItem(prev => prev ? { ...prev, ...updated, expenses: prev.expenses, tasks: prev.tasks } : null);
    }
  }, [params.id]);

  const deleteItem = async () => {
    if (!confirm('Delete this item and all its data? This cannot be undone.')) return;
    await fetch(`/api/items/${params.id}`, { method: 'DELETE' });
    router.push('/inventory');
  };

  // Expenses
  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.amount || parseFloat(expForm.amount) <= 0) return;
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expForm, item_id: params.id, amount: parseFloat(expForm.amount) }),
    });
    if (res.ok) {
      const exp = await res.json();
      setItem(prev => {
        if (!prev) return null;
        const newTotalExp = prev.total_expenses + exp.amount;
        return { ...prev, expenses: [exp, ...prev.expenses], total_expenses: newTotalExp, total_cost: prev.purchase_price + newTotalExp };
      });
      setExpForm(f => ({ ...f, description: '', amount: '' }));
      setAddingExp(false);
    }
  };

  const deleteExpense = async (id: number, amount: number) => {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    setItem(prev => {
      if (!prev) return null;
      const newTotalExp = prev.total_expenses - amount;
      return { ...prev, expenses: prev.expenses.filter(e => e.id !== id), total_expenses: newTotalExp, total_cost: prev.purchase_price + newTotalExp };
    });
  };

  // Tasks
  const toggleTask = async (task: Task) => {
    const newCompleted = !task.completed;
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newCompleted }),
    });
    if (res.ok) {
      setItem(prev => prev ? {
        ...prev,
        tasks: prev.tasks.map(t => t.id === task.id ? { ...t, completed: newCompleted ? 1 : 0 } : t),
      } : null);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: params.id, name: newTaskName.trim() }),
    });
    if (res.ok) {
      const task = await res.json();
      setItem(prev => prev ? { ...prev, tasks: [...prev.tasks, task] } : null);
      setNewTaskName('');
      setAddingTask(false);
    }
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setItem(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t.id !== id) } : null);
  };

  // Photos
  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('item_id', params.id);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const { url } = await res.json();
      const current = item ? JSON.parse(item.photos || '[]') as string[] : [];
      const newPhotos = [...current, url];
      await patch({ photos: JSON.stringify(newPhotos) });
      setItem(prev => prev ? { ...prev, photos: JSON.stringify(newPhotos) } : null);
    }
    setUploading(false);
  };

  const removePhoto = async (url: string) => {
    const current = item ? JSON.parse(item.photos || '[]') as string[] : [];
    const newPhotos = current.filter(p => p !== url);
    await patch({ photos: JSON.stringify(newPhotos) });
    setItem(prev => prev ? { ...prev, photos: JSON.stringify(newPhotos) } : null);
  };

  // Platform toggle
  const togglePlatform = async (platform: string) => {
    if (!item) return;
    const current = JSON.parse(item.listed_platforms || '[]') as string[];
    const updated = current.includes(platform)
      ? current.filter(p => p !== platform)
      : [...current, platform];
    await patch({ listed_platforms: JSON.stringify(updated) });
    setItem(prev => prev ? { ...prev, listed_platforms: JSON.stringify(updated) } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) return null;

  const photos = JSON.parse(item.photos || '[]') as string[];
  const listedPlatforms = JSON.parse(item.listed_platforms || '[]') as string[];
  const profit = item.sold_price != null ? item.sold_price - item.total_cost : null;
  const roi = profit !== null && item.total_cost > 0 ? (profit / item.total_cost) * 100 : null;
  const daysHeld = item.purchase_date && item.sold_date
    ? Math.round((new Date(item.sold_date).getTime() - new Date(item.purchase_date + 'T12:00:00').getTime()) / 86400000)
    : item.purchase_date
      ? Math.round((Date.now() - new Date(item.purchase_date + 'T12:00:00').getTime()) / 86400000)
      : null;

  const tasksDone = item.tasks.filter(t => t.completed).length;
  const taskPct = item.tasks.length > 0 ? Math.round((tasksDone / item.tasks.length) * 100) : 0;

  // Expense totals by category
  const byCategory = item.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/inventory" className="text-slate-400 hover:text-slate-600 p-1 mt-1 shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
              {item.status}
            </span>
            <span className="text-xs text-slate-400 capitalize">{item.type}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{item.name}</h1>
        </div>
        <button onClick={deleteItem}
          className="text-slate-300 hover:text-red-500 p-1 transition-colors shrink-0" title="Delete item">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Profit / Cost summary */}
      <div className={`rounded-xl p-4 ${profit !== null
        ? profit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        : 'bg-slate-50 border border-slate-200'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-500">Purchase</p>
            <p className="font-bold text-slate-800">{fmt(item.purchase_price)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Expenses</p>
            <p className="font-bold text-slate-800">{fmt(item.total_expenses)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Cost</p>
            <p className="font-bold text-slate-800">{fmt(item.total_cost)}</p>
          </div>
          {profit !== null ? (
            <div>
              <p className="text-xs text-slate-500">Profit</p>
              <p className={`font-bold text-lg ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(profit)}</p>
              {roi !== null && <p className="text-xs text-slate-500">{roi.toFixed(0)}% ROI</p>}
            </div>
          ) : daysHeld !== null ? (
            <div>
              <p className="text-xs text-slate-500">Days Held</p>
              <p className="font-bold text-slate-800">{daysHeld}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Item Info */}
      <Section title="Item Info" icon={Tag}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <EditableField label="Status" value={item.status}
            onSave={v => patch({ status: v })} options={STATUSES} />
          <EditableField label="Type" value={item.type}
            onSave={v => patch({ type: v })} options={TYPES} />
          <EditableField label="Year" value={item.year?.toString() || ''}
            onSave={v => patch({ year: v ? parseInt(v) : undefined })} type="number" />
          <EditableField label="Make / Brand" value={item.make || ''}
            onSave={v => patch({ make: v })} />
          <EditableField label="Model" value={item.model || ''}
            onSave={v => patch({ model: v })} />
          <EditableField label="Horsepower" value={item.horsepower?.toString() || ''}
            onSave={v => patch({ horsepower: v ? parseInt(v) : undefined })} type="number" />
          <EditableField label="Serial Number" value={item.serial_number || ''}
            onSave={v => patch({ serial_number: v })} />
          <EditableField label="Purchase Date" value={item.purchase_date || ''}
            onSave={v => patch({ purchase_date: v })} type="date" />
          <EditableField label="Purchase Price" value={item.purchase_price?.toString() || '0'}
            onSave={v => patch({ purchase_price: parseFloat(v) || 0 })} type="number" />
          <EditableField label="Seller / Source" value={item.seller || ''}
            onSave={v => patch({ seller: v })} />
          <div className="sm:col-span-2">
            <EditableField label="Location" value={item.location || ''}
              onSave={v => patch({ location: v })} />
          </div>
          <div className="sm:col-span-2">
            <EditableField label="Notes" value={item.notes || ''}
              onSave={v => patch({ notes: v })} type="textarea" />
          </div>
          <div className="sm:col-span-2">
            <EditableField label="Known Issues" value={item.known_issues || ''}
              onSave={v => patch({ known_issues: v })} type="textarea" />
          </div>
        </div>
      </Section>

      {/* Photos */}
      <Section title="Photos" icon={Camera}>
        <div className="flex flex-wrap gap-2 mb-3">
          {photos.map(url => (
            <div key={url} className="relative group w-24 h-24 rounded-lg overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removePhoto(url)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-xs gap-1 disabled:opacity-50">
            <Camera className="w-5 h-5" />
            {uploading ? 'Uploading...' : 'Add Photo'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
        <p className="text-xs text-slate-400">Tap "Add Photo" to upload from your device</p>
      </Section>

      {/* Expenses */}
      <Section title="Expenses" icon={DollarSign}>
        {/* Expense form */}
        {addingExp ? (
          <form onSubmit={addExpense} className="bg-slate-50 rounded-lg p-3 mb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}
                className={inputCls}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="Amount ($)" value={expForm.amount} step="0.01" min="0"
                onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
                className={inputCls} required />
            </div>
            <input type="text" placeholder="Description (optional)" value={expForm.description}
              onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}
              className={inputCls} />
            <input type="date" value={expForm.date}
              onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))}
              className={inputCls} />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Add Expense
              </button>
              <button type="button" onClick={() => setAddingExp(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAddingExp(true)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4 font-medium">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        )}

        {/* Category totals */}
        {Object.keys(byCategory).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {Object.entries(byCategory).map(([cat, total]) => (
              <div key={cat} className="bg-slate-50 rounded-lg p-2 text-xs">
                <p className="text-slate-500">{cat}</p>
                <p className="font-semibold text-slate-800">{fmt(total)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Expense list */}
        {item.expenses.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-3">No expenses yet</p>
        ) : (
          <div className="space-y-1">
            {item.expenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 group">
                <div className="min-w-0">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{exp.category}</span>
                  {exp.description && <span className="text-sm text-slate-700 ml-2">{exp.description}</span>}
                  <span className="text-xs text-slate-400 ml-2">{fmtDate(exp.date)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-sm font-semibold text-slate-800">{fmt(exp.amount)}</span>
                  <button onClick={() => deleteExpense(exp.id, exp.amount)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-semibold text-sm">
              <span>Total Expenses</span>
              <span>{fmt(item.total_expenses)}</span>
            </div>
          </div>
        )}
      </Section>

      {/* Repair Checklist */}
      <Section title="Repair Checklist" icon={Wrench}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${taskPct}%` }} />
            </div>
            <span className="text-xs text-slate-500 shrink-0">{tasksDone}/{item.tasks.length}</span>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          {item.tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 py-2 group border-b border-slate-50 last:border-0">
              <button onClick={() => toggleTask(task)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  task.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-slate-300 hover:border-green-400'
                }`}>
                {task.completed ? <Check className="w-3 h-3" /> : null}
              </button>
              <span className={`text-sm flex-1 ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {task.name}
              </span>
              <button onClick={() => deleteTask(task.id)}
                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {addingTask ? (
          <form onSubmit={addTask} className="flex gap-2">
            <input type="text" value={newTaskName} onChange={e => setNewTaskName(e.target.value)}
              placeholder="Task name..." className={`${inputCls} flex-1`} autoFocus />
            <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
              Add
            </button>
            <button type="button" onClick={() => setAddingTask(false)}
              className="px-2 py-2 text-slate-500 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button onClick={() => setAddingTask(true)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </Section>

      {/* Sale Information */}
      <Section title="Sale Information" icon={AlertTriangle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <EditableField label="Listed Price ($)" value={item.listed_price?.toString() || ''}
            onSave={v => patch({ listed_price: v ? parseFloat(v) : undefined })} type="number" />
          <EditableField label="Listed Date" value={item.listed_date || ''}
            onSave={v => patch({ listed_date: v })} type="date" />

          <div className="sm:col-span-2">
            <p className="text-xs text-slate-400 font-medium mb-2">Listed On</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => togglePlatform(p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    listedPlatforms.includes(p)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <EditableField label="Sold Price ($)" value={item.sold_price?.toString() || ''}
            onSave={v => patch({ sold_price: v ? parseFloat(v) : undefined })} type="number" />
          <EditableField label="Sold Date" value={item.sold_date || ''}
            onSave={v => patch({ sold_date: v })} type="date" />
          <EditableField label="Buyer Name" value={item.buyer_name || ''}
            onSave={v => patch({ buyer_name: v })} />
          <EditableField label="Buyer Contact" value={item.buyer_contact || ''}
            onSave={v => patch({ buyer_contact: v })} />
          <EditableField label="Payment Method" value={item.payment_method || ''}
            onSave={v => patch({ payment_method: v })} options={PAYMENT_METHODS} />
          <div className="sm:col-span-2">
            <EditableField label="Sale Notes" value={item.sale_notes || ''}
              onSave={v => patch({ sale_notes: v })} type="textarea" />
          </div>
        </div>

        {/* Profit calculation */}
        {item.sold_price != null && (
          <div className={`mt-4 rounded-lg p-4 ${profit! >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Profit Breakdown</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Sold Price</span>
                <span className="font-medium">{fmt(item.sold_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Purchase Price</span>
                <span className="font-medium text-red-600">− {fmt(item.purchase_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Expenses</span>
                <span className="font-medium text-red-600">− {fmt(item.total_expenses)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-1">
                <span className="font-semibold text-slate-800">Net Profit</span>
                <span className={`font-bold text-lg ${profit! >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {fmt(profit!)}
                </span>
              </div>
              {roi !== null && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>ROI</span>
                  <span>{roi.toFixed(1)}%</span>
                </div>
              )}
              {daysHeld !== null && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Days held</span>
                  <span>{daysHeld} days {profit && daysHeld > 0 ? `(${fmt(profit / daysHeld)}/day)` : ''}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      <div className="pb-6" />
    </div>
  );
}
