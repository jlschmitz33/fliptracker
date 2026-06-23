'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const TYPES = ['outboard', 'trolling motor', 'boat', 'trailer', 'bundle'];
const STATUSES = ['Looking At', 'Purchased', 'Repairing', 'Listed'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

export default function NewItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'outboard', status: 'Purchased',
    year: '', make: '', model: '', horsepower: '', serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: '', seller: '', location: '', notes: '', known_issues: '',
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: form.year ? parseInt(form.year) : null,
          horsepower: form.horsepower ? parseFloat(form.horsepower) : null,
          purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : 0,
        }),
      });
      if (res.ok) {
        const item = await res.json();
        router.push(`/inventory/${item.id}`);
      } else {
        alert('Failed to create item. Please try again.');
        setLoading(false);
      }
    } catch {
      alert('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Link href="/inventory" className="text-slate-400 hover:text-slate-600 p-1">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Add New Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div className="col-span-2">
          <Field label="Item Name *">
            <input required type="text" value={form.name} onChange={set('name')}
              placeholder="e.g. 2005 Yamaha F115 or 2010 Tracker 175 + Mercury 60"
              className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select value={form.type} onChange={set('type')} className={inputCls}>
              {TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={set('status')} className={inputCls}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Year">
            <input type="number" value={form.year} onChange={set('year')} placeholder="2005"
              min="1950" max={new Date().getFullYear() + 1} className={inputCls} />
          </Field>

          <Field label="Make / Brand">
            <input type="text" value={form.make} onChange={set('make')}
              placeholder="Yamaha, Mercury, Johnson..." className={inputCls} />
          </Field>

          <Field label="Model">
            <input type="text" value={form.model} onChange={set('model')}
              placeholder="F115, 150 V6..." className={inputCls} />
          </Field>

          <Field label="Horsepower">
            <input type="number" value={form.horsepower} onChange={set('horsepower')}
              placeholder="9.9" min="0" step="0.1" className={inputCls} />
          </Field>

          <Field label="Serial Number">
            <input type="text" value={form.serial_number} onChange={set('serial_number')}
              placeholder="Optional" className={inputCls} />
          </Field>

          <Field label="Purchase Date">
            <input type="date" value={form.purchase_date} onChange={set('purchase_date')}
              className={inputCls} />
          </Field>

          <Field label="Purchase Price ($)">
            <input type="number" value={form.purchase_price} onChange={set('purchase_price')}
              placeholder="0" min="0" step="1" className={inputCls} />
          </Field>

          <Field label="Seller / Source">
            <input type="text" value={form.seller} onChange={set('seller')}
              placeholder="Name or platform" className={inputCls} />
          </Field>
        </div>

        <Field label="Location">
          <input type="text" value={form.location} onChange={set('location')}
            placeholder="City, State" className={inputCls} />
        </Field>

        <Field label="Notes">
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            placeholder="Condition, what runs, what doesn't..."
            className={`${inputCls} resize-none`} />
        </Field>

        <Field label="Known Issues">
          <textarea value={form.known_issues} onChange={set('known_issues')} rows={2}
            placeholder="Problems to address before selling..."
            className={`${inputCls} resize-none`} />
        </Field>

        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
          A repair checklist will be auto-generated based on the item type. You can add or remove tasks after creation.
        </p>

        <div className="flex gap-3 pt-1">
          <Link href="/inventory"
            className="flex-1 text-center border border-slate-200 text-slate-700 py-3 rounded-lg text-sm font-medium hover:bg-slate-50">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
