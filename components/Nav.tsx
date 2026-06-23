'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, PlusCircle, Download, Menu, X, Anchor, Receipt } from 'lucide-react';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/inventory', label: 'Inventory', icon: Package },
    { href: '/inventory/new', label: 'Add Item', icon: PlusCircle },
    { href: '/overhead', label: 'Overhead', icon: Receipt },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/inventory') return pathname === '/inventory';
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-400">
            <Anchor className="w-6 h-6" />
            <span>FlipTracker</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive(href) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <a
              href="/api/export"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors ml-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </a>
          </div>

          <button
            className="sm:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="sm:hidden pb-3 border-t border-slate-700 pt-2 space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium
                  ${isActive(href) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <a
              href="/api/export"
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
