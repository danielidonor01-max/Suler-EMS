'use client';

/**
 * System Configuration hub — landing page for /settings.
 *
 * The previous version rendered four placeholder tabs ("General",
 * "Governance & Roles", "Security & Auth", "Alert Protocols") whose
 * content was unimplemented. The actual settings work lives in the four
 * dedicated sub-pages already wired in the sidebar:
 *   /settings/compliance  (compliance & tax)
 *   /settings/security    (security policies)
 *   /settings/integrations (third-party + webhooks)
 *   /settings/data         (export, backup, restore)
 *
 * This page is now a navigation grid that surfaces those four entry
 * points with a one-line description each. No duplicate tabs.
 *
 * Governance / Roles is intentionally not listed here — it lives under
 * /admin/roles + /admin/users (Phase 6.1) which is the correct module
 * for permission management.
 */

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Plug,
  Database,
  ChevronRight,
} from 'lucide-react';
import { PermissionGate } from '@/components/common/PermissionGate';
import { Permissions } from '@/modules/auth/domain/permission.model';

interface SettingsModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  permission?: string;
}

const MODULES: SettingsModule[] = [
  {
    id: 'compliance',
    title: 'Compliance & Tax',
    description: 'PAYE bands, pension rates, NHF / NHIS, CRA. Updates take effect on the next payroll run.',
    icon: ShieldCheck,
    href: '/settings/compliance',
    permission: Permissions.SETTINGS_MANAGE,
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Password policy, session lifetime, IP allowlist, 2FA enforcement, login audit thresholds.',
    icon: Lock,
    href: '/settings/security',
    permission: Permissions.SECURITY_MANAGE,
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Third-party connectors (Slack, payroll vendors, SSO providers) and outbound webhooks.',
    icon: Plug,
    href: '/settings/integrations',
    permission: Permissions.SETTINGS_MANAGE,
  },
  {
    id: 'data',
    title: 'Data Management',
    description: 'Export, backup, restore, retention. Triggers operate against the live database.',
    icon: Database,
    href: '/settings/data',
    permission: Permissions.DATA_MANAGE,
  },
];

export default function SettingsHubPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            System Configuration
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-[14px] text-slate-500 mt-2 max-w-xl">
          Pick a module to configure. Role &amp; permission management lives separately under{' '}
          <Link href="/admin/roles" className="text-indigo-600 font-bold hover:underline">Governance → Roles &amp; Permissions</Link>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES.map((m) => {
          const card = (
            <Link
              key={m.id}
              href={m.href}
              className="group flex items-start gap-4 p-6 bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md rounded-[20px] transition-all"
            >
              <div className="w-11 h-11 rounded-[12px] bg-slate-900 group-hover:bg-indigo-600 flex items-center justify-center text-white shrink-0 transition-colors">
                <m.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">{m.title}</h2>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[12px] text-slate-500 leading-relaxed">{m.description}</p>
              </div>
            </Link>
          );
          if (!m.permission) return card;
          return (
            <PermissionGate key={m.id} permission={m.permission as any} showLocked>
              {card}
            </PermissionGate>
          );
        })}
      </div>
    </div>
  );
}
