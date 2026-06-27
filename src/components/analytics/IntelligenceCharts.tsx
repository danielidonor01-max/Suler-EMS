"use client";

import React from 'react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, PieChart, Pie,
} from 'recharts';

interface CapabilityPoint { subject: string; A: number; B: number; fullMark: number }
interface ClusterPoint    { name: string; value: number; color: string }
interface BehaviouralPoint { name: string; engagement: number; responsiveness: number }

/**
 * Capability radar (Suler Global vs Industry Benchmark). Extracted from
 * /admin/intelligence so the recharts bundle (~150KB gzipped) only loads
 * when the page renders, not in the shared bundle.
 */
export function CapabilityRadar({ data }: { data: CapabilityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart
        cx="50%"
        cy="50%"
        outerRadius="65%"
        data={data}
        margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
      >
        <PolarGrid stroke="#f1f5f9" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
        />
        <Radar
          name="Suler Global"
          dataKey="A"
          stroke="#4f46e5"
          fill="#4f46e5"
          fillOpacity={0.4}
          strokeWidth={3}
        />
        <Radar
          name="Industry Benchmark"
          dataKey="B"
          stroke="#e2e8f0"
          fill="#94a3b8"
          fillOpacity={0.1}
          strokeWidth={2}
          strokeDasharray="4 4"
        />
        <Tooltip
          contentStyle={{
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            fontSize: '11px',
            fontWeight: 800,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function PerformanceClustersPie({ data }: { data: ClusterPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BehaviouralTrendsBar({ data }: { data: BehaviouralPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false} tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
          dy={15}
        />
        <YAxis
          axisLine={false} tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            fontSize: '11px',
            fontWeight: 800,
          }}
        />
        <Bar dataKey="engagement"     fill="#6366f1" radius={[12, 12, 4, 4]} barSize={40} />
        <Bar dataKey="responsiveness" fill="#10b981" radius={[12, 12, 4, 4]} barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
