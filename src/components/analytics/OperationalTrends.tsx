"use client";

import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const mockData = [
  { name: 'Mon', compliance: 92, utilization: 80 },
  { name: 'Tue', compliance: 95, utilization: 82 },
  { name: 'Wed', compliance: 88, utilization: 78 },
  { name: 'Thu', compliance: 91, utilization: 81 },
  { name: 'Fri', compliance: 94, utilization: 84 },
  { name: 'Sat', compliance: 98, utilization: 75 },
  { name: 'Sun', compliance: 99, utilization: 70 },
];

export function OperationalTrends() {
  return (
    <div className="h-[400px] w-full flex flex-col">
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #f1f5f9',
                borderRadius: '16px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '11px',
                fontWeight: 800,
                padding: '12px'
              }}
              cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
              itemStyle={{ padding: '2px 0' }}
            />
            <Area 
              type="monotone" 
              dataKey="compliance" 
              stroke="#4f46e5" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorComp)" 
              animationDuration={1500}
            />
            <Area 
              type="monotone" 
              dataKey="utilization" 
              stroke="#94a3b8" 
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1} 
              fill="url(#colorUtil)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 mt-8 pt-6 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm" />
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Compliance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-300 shadow-sm" />
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Utilization</span>
        </div>
      </div>
    </div>
  );
}
