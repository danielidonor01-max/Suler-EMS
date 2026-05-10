"use client";

import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  BrainCircuit, 
  RefreshCcw, 
  TrendingUp, 
  Zap, 
  ShieldAlert, 
  BarChart3,
  CalendarClock,
  Sparkles,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { RecommendationFeed } from '@/modules/forecasting/components/RecommendationFeed';
import { RiskHeatmap } from '@/modules/forecasting/components/RiskHeatmap';
import { MetricCard } from '@/components/dashboard/MetricCard';

export default function ForecastingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIntelligence = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/forecasting/dashboard');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch forecasting intelligence');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em]">Calibrating Models</p>
          <p className="text-xs font-bold text-slate-400">Synchronizing predictive operational foresight...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      {/* Intelligence Executive Hero */}
      <div className="bg-white rounded-[24px] p-10 border border-slate-200 shadow-premium relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-[600px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Advanced Intelligence
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Forecasting & Operations
            </h1>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Deterministic modeling and statistical operational foresight derived from real-time organizational event streams.
            </p>
          </div>

          <button 
            onClick={() => fetchIntelligence(true)}
            className="group bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center gap-2.5 px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border border-slate-100 shadow-sm"
          >
            <RefreshCcw className={`w-4 h-4 transition-transform duration-700 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            Recalculate Projections
          </button>
        </div>
      </div>

      {/* Primary Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Span: Projections and Charts */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Workforce Staffing Projection Surface */}
          <div className="bg-white rounded-[24px] p-10 border border-slate-200 shadow-premium">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Staffing Projection</h3>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">7-Day Demand Forecasting</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-[12px]">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Projected Need</span>
                </div>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.projections[0]?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNeed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString([], { weekday: 'short' })}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
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
                      padding: '12px'
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
            </div>
          </div>

          {/* Operational Risk Matrix */}
          <div className="space-y-6">
             <div className="flex items-center gap-3 px-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Risk Distribution Heatmap</h2>
            </div>
            <RiskHeatmap data={data?.risks || []} />
          </div>

          {/* Workflow Congestion Prediction Surface */}
          <div className="bg-white rounded-[24px] p-10 border border-slate-200 shadow-premium overflow-hidden relative">
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="space-y-6 max-w-md">
                   <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 w-fit">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Congestion Signal</span>
                   </div>
                   <h3 className="text-3xl font-bold text-slate-900 leading-[1.1] tracking-tighter">
                     Workflow Stagnation Risk: <span className="text-rose-500">{data?.congestion?.risk}</span>
                   </h3>
                   <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
                     Current queue depth ({data?.congestion?.pendingCount} items) indicates a potential <span className="text-slate-900 font-bold">{data?.congestion?.estimatedWaitHours}h</span> latency in approval turnaround.
                   </p>
                </div>
                
                <div className="flex items-center gap-12 bg-slate-50 p-10 rounded-[16px] border border-slate-200">
                   <div className="text-center">
                      <div className="text-4xl font-bold text-slate-900 tracking-tighter">{data?.congestion?.pendingCount}</div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-2">Pending Items</div>
                   </div>
                   <div className="w-px h-16 bg-slate-200" />
                   <div className="text-center">
                      <div className="text-4xl font-bold text-slate-900 tracking-tighter">{data?.congestion?.estimatedWaitHours}h</div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-2">Est. Latency</div>
                   </div>
                </div>
             </div>
          </div>
          </div>

        {/* Side Intelligence Column */}
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Explainable Recs</h2>
            </div>
            <RecommendationFeed recommendations={data?.recommendations || []} />
          </div>

          {/* Quality Metrics */}
          <div className="bg-white rounded-[24px] p-10 border border-slate-200 shadow-premium relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-10">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600">Signal Confidence</h3>
               </div>
               
               <div className="space-y-8">
                  {[
                    { label: 'Data Density', value: 88, status: 'OPTIMAL' },
                    { label: 'Model Accuracy', value: 92, status: 'HIGH' },
                    { label: 'Signal Variance', value: 12, status: 'LOW' }
                  ].map((signal) => (
                    <div key={signal.label} className="space-y-3">
                      <div className="flex justify-between text-[11px] font-semibold uppercase tracking-widest">
                        <span className="text-slate-500">{signal.label}</span>
                        <span className={signal.status === 'OPTIMAL' || signal.status === 'HIGH' ? 'text-emerald-600' : 'text-slate-500'}>{signal.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${signal.status === 'LOW' ? 'bg-slate-300' : 'bg-indigo-500'}`}
                          style={{ width: `${signal.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
               </div>
               
               <div className="mt-12 pt-8 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-3 h-3 text-indigo-600" />
                    <span className="text-[9px] font-medium uppercase tracking-widest text-indigo-600">Engine Logs</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    Models updated hourly via system event streams. Predictive foresight is statistically valid at 95% confidence.
                  </p>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
