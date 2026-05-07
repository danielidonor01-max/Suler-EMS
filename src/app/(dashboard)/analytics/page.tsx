"use client";

import React, { useEffect, useState } from 'react';
import { KPIGrid } from '@/components/analytics/KPIGrid';
import { OperationalTrends } from '@/components/analytics/OperationalTrends';
import { WorkflowBottlenecks } from '@/components/analytics/WorkflowBottlenecks';
import { OperationalInsights } from '@/components/analytics/OperationalInsights';
import { ReportManager } from '@/modules/analytics/components/ReportManager';
import { BarChart2, Download, RefreshCcw, FileText, LayoutDashboard, Clock, Users, ShieldCheck } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
           <RefreshCcw className="w-10 h-10 text-blue-500 animate-spin" />
           <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse rounded-full" />
        </div>
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Compiling Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-900/40">
              <BarChart2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Operational Intelligence</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live Stream Active
                </span>
                <span className="text-zinc-500 text-xs font-medium">|</span>
                <p className="text-zinc-500 text-xs font-medium">Real-time organizational performance & governance analytics.</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchAnalytics(true)}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition-all text-xs font-bold uppercase tracking-widest"
            >
              <RefreshCcw className={`w-4 h-4 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              Refresh Data
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 active:scale-95 transition-all text-xs font-bold uppercase tracking-widest shadow-xl shadow-blue-900/30">
              <Download className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <LayoutDashboard className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em]">High-Level Performance Indicators</h2>
        </div>
        <KPIGrid metrics={data?.workforce || {}} />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Span: Trends and Workflow Bottlenecks */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-zinc-500">
              <Clock className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Efficiency & Utilization Trends</h2>
            </div>
            <OperationalTrends />
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2 text-zinc-500">
              <Users className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Departmental Throughput</h2>
            </div>
            <WorkflowBottlenecks bottlenecks={data?.bottlenecks || []} />
          </div>
        </div>

        {/* Right Span: Insights and Quick Reports */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <ShieldCheck className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Intelligence Signals</h2>
            </div>
            <OperationalInsights insights={data?.insights || []} />
          </div>
          
          {/* Real Background Job Report Manager */}
          <ReportManager userId={data?.userId || ""} />
        </div>
      </div>
    </div>
  );
}
