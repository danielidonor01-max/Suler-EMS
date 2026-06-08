"use client";

import React, { useMemo } from 'react';
import { useAccess } from '@/context/AccessContext';
import { CheckCircle2, XCircle, Clock, TrendingUp, Calendar } from 'lucide-react';

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'WEEKEND';

interface AttendanceRecord {
  date: string;
  dayLabel: string;
  clockIn?: string;
  clockOut?: string;
  hoursWorked?: number;
  status: AttendanceStatus;
}

function generateAttendanceHistory(employeeId: string): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date(2026, 5, 5); // June 5, 2026

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay();
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' });

    if (dow === 0 || dow === 6) {
      records.push({ date: dateStr, dayLabel, status: 'WEEKEND' });
      continue;
    }

    // Deterministic pseudo-random based on date + employeeId
    const seed = (d.getDate() * 17 + d.getMonth() * 7 + (employeeId?.charCodeAt(0) || 3)) % 10;
    let status: AttendanceStatus;
    let clockIn: string | undefined, clockOut: string | undefined, hoursWorked: number | undefined;

    if (seed === 0) {
      status = 'ABSENT';
    } else if (seed === 1) {
      status = 'LEAVE';
    } else if (seed <= 3) {
      status = 'LATE';
      clockIn = '09:12 AM';
      clockOut = '05:30 PM';
      hoursWorked = 8.3;
    } else {
      status = 'PRESENT';
      clockIn = `0${7 + (seed % 2)}:${seed % 3 === 0 ? '45' : '00'} AM`;
      clockOut = '05:30 PM';
      hoursWorked = 9.0 - (seed % 3) * 0.25;
    }
    records.push({ date: dateStr, dayLabel, clockIn, clockOut, hoursWorked, status });
  }
  return records;
}

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  PRESENT: { label: 'Present', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  LATE: { label: 'Late', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  ABSENT: { label: 'Absent', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
  LEAVE: { label: 'On Leave', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  WEEKEND: { label: 'Weekend', icon: Calendar, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' },
};

export default function MyAttendancePage() {
  const { user } = useAccess();
  const records = useMemo(() => generateAttendanceHistory(user?.employeeId || 'EMP-001'), [user?.employeeId]);

  const workDays = records.filter(r => r.status !== 'WEEKEND');
  const presentDays = workDays.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const lateDays = workDays.filter(r => r.status === 'LATE').length;
  const absentDays = workDays.filter(r => r.status === 'ABSENT').length;
  const attendanceRate = workDays.length > 0 ? Math.round((presentDays / workDays.length) * 100) : 0;
  const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

  const displayRecords = records.filter(r => r.status !== 'WEEKEND').reverse();

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Attendance</h1>
          <p className="text-[13px] font-medium text-slate-400 mt-1">
            <span className="text-slate-600 font-bold">{user?.name || 'Employee'}</span> · Last 30 working days · Biometric records
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Attendance Rate', value: `${attendanceRate}%`, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: TrendingUp },
            { label: 'Days Present', value: presentDays, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: CheckCircle2 },
            { label: 'Late Arrivals', value: lateDays, color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock },
            { label: 'Absences', value: absentDays, color: 'text-red-600 bg-red-50 border-red-100', icon: XCircle },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`p-5 rounded-[20px] border ${kpi.color} space-y-3`}>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70">{kpi.label}</p>
                  <Icon className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-3xl font-black">{kpi.value}</p>
              </div>
            );
          })}
        </div>

        {/* Hours Summary */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[24px] p-6 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Total Hours Logged · Last 30 Days</p>
            <p className="text-4xl font-black text-white mt-2">{totalHours.toFixed(1)} <span className="text-xl font-medium text-slate-400">hrs</span></p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Expected</p>
            <p className="text-2xl font-black text-slate-300 mt-2">{workDays.length * 9} hrs</p>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-slate-100">
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Daily Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Date', 'Clock In', 'Clock Out', 'Hours', 'Status'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayRecords.map((rec) => {
                  const cfg = statusConfig[rec.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={rec.date} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-slate-900">{rec.dayLabel}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] text-slate-600 font-medium">{rec.clockIn || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] text-slate-600 font-medium">{rec.clockOut || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-slate-900">{rec.hoursWorked ? `${rec.hoursWorked.toFixed(1)}h` : '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
