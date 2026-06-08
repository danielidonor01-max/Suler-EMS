"use client";

import React, { useMemo, useState } from 'react';
import { useAccess } from '@/context/AccessContext';
import { usePayroll } from '@/context/PayrollContext';
import { useLeave } from '@/context/LeaveContext';
import {
  Clock, CheckCircle2, XCircle, Filter, Search,
  DollarSign, Calendar, ArrowRight, Activity
} from 'lucide-react';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
type RequestType = 'Leave Request' | 'Payroll Run' | 'Salary Advance';

interface TrackerItem {
  id: string;
  type: RequestType;
  description: string;
  submittedAt: string;
  stage: string;
  status: RequestStatus;
  approver: string;
  amount?: number;
}

const statusConfig: Record<RequestStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  PENDING:   { label: 'Pending',   icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
  APPROVED:  { label: 'Approved',  icon: CheckCircle2,  color: 'text-sky-600',    bg: 'bg-sky-50',    border: 'border-sky-100'   },
  REJECTED:  { label: 'Rejected',  icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100'   },
  PROCESSED: { label: 'Processed', icon: CheckCircle2,  color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-100'},
};

const typeIcon: Record<RequestType, React.ElementType> = {
  'Leave Request':  Calendar,
  'Payroll Run':    DollarSign,
  'Salary Advance': DollarSign,
};

const ALL_STATUSES = ['All', 'PENDING', 'APPROVED', 'PROCESSED', 'REJECTED'];

function formatNGN(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);
}

export default function RequestTrackerPage() {
  const { user } = useAccess();
  const { payrollRuns } = usePayroll();
  const { requests: leaveRequests } = useLeave();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const employeeId = user?.employeeId;

  // Build tracker items from real payroll data + real leave requests from context
  const items: TrackerItem[] = useMemo(() => {
    const payrollItems: TrackerItem[] = payrollRuns
      .filter(run => run.entries.some(e => e.employeeId === employeeId))
      .map(run => {
        const entry = run.entries.find(e => e.employeeId === employeeId);
        const statusMap: Record<string, RequestStatus> = {
          DRAFT: 'PENDING', REVIEWED: 'APPROVED', APPROVED: 'APPROVED', PROCESSED: 'PROCESSED'
        };
        return {
          id: run.id,
          type: 'Payroll Run',
          description: `Payroll · ${run.period}`,
          submittedAt: run.createdAt,
          stage: run.status === 'PROCESSED' ? 'Disbursed' : run.status === 'APPROVED' ? 'Finance Approval' : 'HR Review',
          status: statusMap[run.status] || 'PENDING',
          approver: run.status === 'PROCESSED' ? 'Finance Manager' : 'HR Admin',
          amount: entry?.netPay,
        };
      });

    // Leave requests from LeaveContext
    const myLeaveRequests = leaveRequests.filter(r => r.employeeId === employeeId);
    const leaveItems: TrackerItem[] = myLeaveRequests.map(req => {
      let status: RequestStatus = 'PENDING';
      if (req.currentState === 'APPROVED') status = 'APPROVED';
      else if (req.currentState === 'REJECTED') status = 'REJECTED';
      else if (req.currentState === 'CANCELLED') status = 'REJECTED';

      let stage = 'Manager Review';
      if (req.currentState === 'MANAGER_APPROVED') stage = 'HR Review';
      else if (req.currentState === 'APPROVED') stage = 'Completed';
      else if (req.currentState === 'REJECTED') stage = 'Rejected';
      else if (req.currentState === 'CANCELLED') stage = 'Cancelled';

      let approver = 'Manager';
      if (req.currentState === 'MANAGER_APPROVED') approver = 'HR Admin';
      else if (req.currentState === 'APPROVED') {
        const finalApproval = req.history.find(h => h.toState === 'APPROVED');
        approver = finalApproval ? finalApproval.actorName : 'HR Admin';
      } else if (req.currentState === 'REJECTED') {
        const rejectAudit = req.history.find(h => h.toState === 'REJECTED');
        approver = rejectAudit ? rejectAudit.actorName : 'Manager/HR';
      }

      const formattedDates = `${req.startDate} to ${req.endDate}`;

      return {
        id: req.id,
        type: 'Leave Request',
        description: `${req.type} · ${formattedDates}`,
        submittedAt: req.createdAt ? new Date(req.createdAt).toISOString().split('T')[0] : '',
        stage,
        status,
        approver,
      };
    });

    return [...leaveItems, ...payrollItems].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [payrollRuns, leaveRequests, employeeId]);

  const filtered = items.filter(item => {
    const matchStatus = filter === 'All' || item.status === filter;
    const matchSearch = !search || item.description.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pending = items.filter(i => i.status === 'PENDING').length;
  const approved = items.filter(i => i.status === 'APPROVED' || i.status === 'PROCESSED').length;
  const rejected = items.filter(i => i.status === 'REJECTED').length;

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Request Tracker</h1>
          <p className="text-[13px] font-medium text-slate-400 mt-1">
            <span className="text-slate-600 font-bold">{user?.name || 'Employee'}</span> · Live status of all your platform requests
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending Review', value: pending, color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock },
            { label: 'Approved / Processed', value: approved, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
            { label: 'Rejected', value: rejected, color: 'text-red-500 bg-red-50 border-red-100', icon: XCircle },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className={`p-5 rounded-[20px] border ${k.color} space-y-2`}>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70">{k.label}</p>
                  <Icon className="w-4 h-4 opacity-40" />
                </div>
                <p className="text-3xl font-black">{k.value}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="tracker-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID or description…"
              className="w-full pl-11 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {ALL_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === s ? 'bg-slate-900 text-white shadow' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No requests found</h3>
              <p className="text-[13px] text-slate-400 mt-1 max-w-xs">Try adjusting your filter or search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Request', 'Submitted', 'Current Stage', 'Approver', 'Status', 'Amount'].map(h => (
                      <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => {
                    const cfg = statusConfig[item.status];
                    const StatusIcon = cfg.icon;
                    const TypeIcon = typeIcon[item.type];
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                              <TypeIcon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.description}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[12px] font-medium text-slate-500">{item.submittedAt}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            {item.stage}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[12px] text-slate-600">{item.approver}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] font-bold text-slate-900">
                            {item.amount ? formatNGN(item.amount) : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
