"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  User, Briefcase, Banknote, Calendar, Activity, Star,
  CheckSquare, FileText, History, MapPin, Mail, Phone,
  Building2, Shield, ChevronLeft, TrendingUp, Clock,
  Heart, AlertCircle, CreditCard, Users, Award
} from 'lucide-react';
import { useWorkforce } from '@/context/WorkforceContext';
import { formatCurrency } from '@/lib/utils/formatCurrency';

const TABS = [
  { id: 'overview',     label: 'Overview',      icon: User },
  { id: 'biodata',      label: 'Biodata',        icon: Heart },
  { id: 'employment',   label: 'Employment',     icon: Briefcase },
  { id: 'compensation', label: 'Compensation',   icon: Banknote },
  { id: 'attendance',   label: 'Attendance',     icon: Calendar },
  { id: 'leave',        label: 'Leave',          icon: Clock },
  { id: 'performance',  label: 'Performance',    icon: Star },
  { id: 'tasks',        label: 'Tasks & Teams',  icon: CheckSquare },
  { id: 'audit',        label: 'Audit Timeline', icon: History },
];

const MOCK_ATTENDANCE = [
  { month: 'Jan', present: 22, absent: 0, late: 1 },
  { month: 'Feb', present: 19, absent: 1, late: 0 },
  { month: 'Mar', present: 23, absent: 0, late: 2 },
  { month: 'Apr', present: 20, absent: 0, late: 0 },
  { month: 'May', present: 9,  absent: 0, late: 1 },
];

const MOCK_LEAVE_HISTORY = [
  { type: 'Annual Leave', dates: '10–14 Mar 2026', days: 5, status: 'APPROVED' },
  { type: 'Sick Leave',   dates: '07 Feb 2026',    days: 1, status: 'APPROVED' },
  { type: 'Annual Leave', dates: '20–24 Jan 2026', days: 5, status: 'APPROVED' },
];

const MOCK_TASKS = [
  { title: 'Q2 Delivery Roadmap', team: 'Engineering Core', status: 'IN_PROGRESS', due: '2026-05-31' },
  { title: 'Code Review Sprint 14', team: 'Engineering Core', status: 'COMPLETE',   due: '2026-05-10' },
  { title: 'Security Audit Integration', team: 'Platform Squad', status: 'PENDING', due: '2026-06-15' },
];

