"use client";

import React from 'react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

interface RadarPoint   { subject: string; value: number }
interface TrendPoint   { date: string; engagement: number; productivity: number }

/**
 * ECC Trust-Index radar. Pure presentational — extracted from
 * /admin/ecc so the recharts bundle (~150KB gzipped) only loads when
 * the page actually renders, not in the shared bundle.
 */
export function EccTrustRadar({ data }: { data: RadarPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart
        cx="50%"
        cy="50%"
        outerRadius="65%"
        data={data}
        margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
      >
        <PolarGrid stroke="#f1f5f9" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
        />
        <Radar
          name="Trust Index"
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/**
 * ECC engagement + productivity trend area chart. Same extraction
 * rationale — the host page dynamic-imports this so recharts stays
 * out of the initial bundle.
 */
export function EccEngagementChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          axisLine={false} tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
          dy={15}
        />
        <YAxis
          axisLine={false} tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #f1f5f9',
            borderRadius: '16px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            fontSize: '11px',
            fontWeight: 800,
            padding: '12px',
          }}
        />
        <Area
          type="monotone" dataKey="engagement"
          stroke="#6366f1" strokeWidth={3}
          fillOpacity={1} fill="url(#colorEng)"
        />
        <Area
          type="monotone" dataKey="productivity"
          stroke="#10b981" strokeWidth={3}
          fillOpacity={1} fill="url(#colorProd)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
