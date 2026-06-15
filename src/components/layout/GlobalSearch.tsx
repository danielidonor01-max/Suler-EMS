'use client';

/**
 * Header global search.
 *
 * Searches in real time across:
 *   - MODULES   the static list of routes that live in the sidebar
 *   - PEOPLE    employees from WorkforceContext (sourced from /api/employees)
 *   - HUBS      operational hubs from OrganizationContext
 *
 * Results render as a grouped dropdown directly under the input. Arrow
 * keys navigate, Enter opens, Esc clears, click outside dismisses.
 * Cmd/Ctrl+K from any page focuses the input.
 *
 * Intentionally NOT the same surface as the command palette (which is a
 * modal for quick actions). This is a navigation index — typing "lagos"
 * should jump to the Lagos hub, typing a name should open that person's
 * profile, typing "audit" should land on the Audit Registry.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Command,
  Building2,
  Users,
  LayoutDashboard,
  MessageSquare,
  Bell,
  CheckSquare,
  Calendar,
  Activity,
  Wallet,
  TrendingUp,
  UserCircle,
  DollarSign,
  ShieldCheck,
  History,
  Cpu,
  Lock,
  Plug,
  Database,
  Settings,
  X,
} from 'lucide-react';
import { useWorkforce } from '@/context/WorkforceContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useDismiss } from '@/lib/hooks/use-dismiss';

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  group: 'Modules' | 'People' | 'Hubs';
  icon: React.ComponentType<{ className?: string }>;
}

// Mirrors the sidebar layout. Keep in sync when sidebar entries change.
const MODULES = [
  { name: 'Dashboard',           href: '/',                       icon: LayoutDashboard, keywords: 'home overview' },
  { name: 'My Profile',          href: '/profile',                icon: UserCircle,      keywords: 'me account personal' },
  { name: 'Messages',            href: '/messages',               icon: MessageSquare,   keywords: 'chat dm broadcast inbox' },
  { name: 'Notifications',       href: '/notifications',          icon: Bell,            keywords: 'alerts' },
  { name: 'My Tasks',            href: '/tasks',                  icon: CheckSquare,     keywords: 'todo todos' },
  { name: 'Attendance',          href: '/attendance',             icon: Calendar,        keywords: 'check in out clock' },
  { name: 'Leave Requests',      href: '/leave',                  icon: Activity,        keywords: 'vacation absence pto' },
  { name: 'My Payroll',          href: '/my-payroll',             icon: Wallet,          keywords: 'salary payslip pay' },
  { name: 'Request Tracker',     href: '/tracker',                icon: TrendingUp,      keywords: 'history status workflow' },
  { name: 'Workforce Registry',  href: '/employees',              icon: Building2,       keywords: 'employees staff register' },
  { name: 'Team Management',     href: '/team',                   icon: Users,           keywords: 'org chart hierarchy' },
  { name: 'Attendance Admin',    href: '/attendance/admin',       icon: Calendar,        keywords: 'attendance management' },
  { name: 'Leave Admin',         href: '/leave/admin',            icon: Activity,        keywords: 'approve leave manage' },
  { name: 'Payroll Admin',       href: '/payroll',                icon: Wallet,          keywords: 'salary runs admin' },
  { name: 'Finance',             href: '/finance',                icon: DollarSign,      keywords: 'expenses budget approvals' },
  { name: 'Command Center',      href: '/admin/ecc',              icon: Cpu,             keywords: 'system health monitor' },
  { name: 'Organization',        href: '/admin/organization',     icon: Building2,       keywords: 'hubs departments structure' },
  { name: 'Roles & Permissions', href: '/admin/roles',            icon: ShieldCheck,     keywords: 'rbac access iam' },
  { name: 'Users',               href: '/admin/users',            icon: UserCircle,      keywords: 'accounts admin' },
  { name: 'Audit Registry',      href: '/governance',             icon: History,         keywords: 'logs audit activity' },
  { name: 'Compliance & Tax',    href: '/settings/compliance',    icon: ShieldCheck,     keywords: 'paye nhf nsitf tin' },
  { name: 'Security',            href: '/settings/security',      icon: Lock,            keywords: '2fa sessions password' },
  { name: 'Integrations',        href: '/settings/integrations',  icon: Plug,            keywords: 'webhooks api connect' },
  { name: 'Data Management',     href: '/settings/data',          icon: Database,        keywords: 'export backup csv' },
  { name: 'My Preferences',      href: '/preferences',            icon: Settings,        keywords: 'theme dark light account' },
];

export const GlobalSearch: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { employees } = useWorkforce();
  const { hubs } = useOrganization();

  useDismiss(wrapperRef, () => setIsOpen(false), isOpen);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const modules: SearchResult[] = MODULES
      .filter(m => m.name.toLowerCase().includes(q) || m.keywords.includes(q))
      .slice(0, 5)
      .map((m, i) => ({
        id: `mod-${i}`,
        label: m.name,
        href: m.href,
        group: 'Modules',
        icon: m.icon,
      }));

    const people: SearchResult[] = employees
      .filter(e => {
        const name = (e.name ?? '').toLowerCase();
        const email = (e.email ?? '').toLowerCase();
        const role = ((e as any).jobTitle ?? (e as any).role ?? '').toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q);
      })
      .slice(0, 6)
      .map(e => ({
        id: `emp-${e.id}`,
        label: e.name,
        sublabel: [(e as any).jobTitle ?? (e as any).role, e.email].filter(Boolean).join(' · '),
        href: `/staff/${e.id}`,
        group: 'People',
        icon: UserCircle,
      }));

    const hubResults: SearchResult[] = hubs
      .filter(h => {
        const name = (h.name ?? '').toLowerCase();
        const category = ((h as any).category ?? '').toLowerCase();
        return name.includes(q) || category.includes(q);
      })
      .slice(0, 4)
      .map(h => ({
        id: `hub-${h.id}`,
        label: h.name,
        sublabel: (h as any).category,
        href: '/admin/organization',
        group: 'Hubs',
        icon: Building2,
      }));

    return [...modules, ...people, ...hubResults];
  }, [query, employees, hubs]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const go = (href: string) => {
    setQuery('');
    setIsOpen(false);
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      go(results[activeIdx].href);
    }
  };

  // Cmd/Ctrl+K from anywhere focuses the search input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const grouped = useMemo(() => {
    const g: Record<'Modules' | 'People' | 'Hubs', SearchResult[]> = { Modules: [], People: [], Hubs: [] };
    results.forEach(r => g[r.group].push(r));
    return g;
  }, [results]);

  return (
    <div ref={wrapperRef} className="hidden lg:flex relative w-full max-w-[640px] items-center">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKey}
        placeholder="Search modules, people, hubs…"
        aria-label="Global search"
        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-300 rounded-[12px] py-2.5 pl-12 pr-16 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
      />
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => { setQuery(''); inputRef.current?.focus(); }}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-400 pointer-events-none">
          <Command className="w-2.5 h-2.5" />
          K
        </div>
      )}

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-overlay overflow-hidden z-50 max-h-[480px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
          {results.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <span className="text-[12px] font-bold text-slate-400">No results for &ldquo;{query}&rdquo;</span>
            </div>
          ) : (
            (['Modules', 'People', 'Hubs'] as const).map(group => {
              const items = grouped[group];
              if (items.length === 0) return null;
              return (
                <div key={group} className="border-b border-slate-50 last:border-b-0">
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{group}</span>
                  </div>
                  {items.map(r => {
                    const idx = results.indexOf(r);
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => go(r.href)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          idx === activeIdx ? 'bg-indigo-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          idx === activeIdx ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <r.icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[12px] font-bold text-slate-900 truncate">{r.label}</span>
                          {r.sublabel && (
                            <span className="text-[10px] text-slate-400 truncate font-medium">{r.sublabel}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
