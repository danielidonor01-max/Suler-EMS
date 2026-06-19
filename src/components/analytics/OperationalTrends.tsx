"use client";

import React from 'react';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

export interface TrendsPoint {
  date:       string; // YYYY-MM-DD
  compliance: number; // %
  throughput: number; // count
}

interface Props {
  data: TrendsPoint[];
}

function fmtDay(iso: string): string {
  // YYYY-MM-DD → "Mon 17". Keeps the X-axis compact at small widths.
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'short', day: '2-digit', timeZone: 'UTC',
  }).format(d);
}

export function OperationalTrends({ data }: Props) {
  // Recharts handles dual-axis layouts but we keep it single-axis for
  // legibility — compliance is a %, throughput a count. Throughput
  // gets normalised against its own max so both series render in
  // 0-100 space on the same chart without bigger numbers visually
  // dominating.
  const maxThroughput = Math.max(1, ...data.map(d => d.throughput));
  const chartData = data.map(d => ({
    name:           fmtDay(d.date),
    compliance:     d.compliance,
    throughputPct:  Math.round((d.throughput / maxThroughput) * 100),
    throughputRaw:  d.throughput,
  }));

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-[12px] text-slate-400">
        No data in the trailing week yet.
      </div>
    );
  }

  return (
    <div className="h-[360px] w-full flex flex-col">
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#64748b" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false} tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={15}
            />
            <YAxis
              axisLine={false} tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #f1f5f9',
                borderRadius: '16px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '11px', fontWeight: 800, padding: '12px',
              }}
              cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
              formatter={(value, name, ctx) => {
                if (name === 'compliance')    return [`${value}%`, 'Attendance'];
                if (name === 'throughputPct') {
                  const raw = (ctx as any)?.payload?.throughputRaw ?? value;
                  return [`${raw} approved`, 'Throughput'];
                }
                return [String(value ?? ''), String(name ?? '')];
              }}
            />
            <Area
              type="monotone" dataKey="compliance"
              stroke="#4f46e5" strokeWidth={3}
              fillOpacity={1} fill="url(#colorComp)"
              animationDuration={800}
            />
            <Area
              type="monotone" dataKey="throughputPct"
              stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5"
              fillOpacity={1} fill="url(#colorUtil)"
              animationDuration={1100}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm" />
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Attendance %</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-300 shadow-sm" />
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Leave Approvals</span>
        </div>
      </div>
    </div>
  );
}
