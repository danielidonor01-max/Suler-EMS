"use client";

import React, { useState } from 'react';
import {
  Bell, CheckCheck, Trash2, Filter, BellOff,
  Banknote, CalendarCheck, Shield, Zap, AlertTriangle,
  CheckCircle2, Info, Clock, ArrowRight, Settings
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';

// ─── Types ────────────────────────────────────────────────────────────────────
type NotifCategory = 'Payroll' | 'Leave' | 'Security' | 'System' | 'Task';
type NotifSeverity = 'INFO' | 'WARNING' | 'SUCCESS' | 'CRITICAL';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotifCategory;
  severity: NotifSeverity;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const INITIAL_NOTIFS: Notification[] = [
  {
    id: 'n001', title: 'Payroll Cycle Ready for Approval',
    message: 'May 2026 payroll run for Lagos HQ is prepared. Total gross liability: ₦22,500,000.00. Awaiting Super Admin authorization.',
    category: 'Payroll', severity: 'WARNING', timestamp: '2026-05-12T05:00:00Z',
    read: false, actionLabel: 'Review Payroll', actionHref: '/payroll/register'
  },
  {
    id: 'n002', title: 'Leave Request Pending — Alex Okereke',
    message: 'Annual Leave request for 10 Jun – 15 Jun 2026 has been submitted and requires your approval.',
    category: 'Leave', severity: 'INFO', timestamp: '2026-05-11T14:30:00Z',
    read: false, actionLabel: 'View Request', actionHref: '/leave'
  },
  {
    id: 'n003', title: 'Failed Login Attempt Detected',
    message: 'Unauthorized login attempt from IP 45.22.101.88 (unrecognized location). User: unknown@test.com.',
    category: 'Security', severity: 'CRITICAL', timestamp: '2026-05-11T13:45:00Z',
    read: false, actionLabel: 'View Security Log', actionHref: '/settings/security'
  },
  {
    id: 'n004', title: 'Payroll Run Approved',
    message: 'April 2026 payroll run has been approved and disbursed. Total net pay: ₦19,850,000.00.',
    category: 'Payroll', severity: 'SUCCESS', timestamp: '2026-05-11T10:00:00Z',
    read: true, actionLabel: 'View Payslips', actionHref: '/payroll/register'
  },
  {
    id: 'n005', title: 'Integration Error — Email Provider',
    message: 'Connection to SMTP relay (smtp.suler.io) failed. Automated notifications may be delayed.',
    category: 'System', severity: 'CRITICAL', timestamp: '2026-05-10T22:15:00Z',
    read: false, actionLabel: 'Check Integrations', actionHref: '/settings/integrations'
  },
  {
    id: 'n006', title: 'NHF Compliance Reminder',
    message: 'Monthly NHF remittance deadline is in 3 days. Ensure all contributions are submitted to FMBN.',
    category: 'Payroll', severity: 'WARNING', timestamp: '2026-05-10T09:00:00Z',
    read: true, actionLabel: 'Compliance Settings', actionHref: '/settings/compliance'
  },
  {
    id: 'n007', title: 'Leave Request Approved — David Okafor',
    message: 'Sick leave request (06–07 May) has been approved by HR. Leave balance updated accordingly.',
    category: 'Leave', severity: 'SUCCESS', timestamp: '2026-05-09T14:00:00Z',
    read: true
  },
  {
    id: 'n008', title: 'New Employee Onboarded',
    message: 'Blessing Adeyemi has been onboarded to Port Harcourt hub as HR Specialist. Profile is now active.',
    category: 'System', severity: 'INFO', timestamp: '2026-05-08T11:00:00Z',
    read: true, actionLabel: 'View Profile', actionHref: '/staff'
  },
  {
    id: 'n009', title: 'Data Backup Completed',
    message: 'Scheduled system backup completed successfully. Snapshot ID: BCK-20260511-0300. Size: 1.8 GB.',
    category: 'System', severity: 'SUCCESS', timestamp: '2026-05-11T03:00:00Z',
    read: true, actionLabel: 'Data Management', actionHref: '/settings/data'
  },
  {
    id: 'n010', title: 'Pending Task: Salary Review — Q2',
    message: 'The Q2 Salary Review cycle has been opened. Please complete performance assessments for your team.',
    category: 'Task', severity: 'INFO', timestamp: '2026-05-07T08:00:00Z',
    read: false, actionLabel: 'Go to Performance', actionHref: '/performance'
  },
];

const CATEGORIES: (NotifCategory | 'All')[] = ['All', 'Payroll', 'Leave', 'Security', 'System', 'Task'];

const CAT_ICONS: Record<NotifCategory | 'All', React.ElementType> = {
  All: Bell, Payroll: Banknote, Leave: CalendarCheck,
  Security: Shield, System: Zap, Task: CheckCircle2
};

const SEVERITY_CONFIG: Record<NotifSeverity, { icon: React.ElementType; dot: string; bg: string; border: string; text: string }> = {
  INFO:     { icon: Info,          dot: 'bg-indigo-400', bg: 'bg-indigo-50',  border: 'border-indigo-100', text: 'text-indigo-700' },
  SUCCESS:  { icon: CheckCircle2,  dot: 'bg-emerald-400',bg: 'bg-emerald-50', border: 'border-emerald-100',text: 'text-emerald-700' },
  WARNING:  { icon: AlertTriangle, dot: 'bg-amber-400',  bg: 'bg-amber-50',   border: 'border-amber-100',  text: 'text-amber-700' },
  CRITICAL: { icon: AlertTriangle, dot: 'bg-rose-500',   bg: 'bg-rose-50',    border: 'border-rose-100',   text: 'text-rose-700' },
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);
  const [category, setCategory] = useState<NotifCategory | 'All'>('All');
  const [showUnread, setShowUnread] = useState(false);

  const markRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));

  let filtered = notifs;
  if (category !== 'All') filtered = filtered.filter(n => n.category === category);
  if (showUnread) filtered = filtered.filter(n => !n.read);

  const unread = notifs.filter(n => !n.read).length;
  const critical = notifs.filter(n => n.severity === 'CRITICAL' && !n.read).length;

  return (
    <div className="section-breathing max-w-[1200px] mx-auto animate-in space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Bell className="w-3 h-3" />
                Notification Center
              </div>
              {unread > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unread} Unread</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Notifications
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[500px]">
              Real-time alerts for payroll approvals, leave requests, security events, and system activities.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUnread(v => !v)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                showUnread ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              {showUnread ? 'Showing Unread' : 'All Notifications'}
            </button>
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:border-slate-300 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Unread Alerts" value={`${unread}`} variant="tonal-warning" icon={Bell} />
        <MetricCard label="Critical" value={`${critical}`} variant="tonal-danger" icon={AlertTriangle} />
        <MetricCard label="Pending Actions" value={`${notifs.filter(n => n.actionLabel && !n.read).length}`} variant="tonal-info" icon={Clock} />
        <MetricCard label="Total" value={`${notifs.length}`} variant="tonal-info" icon={CheckCircle2} />
      </div>

      {/* ── Category Filter ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(cat => {
          const Icon = CAT_ICONS[cat];
          const count = cat === 'All'
            ? notifs.filter(n => !n.read).length
            : notifs.filter(n => n.category === cat && !n.read).length;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all relative ${
                category === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat}
              {count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  category === cat ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Notifications Feed ────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <BellOff className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">No notifications</p>
          </div>
        ) : (
          filtered.map(notif => {
            const cfg = SEVERITY_CONFIG[notif.severity];
            const Icon = cfg.icon;
            const CatIcon = CAT_ICONS[notif.category];
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-[20px] border p-5 flex items-start gap-4 transition-all ${
                  !notif.read ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-70'
                }`}
                onClick={() => markRead(notif.id)}
              >
                {/* Severity indicator */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.border} border`}>
                  <Icon className={`w-5 h-5 ${cfg.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {!notif.read && <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />}
                        <span className="text-[14px] font-bold text-slate-900">{notif.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{timeAgo(notif.timestamp)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
                        {notif.severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-[12px] font-medium text-slate-500 leading-relaxed mb-3">{notif.message}</p>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <CatIcon className="w-3 h-3" />
                      {notif.category}
                    </span>
                    {notif.actionLabel && (
                      <a
                        href={notif.actionHref}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700 ml-2"
                        onClick={e => e.stopPropagation()}
                      >
                        {notif.actionLabel}
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                      className="ml-auto text-slate-200 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
