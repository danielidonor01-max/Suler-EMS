"use client";

import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
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
    <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl backdrop-blur-xl h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Operational Performance</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">7-Day Trend Analysis</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Compliance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Utilization</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData}>
            <defs>
              <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#09090b', 
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Area 
              type="monotone" 
              dataKey="compliance" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorComp)" 
            />
            <Area 
              type="monotone" 
              dataKey="utilization" 
              stroke="#818cf8" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorUtil)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
