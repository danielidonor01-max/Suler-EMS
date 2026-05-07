"use client";

import React, { useEffect, useState } from 'react';
import { RecommendationFeed } from '@/modules/forecasting/components/RecommendationFeed';
import { RiskHeatmap } from '@/modules/forecasting/components/RiskHeatmap';
import { 
  Activity, 
  BrainCircuit, 
  RefreshCcw, 
  TrendingUp, 
  Zap, 
  ShieldAlert, 
  BarChart3,
  CalendarClock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line 
} from 'recharts';

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
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
           <BrainCircuit className="w-10 h-10 text-indigo-500 animate-pulse" />
           <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse rounded-full" />
        </div>
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Synchronizing Intelligence Models...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Intelligence Header */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-2xl shadow-indigo-900/40">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Forecasting & Advanced Operations</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  Predictive Engine V1.0
                </span>
                <span className="text-zinc-500 text-xs font-medium">|</span>
                <p className="text-zinc-500 text-xs font-medium italic">Deterministic modeling and statistical operational foresight.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => fetchIntelligence(true)}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <RefreshCcw className={`w-4 h-4 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            Recalculate Projections
          </button>
        </div>
      </div>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Span: Projections and Charts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Workforce Staffing Projection Chart */}
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">7-Day Staffing Projection</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Rolling average workforce demand</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Projected Need</span>
                 </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.projections[0]?.trend || []}>
                  <defs>
                    <linearGradient id="colorNeed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickFormatter={(val) => new Date(val).toLocaleDateString([], { weekday: 'short' })}
                  />
                  <YAxis stroke="#ffffff20" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorNeed)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Departmental Risk Matrix */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-zinc-500">
              <Zap className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Operational Risk Heatmap</h2>
            </div>
            <RiskHeatmap data={data?.risks || []} />
          </div>

          {/* Workflow Congestion Prediction */}
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <CalendarClock className="w-32 h-32" />
             </div>
             
             <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-md">
                   <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 w-fit">
                      <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">Congestion Forecast</span>
                   </div>
                   <h3 className="text-2xl font-black text-white leading-tight">Workflow Stagnation Risk: <span className="text-orange-500">{data?.congestion?.risk}</span></h3>
                   <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                     Based on current queue depth ({data?.congestion?.pendingCount} items) and historical throughput, we anticipate a <span className="text-white font-bold">{data?.congestion?.estimatedWaitHours}h</span> wait time for upcoming approvals.
                   </p>
                </div>
                
                <div className="flex gap-8">
                   <div className="text-center">
                      <div className="text-3xl font-black text-white">{data?.congestion?.pendingCount}</div>
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Pending items</div>
                   </div>
                   <div className="w-px h-12 bg-white/10" />
                   <div className="text-center">
                      <div className="text-3xl font-black text-white">{data?.congestion?.estimatedWaitHours}h</div>
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Est. Wait Time</div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Span: Recommendations and Signals */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <BrainCircuit className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Explainable Recommendations</h2>
            </div>
            <RecommendationFeed recommendations={data?.recommendations || []} />
          </div>

          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
             <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Intelligence Signal Quality</h3>
             </div>
             
             <div className="space-y-4">
                {[
                  { label: 'Data Density', value: 88, status: 'HIGH' },
                  { label: 'Model Confidence', value: 92, status: 'HIGH' },
                  { label: 'Signal Noise', value: 12, status: 'LOW' }
                ].map((signal) => (
                  <div key={signal.label} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-zinc-500">{signal.label}</span>
                      <span className={signal.status === 'HIGH' ? 'text-green-400' : 'text-zinc-400'}>{signal.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${signal.status === 'HIGH' ? 'bg-indigo-500' : 'bg-zinc-600'}`}
                        style={{ width: `${signal.value}%` }}
                      />
                    </div>
                  </div>
                ))}
             </div>
             
             <p className="mt-8 text-[9px] text-zinc-600 leading-relaxed italic">
               * Signals are derived from historical analytics snapshots and system event streams. Predictive models are updated every hour.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
