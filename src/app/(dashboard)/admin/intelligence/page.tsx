"use client";

import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Target, 
  Users, 
  Activity, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight,
  UserCheck,
  Zap,
  Fingerprint,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';

// Mock Intelligence Data
const CAPABILITY_DATA = [
  { subject: 'Technical', A: 120, B: 110, fullMark: 150 },
  { subject: 'Leadership', A: 98, B: 130, fullMark: 150 },
  { subject: 'Comm.', A: 86, B: 130, fullMark: 150 },
  { subject: 'Ops Readiness', A: 99, B: 100, fullMark: 150 },
  { subject: 'Strategic', A: 85, B: 90, fullMark: 150 },
];

const BEHAVIORAL_TRENDS = [
  { name: 'Jan', engagement: 4000, responsiveness: 2400 },
  { name: 'Feb', engagement: 3000, responsiveness: 1398 },
  { name: 'Mar', engagement: 2000, responsiveness: 9800 },
  { name: 'Apr', engagement: 2780, responsiveness: 3908 },
  { name: 'May', engagement: 1890, responsiveness: 4800 },
  { name: 'Jun', engagement: 2390, responsiveness: 3800 },
];

const PERFORMANCE_CLUSTERS = [
  { name: 'High-Performance', value: 45, color: '#6366f1' },
  { name: 'Balanced', value: 35, color: '#10b981' },
  { name: 'Overload Risk', value: 12, color: '#f59e0b' },
  { name: 'Burnout Zone', value: 8, color: '#f43f5e' },
];

export default function WorkforceIntelligenceHub() {
  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12 pb-20">
      
      {/* Workforce Intelligence Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
             <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <BrainCircuit className="w-3 h-3" />
                Workforce Intelligence Hub
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-200" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model: Behavioral Analysis v4.2</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
              Intelligence Hub
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Deeper people analytics and capability indexing. Visualize skill distribution, performance clusters, and organizational behavioral health.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 h-[44px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2">
              <PieChartIcon className="w-[18px] h-[18px] stroke-[1.5px]" />
              Skill Registry
           </button>
           <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md">
              <Fingerprint className="w-[18px] h-[18px] stroke-[1.5px]" />
              Member Profile
           </button>
        </div>
      </div>

      {/* Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         
         {/* Capability Matrix: Radar Storytelling */}
         <div className="lg:col-span-2 bg-white rounded-[32px] p-10 border border-slate-200/60 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-12 relative z-10">
               <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Organizational Capability Matrix</h2>
                  <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">Skill Distribution vs Industry Benchmark</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-indigo-600" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suler Global</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-slate-200" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Index</span>
                  </div>
               </div>
            </div>

            <div className="h-[450px] w-full relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={CAPABILITY_DATA}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }} />
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
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 800 }} />
                  </RadarChart>
               </ResponsiveContainer>
            </div>

            <div className="mt-8 p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex items-start gap-4 relative z-10">
               <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-1" />
               <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                 <span className="font-black text-slate-900 uppercase tracking-tighter">Strategic Gap Detected:</span> The organization displays exceptional technical proficiency (120% of benchmark) but shows a latent gap in leadership and communication scores compared to Q3 targets.
               </p>
            </div>
         </div>

         {/* Side Analysis Column */}
         <div className="space-y-10">
            {/* Performance Clusters */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/40">
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-lg font-black tracking-tight">Performance Clusters</h3>
                     <PieChartIcon className="w-5 h-5 text-indigo-400" />
                  </div>

                  <div className="h-[220px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={PERFORMANCE_CLUSTERS}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {PERFORMANCE_CLUSTERS.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                  </div>

                  <div className="mt-6 space-y-3">
                     {PERFORMANCE_CLUSTERS.map((cluster) => (
                       <div key={cluster.name} className="flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cluster.color }} />
                             <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-widest">{cluster.name}</span>
                          </div>
                          <span className="text-[13px] font-black">{cluster.value}%</span>
                       </div>
                     ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                     <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-rose-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Burnout Threshold Rising</span>
                     </div>
                     <p className="text-[11px] text-slate-500 font-medium">8% of workforce currently in high-risk zones.</p>
                  </div>
               </div>
               {/* Detail Grid */}
               <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            </div>

            {/* Insight Action Block */}
            <div className="bg-white border border-slate-200/60 rounded-[32px] p-8 shadow-sm">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Proactive Intelligence</h4>
               <div className="space-y-6">
                  {[
                    { label: 'Leadership Development', action: 'Initiate Program', risk: 'High Success' },
                    { label: 'Ops Shift Rebalance', action: 'Trigger Sync', risk: 'Mitigation' }
                  ].map((item, i) => (
                    <div key={i} className="group cursor-pointer">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[14px] font-black text-slate-900 tracking-tight">{item.label}</span>
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">{item.risk}</span>
                       </div>
                       <button className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:gap-4 transition-all">
                          {item.action} <ChevronRight className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Behavioral Analytics: Responsive Trends */}
      <div className="bg-white rounded-[32px] p-10 border border-slate-200/60 shadow-sm overflow-hidden relative">
         <div className="flex items-center justify-between mb-12">
            <div className="space-y-1">
               <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Organizational Behavior Analytics</h2>
               <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">Engagement Trends vs Responsiveness Index</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="p-1 bg-slate-50 rounded-xl border border-slate-100 flex">
                  <button className="px-4 py-1.5 rounded-lg bg-white shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-900">Engagement</button>
                  <button className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Responsiveness</button>
               </div>
            </div>
         </div>

         <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={BEHAVIORAL_TRENDS} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 800 }}
                  />
                  <Bar 
                    dataKey="engagement" 
                    fill="#6366f1" 
                    radius={[12, 12, 4, 4]} 
                    barSize={40}
                  />
                  <Bar 
                    dataKey="responsiveness" 
                    fill="#10b981" 
                    radius={[12, 12, 4, 4]} 
                    barSize={40}
                  />
               </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Behavioral Detail Footer */}
         <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: 'Avg Responsiveness', value: '1.2h', trend: 'down', trendVal: '12%' },
              { label: 'Engagement Rate', value: '94.2%', trend: 'up', trendVal: '4%' },
              { label: 'Workflow Sync', value: 'Optimal', trend: 'neutral', trendVal: 'LIVE' },
              { label: 'Participation Index', value: '88/100', trend: 'up', trendVal: '6%' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{stat.label}</p>
                 <div className="flex items-end gap-3">
                    <span className="text-xl font-black text-slate-900 tracking-tight leading-none">{stat.value}</span>
                    <span className={`text-[10px] font-bold ${stat.trend === 'up' ? 'text-emerald-500' : stat.trend === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
                       {stat.trendVal}
                    </span>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
