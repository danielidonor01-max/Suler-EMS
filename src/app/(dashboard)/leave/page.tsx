"use client";

import React, { useState } from 'react';
import {
  Activity, Plus, Download, ShieldCheck, History, Calendar,
  Clock, ArrowRight, User, Sun, Heart, Baby, Stethoscope,
  CheckCircle2, XCircle, BarChart3, Users, AlertTriangle
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { Drawer } from "@/components/common/Drawer";
import { WorkflowInstance, WorkflowAction } from '@/modules/workflow/domain/workflow.types';
import { WorkflowEngine } from '@/modules/workflow/engine/workflow.engine';
import { LeaveWorkflow } from '@/modules/workflow/definitions/leave.workflow';
import { WorkflowStatusBadge, ApprovalTimeline, WorkflowActionBar } from '@/components/workflow/WorkflowUI';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';

// ─── Types ────────────────────────────────────────────────────────────────────
type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Compassionate Leave' | 'Maternity Leave' | 'Paternity Leave';

const LEAVE_TYPES: { type: LeaveType; icon: React.ElementType; color: string; bg: string; border: string; quota: number; desc: string }[] = [
  { type: 'Annual Leave',       icon: Sun,          color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100', quota: 21, desc: 'Annual recreational leave entitlement per employee.' },
  { type: 'Sick Leave',         icon: Stethoscope,  color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100',   quota: 14, desc: 'Medical / illness-related absence days.' },
  { type: 'Compassionate Leave',icon: Heart,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100',  quota: 5,  desc: 'Granted for bereavement or family emergencies.' },
  { type: 'Maternity Leave',    icon: Baby,         color: 'text-pink-600',    bg: 'bg-pink-50',    border: 'border-pink-100',   quota: 90, desc: '90-day maternity leave per Nigerian labour law.' },
  { type: 'Paternity Leave',    icon: Baby,         color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-100',    quota: 14, desc: '14-day paternity leave entitlement.' },
];

const EMPLOYEES_LEAVE = [
  { name: 'Alex Okereke',     annual: 21, usedAnnual: 8,  sick: 14, usedSick: 2,  comp: 5, usedComp: 0 },
  { name: 'Sarah Williams',   annual: 21, usedAnnual: 12, sick: 14, usedSick: 5,  comp: 5, usedComp: 1 },
  { name: 'David Okafor',     annual: 21, usedAnnual: 5,  sick: 14, usedSick: 7,  comp: 5, usedComp: 0 },
  { name: 'Blessing Adeyemi', annual: 21, usedAnnual: 16, sick: 14, usedSick: 0,  comp: 5, usedComp: 2 },
  { name: 'Kemi Adesanya',    annual: 21, usedAnnual: 3,  sick: 14, usedSick: 1,  comp: 5, usedComp: 0 },
];

// Calendar events for current month
const CALENDAR_EVENTS = [
  { day: 3,  name: 'Alex Okereke',     type: 'Annual Leave',       color: 'bg-indigo-100 text-indigo-700' },
  { day: 3,  name: 'Alex Okereke',     type: 'Annual Leave',       color: 'bg-indigo-100 text-indigo-700' },
  { day: 4,  name: 'Alex Okereke',     type: 'Annual Leave',       color: 'bg-indigo-100 text-indigo-700' },
  { day: 6,  name: 'David Okafor',     type: 'Sick Leave',         color: 'bg-rose-100 text-rose-700' },
  { day: 7,  name: 'David Okafor',     type: 'Sick Leave',         color: 'bg-rose-100 text-rose-700' },
  { day: 10, name: 'Sarah Williams',   type: 'Compassionate Leave',color: 'bg-amber-100 text-amber-700' },
  { day: 15, name: 'Blessing Adeyemi', type: 'Annual Leave',       color: 'bg-indigo-100 text-indigo-700' },
  { day: 16, name: 'Blessing Adeyemi', type: 'Annual Leave',       color: 'bg-indigo-100 text-indigo-700' },
  { day: 20, name: 'Kemi Adesanya',    type: 'Annual Leave',       color: 'bg-indigo-100 text-indigo-700' },
];

const INITIAL_LEAVE_REQUESTS: (WorkflowInstance & { employeeName: string, type: string, dates: string, days: number })[] = [
  {
    id: 'leave-001' as any, workflowId: 'leave-workflow', version: 1,
    currentState: 'SUBMITTED', resourceId: 'res-001' as any,
    employeeName: 'Alex Okereke', type: 'Annual Leave', dates: '10 Jun – 15 Jun', days: 5,
    history: [
      { id: 'audit-001' as any, instanceId: 'leave-001' as any, timestamp: '2024-05-01T10:00:00Z',
        actorId: 'user-emp-001' as any, actorName: 'Alex Okereke', actorRole: 'EMPLOYEE',
        fromState: 'DRAFT', toState: 'SUBMITTED', action: 'SUBMIT', comment: 'Vacation with family in Enugu.' }
    ],
    createdAt: '2024-05-01T10:00:00Z', updatedAt: '2024-05-01T10:00:00Z',
  },
  {
    id: 'leave-002' as any, workflowId: 'leave-workflow', version: 1,
    currentState: 'MANAGER_APPROVED', resourceId: 'res-002' as any,
    employeeName: 'David Okafor', type: 'Sick Leave', dates: '06 May – 07 May', days: 2,
    history: [
      { id: 'a1' as any, instanceId: 'l2' as any, timestamp: '2024-05-01T09:00:00Z', actorId: 'u1' as any, actorName: 'David Okafor', actorRole: 'EMPLOYEE', fromState: 'DRAFT', toState: 'SUBMITTED', action: 'SUBMIT' },
      { id: 'a2' as any, instanceId: 'l2' as any, timestamp: '2024-05-02T14:00:00Z', actorId: 'u2' as any, actorName: 'Segun Manager', actorRole: 'MANAGER', fromState: 'SUBMITTED', toState: 'MANAGER_APPROVED', action: 'APPROVE_MANAGER', comment: 'Approved. Get well soon.' },
    ],
    createdAt: '2024-05-01T09:00:00Z', updatedAt: '2024-05-02T14:00:00Z',
  },
  {
    id: 'leave-003' as any, workflowId: 'leave-workflow', version: 1,
    currentState: 'SUBMITTED', resourceId: 'res-003' as any,
    employeeName: 'Sarah Williams', type: 'Compassionate Leave', dates: '10 May – 10 May', days: 1,
    history: [
      { id: 'a3' as any, instanceId: 'l3' as any, timestamp: '2024-05-09T11:00:00Z', actorId: 'u3' as any, actorName: 'Sarah Williams', actorRole: 'EMPLOYEE', fromState: 'DRAFT', toState: 'SUBMITTED', action: 'SUBMIT', comment: 'Family emergency.' }
    ],
    createdAt: '2024-05-09T11:00:00Z', updatedAt: '2024-05-09T11:00:00Z',
  },
];

const TABS = ['Approval Pipeline', 'Leave Calendar', 'Balance Tracker', 'Leave Types'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function BalanceBar({ used, total, color }: { used: number; total: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(used / total) * 100}%` }} />
      </div>
      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <span>{used} used</span>
        <span>{total - used} left</span>
      </div>
    </div>
  );
}

export default function LeaveRequestsPage() {
  const { user } = useAccess();
  const [requests, setRequests] = useState(INITIAL_LEAVE_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<typeof INITIAL_LEAVE_REQUESTS[0] | null>(null);
  const [tab, setTab] = useState(0);

  const handleAction = (action: WorkflowAction, comment?: string) => {
    if (!selectedRequest) return;
    const result = WorkflowEngine.executeTransition(LeaveWorkflow, {
      instance: selectedRequest,
      actor: { id: user.id as any, name: user.name, role: user.role, permissions: user.permissions },
      action, comment, payload: { comment }
    });
    if (result.success) {
      const updated = { ...selectedRequest, ...result.data };
      setRequests(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
      setSelectedRequest(updated as any);
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

  // Build calendar grid for May 2026 (starts on Friday = index 4)
  const startDay = 4; // May 2026 starts on Friday
  const daysInMonth = 31;
  const calendarCells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7).concat(Array(7 - calendarCells.slice(i, i + 7).length).fill(null)));
  }

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
        <div className="bg-white rounded-[24px] border border-slate-200 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">May 2026</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Team Availability Overview</p>
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: 'Annual', color: 'bg-indigo-400' },
                { label: 'Sick', color: 'bg-rose-400' },
                { label: 'Compassionate', color: 'bg-amber-400' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2">{d}</div>
            ))}
            {weeks.flat().map((day, idx) => {
              const events = day ? CALENDAR_EVENTS.filter(e => e.day === day) : [];
              const isToday = day === 12;
              return (
                <div
                  key={idx}
                  className={`min-h-[80px] rounded-xl p-1.5 border transition-all ${
                    day ? 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50' : 'border-transparent'
                  } ${isToday ? 'bg-indigo-50 border-indigo-200' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-[11px] font-black mb-1.5 ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {events.slice(0, 2).map((e, i) => (
                          <div key={i} className={`${e.color} rounded-md px-1.5 py-0.5 text-[8px] font-bold truncate uppercase`}>
                            {e.name.split(' ')[0]}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <div className="text-[8px] font-bold text-slate-400 pl-1">+{events.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: Balance Tracker ─────────────────────────────────────────── */}
      {tab === 2 && (
        <div className="bg-white rounded-[24px] border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Leave Balance Tracker</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">2026 Entitlement vs Utilization</p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-slate-100 transition-all">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          <div className="space-y-4">
            {EMPLOYEES_LEAVE.map(emp => (
              <div key={emp.name} className="p-5 bg-slate-50 border border-slate-100 rounded-[20px] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-[14px] font-bold text-slate-900">{emp.name}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Annual</span>
                      <span className="text-[10px] font-bold text-slate-600">{emp.usedAnnual}/{emp.annual}</span>
                    </div>
                    <BalanceBar used={emp.usedAnnual} total={emp.annual} color="bg-indigo-400" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Sick</span>
                      <span className="text-[10px] font-bold text-slate-600">{emp.usedSick}/{emp.sick}</span>
                    </div>
                    <BalanceBar used={emp.usedSick} total={emp.sick} color="bg-rose-400" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Compassionate</span>
                      <span className="text-[10px] font-bold text-slate-600">{emp.usedComp}/{emp.comp}</span>
                    </div>
                    <BalanceBar used={emp.usedComp} total={emp.comp} color="bg-amber-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
