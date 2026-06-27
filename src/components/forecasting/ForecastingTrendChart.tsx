"use client";

import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';

interface TrendPoint {
  date:      string;
  predicted: number;
}

/**
 * Workforce-need projection chart. Pure-presentational — takes the
 * series and renders it. Lives in its own file so the host page can
 * pull it in with next/dynamic and keep recharts (~150KB) off the
 * initial bundle.
 */
export function ForecastingTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorNeed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          axisLine={false} tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
          tickFormatter={(val) => new Date(val).toLocaleDateString([], { weekday: 'short' })}
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
          type="monotone"
          dataKey="predicted"
          stroke="#4f46e5"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorNeed)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
