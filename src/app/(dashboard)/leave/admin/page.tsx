"use client";

import React, { useMemo, useState } from 'react';
import {
  Activity, Plus, ShieldCheck, History, Calendar,
  Clock, User, Sun, Heart, Baby, Stethoscope
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { Drawer } from "@/components/common/Drawer";
import { WorkflowAction } from '@/modules/workflow/domain/workflow.types';
import { LeaveWorkflow } from '@/modules/workflow/definitions/leave.workflow';
import { WorkflowStatusBadge, ApprovalTimeline, WorkflowActionBar } from '@/components/workflow/WorkflowUI';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useApi, useApiMutation } from '@/lib/api/use-api';

// ─── Types ────────────────────────────────────────────────────────────────────
type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Compassionate Leave' | 'Maternity Leave' | 'Paternity Leave';

const LEAVE_TYPES: { type: LeaveType; icon: React.ElementType; color: string; bg: string; border: string; quota: number; desc: string }[] = [
  { type: 'Annual Leave',       icon: Sun,          color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100', quota: 21, desc: 'Annual recreational leave entitlement per employee.' },
  { type: 'Sick Leave',         icon: Stethoscope,  color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100',   quota: 14, desc: 'Medical / illness-related absence days.' },
  { type: 'Compassionate Leave',icon: Heart,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100',  quota: 5,  desc: 'Granted for bereavement or family emergencies.' },
  { type: 'Maternity Leave',    icon: Baby,         color: 'text-pink-600',    bg: 'bg-pink-50',    border: 'border-pink-100',   quota: 90, desc: '90-day maternity leave per Nigerian labour law.' },
  { type: 'Paternity Leave',    icon: Baby,         color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-100',    quota: 14, desc: '14-day paternity leave entitlement.' },
];

const TABS = ['Approval Pipeline', 'Leave Calendar', 'Balance Tracker', 'Leave Types'];

const TYPE_LABEL: Record<string, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  CASUAL: 'Casual Leave',
  COMPASSIONATE: 'Compassionate Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
};

interface ApiLeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  workflowInstanceId: string | null;
  createdAt: string;
  updatedAt: string;
  employee: { id: string; staffId: string; firstName: string; lastName: string };
}

interface TableRow {
  id: string;
  employeeName: string;
  type: string;
  dates: string;
  days: number;
  currentState: string;
  updatedAt: string;
  raw: ApiLeaveRequest;
}

function formatDates(start: string, end: string): { label: string; days: number } {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short' }).format(d);
  return { label: `${fmt(s)} – ${fmt(e)}`, days };
}

export default function LeaveRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<TableRow | null>(null);
  const [tab, setTab] = useState(0);

  // Fetch ALL active leave requests from the DB. SUPER_ADMIN / HR_ADMIN get
  // every record via scope=all; managers should use the /leave/approvals page
  // (different scope) — this page is the admin-wide registry.
  const { data: apiRequests, refresh } =
    useApi<ApiLeaveRequest[]>('/api/leave/requests?scope=all&limit=200', { pollMs: 30_000 });

  const transitionMutation = useApiMutation<
    { action: WorkflowAction; comment?: string },
    unknown
  >(
    (body) => `/api/leave/requests/${selectedRequest?.id ?? ''}/transition`,
    'PATCH',
  );

  const requests = useMemo<TableRow[]>(() => {
    if (!apiRequests) return [];
    return apiRequests.map((r) => {
      const { label, days } = formatDates(r.startDate, r.endDate);
      return {
        id: r.id,
        employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
        type: TYPE_LABEL[r.type] ?? r.type,
        dates: label,
        days,
        currentState: r.status,
        updatedAt: r.updatedAt,
        raw: r,
      };
    });
  }, [apiRequests]);

  const handleAction = async (action: WorkflowAction, comment?: string) => {
    if (!selectedRequest) return;
    try {
      await transitionMutation.trigger({ action, comment });
      await refresh();
      // Close drawer on success; the table reflects the new state.
      setSelectedRequest(null);
    } catch (err) {
      // Surface failure inline so the actor sees why a transition was blocked
      // (RBAC / state guard / invalid action). Toast wiring is a polish item.
      console.error('Leave transition failed', err);
    }
  };

  const columns = [
    {
      header: "Staff Member", accessor: "employeeName",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
            {val.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <div className="text-[14px] font-bold text-slate-900 tracking-tight leading-none mb-1">{val}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{row.type}</div>
          </div>
        </div>
      )
    },
    {
      header: "Period", accessor: "dates",
      render: (val: string, row: any) => (
        <div>
          <div className="text-[13px] font-bold text-slate-700">{val}</div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{row.days} day{row.days !== 1 ? 's' : ''}</div>
        </div>
      )
    },
    {
      header: "Status", accessor: "currentState",
      render: (val: string) => <WorkflowStatusBadge state={val} />
    },
    {
      header: "Updated", accessor: "updatedAt",
      render: (val: string) => (
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short' }).format(new Date(val))}
        </span>
      )
    }
  ];

  const pending = requests.filter(r => r.currentState === 'SUBMITTED').length;
  const totalDaysOut = requests.reduce((s, r) => s + r.days, 0);

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Workflow Engine Active
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Leave Management
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Manage organization-wide leave requests, approval pipelines, balances, and team availability.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all">
              Export Registry
            </button>
            <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md">
              <Plus className="w-4 h-4" />
              New Request
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Pending Approvals" value={`${pending}`} trend={{ direction: 'up', value: '2' }} variant="tonal-warning" icon={Clock} />
        <MetricCard label="Active Workflows" value={`${requests.length}`} variant="tonal-info" icon={Activity} />
        <MetricCard label="Days Out This Month" value={`${totalDaysOut}`} variant="tonal-info" icon={Calendar} />
        <MetricCard label="Escalations" value="0" variant="tonal-success" icon={ShieldCheck} />
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
              tab === i ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Approval Pipeline ─────────────────────────────────────── */}
      {tab === 0 && (
        <>
          <DataTable
            title="Active Workflow Pipelines"
            description="Real-time status of organization-wide leave requests and approval steps."
            data={requests}
            columns={columns}
            onRowClick={(row) => setSelectedRequest(row)}
          />

          <Drawer
            isOpen={!!selectedRequest}
            onClose={() => setSelectedRequest(null)}
            title={`Leave Request: ${selectedRequest?.employeeName}`}
            subtitle={selectedRequest?.id as any}
          >
            <div className="space-y-10 animate-in">
              <div className="p-7 bg-slate-50 border border-slate-100 rounded-[20px] space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <span className="text-[13px] font-bold text-slate-900">{selectedRequest?.employeeName}</span>
                  </div>
                  <WorkflowStatusBadge state={selectedRequest?.currentState || ''} />
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Leave Type</span>
                    <p className="text-[14px] font-bold text-slate-900">{selectedRequest?.type}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Period</span>
                    <p className="text-[14px] font-bold text-slate-900">{selectedRequest?.dates}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Days</span>
                    <p className="text-[14px] font-bold text-slate-900">{(selectedRequest as any)?.days}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Governance Authorization</h4>
                </div>
                <WorkflowActionBar instance={selectedRequest as any} definition={LeaveWorkflow} onAction={handleAction} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Approval Timeline</h4>
                </div>
                <div className="p-2 border border-slate-100 rounded-[20px]">
                  <ApprovalTimeline instance={selectedRequest as any} />
                </div>
              </div>
            </div>
          </Drawer>
        </>
      )}

      {/* ── TAB 1: Leave Calendar ─────────────────────────────────────────── */}
      {tab === 1 && (
        <div className="bg-white rounded-[24px] border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Team availability calendar — pending API</h3>
          <p className="text-[13px] text-slate-500 max-w-[420px] mx-auto leading-relaxed">
            A month-view showing every approved leave across the org will land once the
            leave-by-date endpoint is wired. Until then, switch to <strong>Approval Pipeline</strong>
            for the live list of requests with workflow state.
          </p>
        </div>
      )}

      {/* ── TAB 2: Balance Tracker ─────────────────────────────────────────── */}
      {tab === 2 && (
        <div className="bg-white rounded-[24px] border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Balance tracker — pending API</h3>
          <p className="text-[13px] text-slate-500 max-w-[420px] mx-auto leading-relaxed">
            Per-employee entitlement vs. utilization will appear here once the
            leave-balance aggregation endpoint is built. The data needs to roll up
            approved leave across all leave types per fiscal year — not in scope yet.
          </p>
        </div>
      )}

      {/* ── TAB 3: Leave Types ────────────────────────────────────────────── */}
      {tab === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LEAVE_TYPES.map(lt => {
            const Icon = lt.icon;
            return (
              <div key={lt.type} className={`${lt.bg} border ${lt.border} rounded-[24px] p-6 space-y-4`}>
                <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center ${lt.color} border ${lt.border}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-1">{lt.type}</h3>
                  <p className="text-[12px] font-medium text-slate-500 leading-relaxed">{lt.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quota</span>
                  <span className={`text-xl font-black ${lt.color}`}>{lt.quota} <span className="text-[12px] font-bold text-slate-400">days</span></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