const MOCK_AUDIT = [
  { action: 'IDENTITY_MUTATED',  detail: 'Phone number updated',           actor: 'Linda Blair',    ts: '2026-05-08T11:00:00Z' },
  { action: 'RANK_PROMOTION',    detail: 'Promoted to Software Engineer',  actor: 'Rachel Meyer',   ts: '2026-04-01T09:00:00Z' },
  { action: 'ROLE_ASSIGNED',     detail: 'Role set to Staff Practitioner', actor: 'System',         ts: '2022-03-15T08:00:00Z' },
  { action: 'MEMBER_ONBOARDED',  detail: 'Employee provisioned in system', actor: 'Super Admin',    ts: '2022-03-15T07:50:00Z' },
];

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex flex-col gap-0.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-[13px] font-bold text-slate-900">{value || '—'}</span>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    INACTIVE: 'bg-rose-50 text-rose-700 border-rose-100',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    COMPLETE: 'bg-slate-100 text-slate-600 border-slate-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${map[status] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { employees } = useWorkforce();
  const [tab, setTab] = useState('overview');

  const employee = employees.find(e => e.id === params.id);

  if (!employee) {
    return (
      <div className="section-breathing flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <p className="text-[14px] font-bold text-slate-500">Employee not found</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider">
          Go Back
        </button>
      </div>
    );
  }

  const initials = employee.name.split(' ').map(n => n[0]).join('');
  const tenure = employee.startDate
    ? Math.floor((Date.now() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null;

  // Derived statutory deductions (mock based on salary)
  const grossMonthly = employee.salary || 0;
  const pension = grossMonthly * 0.08;
  const nhf = grossMonthly * 0.025;
  const paye = grossMonthly > 300000 ? (grossMonthly - 300000) * 0.12 + 18000 : grossMonthly * 0.07;
  const netPay = grossMonthly - pension - nhf - paye;

  return (
    <div className="section-breathing max-w-[1400px] mx-auto animate-in space-y-8">

      {/* ── Back + Hero ───────────────────────────────────────────────────── */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Workforce
      </button>

      <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black tracking-tight shrink-0">
            {initials}
          </div>

          {/* Identity */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{employee.name}</h1>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              {employee.designation} · {employee.department}
            </p>
            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{employee.hub}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{employee.email}</span>
              {employee.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{employee.phone}</span>}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 rounded-2xl p-5 shrink-0">
            {[
              { label: 'Grade',   value: employee.grade || '—' },
              { label: 'Tenure',  value: tenure !== null ? `${tenure}y` : '—' },
              { label: 'Rating',  value: employee.performanceRating ? `${employee.performanceRating}/5` : '—' },
              { label: 'Contract',value: employee.contractType || '—' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-[16px] font-black text-slate-900">{s.value}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ────────────────────────────────────────────────────── */}

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[20px] border border-slate-200 p-6">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Operational Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Employee ID" value={employee.id} />
                <InfoRow label="Department" value={employee.department} />
                <InfoRow label="Hub" value={employee.hub} />
                <InfoRow label="Reports To" value={employee.reportingManager} />
                <InfoRow label="Start Date" value={employee.startDate ? new Date(employee.startDate).toLocaleDateString('en-NG', { day:'2-digit', month:'long', year:'numeric' }) : undefined} />
                <InfoRow label="Monthly Gross" value={formatCurrency(employee.salary || 0)} />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Leave Snapshot</h3>
              {[
                { label: 'Annual', used: 21 - (employee.annualLeaveBalance || 21), total: 21, color: 'bg-indigo-400' },
                { label: 'Sick',   used: 14 - (employee.sickLeaveBalance || 14),   total: 14, color: 'bg-rose-400' },
              ].map(l => (
                <div key={l.label}>
                  <div className="flex justify-between text-[10px] font-bold mb-1.5">
                    <span className="text-slate-500 uppercase tracking-widest">{l.label}</span>
                    <span className="text-slate-700">{l.used}/{l.total} used</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${l.color} rounded-full`} style={{ width: `${(l.used/l.total)*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-3">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Performance</h3>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">{employee.performanceRating?.toFixed(1)}<span className="text-xl text-slate-300">/5</span></div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= Math.round(employee.performanceRating || 0) ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BIODATA */}
      {tab === 'biodata' && (
        <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-6">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoRow label="Full Name" value={employee.name} />
            <InfoRow label="Work Email" value={employee.email} />
            <InfoRow label="Mobile" value={employee.phone} />
            <InfoRow label="Home Address" value={employee.address} />
            <InfoRow label="Emergency Contact" value={employee.emergencyContact} />
            <InfoRow label="National ID (NIN)" value={employee.nationalId} />
          </div>
        </div>
      )}

      {/* EMPLOYMENT */}
      {tab === 'employment' && (
        <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-6">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoRow label="Employee ID" value={employee.id} />
            <InfoRow label="Contract Type" value={employee.contractType} />
            <InfoRow label="Grade / Band" value={employee.grade} />
            <InfoRow label="Department" value={employee.department} />
            <InfoRow label="Operational Hub" value={employee.hub} />
            <InfoRow label="Reporting Manager" value={employee.reportingManager} />
            <InfoRow label="Start Date" value={employee.startDate ? new Date(employee.startDate).toLocaleDateString('en-NG', {day:'2-digit',month:'long',year:'numeric'}) : undefined} />
            <InfoRow label="Tenure" value={tenure !== null ? `${tenure} year${tenure !== 1 ? 's' : ''}` : undefined} />
            <InfoRow label="Role Classification" value={employee.role} />
          </div>
        </div>
      )}

      {/* COMPENSATION */}
      {tab === 'compensation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Monthly Gross', value: formatCurrency(grossMonthly), color: 'text-slate-900' },
              { label: 'Monthly Net',   value: formatCurrency(netPay),       color: 'text-emerald-600' },
              { label: 'PAYE',          value: formatCurrency(paye),         color: 'text-amber-600' },
              { label: 'Pension (8%)',  value: formatCurrency(pension),      color: 'text-indigo-600' },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-[20px] border border-slate-200 p-5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                <p className={`text-xl font-black tracking-tight ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Statutory Deductions Breakdown</h3>
            {[
              { label: 'Pension (Employee 8%)', value: pension },
              { label: 'NHF (2.5%)',            value: nhf },
              { label: 'PAYE Tax',              value: paye },
            ].map(d => (
              <div key={d.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[12px] font-bold text-slate-700">{d.label}</span>
                <span className="text-[13px] font-black text-slate-900">{formatCurrency(d.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl">
              <span className="text-[12px] font-bold text-white">Net Monthly Pay</span>
              <span className="text-[15px] font-black text-white">{formatCurrency(netPay)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <InfoRow label="Bank Account" value={employee.bankAccount} />
              <InfoRow label="Pension Fund Administrator" value={employee.pfaName} />
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE */}
      {tab === 'attendance' && (
        <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-6">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Attendance Summary — 2026</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Month', 'Present', 'Absent', 'Late', 'Rate'].map(h => (
                    <th key={h} className="text-left pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_ATTENDANCE.map(row => {
                  const total = row.present + row.absent;
                  const rate = total > 0 ? Math.round((row.present / total) * 100) : 100;
                  return (
                    <tr key={row.month}>
                      <td className="py-3 font-bold text-slate-900 text-[13px]">{row.month}</td>
                      <td className="py-3 text-emerald-600 font-bold text-[13px]">{row.present}</td>
                      <td className="py-3 text-rose-600 font-bold text-[13px]">{row.absent}</td>
                      <td className="py-3 text-amber-600 font-bold text-[13px]">{row.late}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAVE */}
      {tab === 'leave' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Annual Balance', value: employee.annualLeaveBalance ?? 21, total: 21, color: 'text-indigo-600' },
              { label: 'Sick Balance',   value: employee.sickLeaveBalance ?? 14,   total: 14, color: 'text-rose-600' },
              { label: 'Compassionate', value: 5, total: 5, color: 'text-amber-600' },
            ].map(l => (
              <div key={l.label} className="bg-white rounded-[20px] border border-slate-200 p-5 text-center">
                <p className={`text-3xl font-black tracking-tighter ${l.color}`}>{l.value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{l.label}</p>
                <p className="text-[10px] font-bold text-slate-300 mt-0.5">of {l.total} days</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Leave History</h3>
            {MOCK_LEAVE_HISTORY.map((l, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[13px] font-bold text-slate-900">{l.type}</p>
                  <p className="text-[11px] font-bold text-slate-400">{l.dates} · {l.days} day{l.days !== 1 ? 's' : ''}</p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PERFORMANCE */}
      {tab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'KPI Score',     value: `${Math.round((employee.performanceRating || 3) * 20)}%` },
              { label: 'Manager Rating',value: `${employee.performanceRating?.toFixed(1)}/5` },
              { label: 'Review Cycle',  value: 'Q1 2026' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-[20px] border border-slate-200 p-5 text-center">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{s.value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">KPI Metrics</h3>
            {[
              { label: 'Delivery Rate',    score: Math.round((employee.performanceRating || 3) * 19) },
              { label: 'Collaboration',    score: Math.round((employee.performanceRating || 3) * 18) },
              { label: 'Communication',    score: Math.round((employee.performanceRating || 3) * 17) },
              { label: 'Innovation Index', score: Math.round((employee.performanceRating || 3) * 20) },
            ].map(k => (
              <div key={k.label} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500 uppercase tracking-widest">{k.label}</span>
                  <span className="text-slate-700">{Math.min(k.score, 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.min(k.score,100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TASKS & TEAMS */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Tasks</h3>
            {MOCK_TASKS.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[13px] font-bold text-slate-900">{t.title}</p>
                  <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Users className="w-3 h-3" />{t.team} · Due {new Date(t.due).toLocaleDateString('en-NG', {day:'2-digit',month:'short'})}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT TIMELINE */}
      {tab === 'audit' && (
        <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Audit Timeline</h3>
          <div className="relative pl-6 space-y-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-100" />
            {MOCK_AUDIT.map((a, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-indigo-400 border-2 border-white" />
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{a.action.replace(/_/g,' ')}</span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(a.ts).toLocaleDateString('en-NG', {day:'2-digit',month:'short',year:'numeric'})}
                    </span>
                  </div>
                  <p className="text-[13px] font-bold text-slate-900">{a.detail}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">By: {a.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
