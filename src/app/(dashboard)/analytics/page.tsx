"use client";

import React, { useEffect, useState } from 'react';
import { 
  BarChart2, 
  Download, 
  RefreshCcw, 
  LayoutDashboard, 
  Clock, 
  Users, 
  ShieldCheck, 
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Activity
} from 'lucide-react';
import { OperationalTrends } from '@/components/analytics/OperationalTrends';
import { WorkflowBottlenecks } from '@/components/analytics/WorkflowBottlenecks';
import { OperationalInsights } from '@/components/analytics/OperationalInsights';
import { ReportManager } from '@/modules/analytics/components/ReportManager';
import { MetricCard } from '@/components/dashboard/MetricCard';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/analytics/dashboard');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
           <div className="absolute inset-0 blur-2xl bg-indigo-600/10 rounded-full animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Compiling Intelligence</p>
          <p className="text-xs font-bold text-slate-400">Synthesizing real-time operational datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      {/* Premium Executive Hero */}
      <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-premium relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-[600px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <BrainCircuit className="w-3 h-3" />
                Cognitive Analytics
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Operational Intelligence
            </h1>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Advanced visualization of organization-wide performance metrics, resource utilization, and governance signals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchAnalytics(true)}
              className="group bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border border-slate-100"
            >
              <RefreshCcw className={`w-4 h-4 transition-transform duration-700 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              Refresh
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2.5 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-100">
              <Download className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Dynamic Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/40 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50/30 rounded-full -ml-24 -mb-24 blur-3xl" />
      </div>

      {/* High-Impact KPI Surface */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Organization Health" 
          value="94%" 
          trend={{ value: 2.4, isPositive: true }}
          variant="tonal-success"
          icon="verified_user"
        />
        <MetricCard 
          label="Resource Utilization" 
          value="87.2%" 
          trend={{ value: 1.2, isPositive: false }}
          variant="tonal-info"
          icon="monitoring"
        />
        <MetricCard 
          label="Process Velocity" 
          value="2.4d" 
          variant="tonal-warning"
          icon="bolt"
        />
        <MetricCard 
          label="Risk Signal" 
          value="Low" 
          variant="tonal-success"
          icon="security"
        />
      </div>

      {/* Analytics Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          {/* Trends Module */}
          <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-premium">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Performance Vectors</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Efficiency & Utilization Trends</p>
                </div>
              </div>
              <div className="flex gap-2">
                {['7D', '30D', '90D'].map(period => (
                  <button key={period} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${period === '30D' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <OperationalTrends />
          </div>

          {/* Workflow Distribution Module */}
          <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-premium">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Departmental Throughput</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Workflow Bottleneck Analysis</p>
              </div>
            </div>
            <WorkflowBottlenecks bottlenecks={data?.bottlenecks || []} />
          </div>
        </div>

        {/* Side Intelligence Column */}
        <div className="space-y-10">
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-premium">
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Intelligence Signals</h2>
            </div>
            <OperationalInsights insights={data?.insights || []} />
          </div>
          
          <div className="bg-slate-900 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <Sparkles className="w-5 h-5 text-indigo-400" />
                 <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Reporting Engine</h2>
               </div>
               <ReportManager userId={data?.userId || ""} />
             </div>
             {/* Glowing accent */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full -mr-16 -mt-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
