"use client";

import React, { useEffect, useState } from 'react';
import { 
  BarChart2, 
  Download, 
  RefreshCcw, 
  BrainCircuit,
  TrendingUp,
  Activity,
  ShieldCheck,
  Zap,
  Target,
  Users
} from 'lucide-react';
import { OperationalTrends } from '@/components/analytics/OperationalTrends';
import { WorkflowBottlenecks } from '@/components/analytics/WorkflowBottlenecks';
import { OperationalInsights } from '@/components/analytics/OperationalInsights';
import { MetricCard } from '@/components/dashboard/MetricCard';

const MOCK_COMPETENCY = [
  { skill: 'Operational Governance', score: 92, target: 95 },
  { skill: 'Workflow Optimization', score: 78, target: 90 },
  { skill: 'Fiscal Oversight', score: 88, target: 85 },
  { skill: 'Personnel Management', score: 95, target: 95 },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">
      {/* Executive Hero */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <BrainCircuit className="w-3 h-3" />
                Cognitive Analytics Active
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Operational Intelligence
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Advanced visualization of organization-wide performance metrics, resource utilization, and governance signals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 h-[44px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 whitespace-nowrap">
              <RefreshCcw className="w-[18px] h-[18px] stroke-[1.5px]" />
              Refresh
            </button>
            <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md whitespace-nowrap">
              <Download className="w-[18px] h-[18px] stroke-[1.5px]" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* KPI Surface */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Org Health" value="94%" trend={{ direction: 'up', value: '2.4%' }} variant="tonal-success" icon={ShieldCheck} />
        <MetricCard label="Resource Load" value="87.2%" trend={{ direction: 'down', value: '1.2%' }} variant="tonal-info" icon={Users} />
        <MetricCard label="Process Velocity" value="2.4d" variant="tonal-warning" icon={Zap} />
        <MetricCard label="Risk Protocol" value="Stable" variant="tonal-success" icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Performance Vectors */}
          <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Efficiency Vectors</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Throughput Analysis</p>
                </div>
              </div>
            </div>
            <OperationalTrends />
          </div>

          {/* Competency Map (Manager Visualization) */}
          <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Organization Competency Map</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Skills Distribution & Readiness</p>
              </div>
            </div>
            
            <div className="space-y-6">
               {MOCK_COMPETENCY.map(skill => (
                 <div key={skill.skill} className="space-y-2">
                    <div className="flex justify-between items-end">
                       <span className="text-[12px] font-black text-slate-700">{skill.skill}</span>
                       <span className="text-[11px] font-bold text-slate-400">{skill.score}% / {skill.target}% Target</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden flex border border-slate-100">
                       <div 
                        className={`h-full rounded-full transition-all duration-1000 ${skill.score >= skill.target ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                        style={{ width: `${skill.score}%` }} 
                       />
                       <div className="h-full border-r-2 border-slate-900/10" style={{ width: `${Math.max(0, skill.target - skill.score)}%` }} />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Intelligence Rails */}
        <div className="space-y-10">
          <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Activity className="w-5 h-5 text-slate-400" />
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Operational Insights</h2>
            </div>
            <OperationalInsights insights={[]} />
          </div>

          <div className="bg-slate-900 rounded-[24px] p-8 text-white relative overflow-hidden shadow-xl">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Security Audit</h2>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                   <p className="text-[12px] font-medium text-slate-300">Last deep-scan completed 4h ago. All operational parameters within governance thresholds.</p>
                   <button className="w-full py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg">View Full Log</button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
