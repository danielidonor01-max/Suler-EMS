"use client";

import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Globe, 
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  BarChart3,
  Maximize2,
  ArrowRightLeft,
  ShieldAlert,
  Play
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { EmptyState } from '@/components/common/EmptyState';
import { useWorkforce } from '@/context/WorkforceContext';
import { useActivity } from '@/context/ActivityContext';
import { useObservability } from '@/context/ObservabilityContext';
import { useForecasting } from '@/context/ForecastingContext';
import { useGuardian } from '@/context/GuardianContext';
import { ResourceOptimizationPortal } from '@/components/admin/ResourceOptimizationPortal';
import { StrategySimulator } from '@/components/admin/StrategySimulator';
import { formatMetric } from '@/lib/utils/formatMetric';

// Mock Strategic Data (Base)
const BASE_STRATEGIC_SIGNALS = [
  { id: 'S-01', type: 'ALERT', label: 'Operational Latency', hub: 'Abuja Operations', msg: 'Approval turnaround in Logistics has increased by 42% over 48h.', severity: 'HIGH' },
  { id: 'S-02', type: 'INSIGHT', label: 'Market Volatility', hub: 'Global Treasury', msg: 'Forex exposure in West African nodes exceeds Q2 threshold by 12%.', severity: 'MEDIUM' }
];

const HUB_HEATMAP_DATA = [
  { hub: 'Lagos HQ', hr: 92, ops: 88, fin: 95, tech: 84 },
  { hub: 'Abuja Ops', hr: 78, ops: 64, fin: 82, tech: 72 },
  { hub: 'Benin Hub', hr: 85, ops: 82, fin: 78, tech: 94 },
  { hub: 'Remote', hr: 90, ops: 86, fin: 88, tech: 82 },
];

const RISK_RADAR_DATA = [
  { subject: 'Identity Trust', value: 95, full: 100 },
  { subject: 'Ops Continuity', value: 82, full: 100 },
  { subject: 'Workforce Health', value: 74, full: 100 },
  { subject: 'Financial Sync', value: 88, full: 100 },
  { subject: 'Compliance', value: 91, full: 100 },
];

export default function ECCPage() {
  const { employees } = useWorkforce();
  const { activities } = useActivity();
  const { syncHealth, reconciliationFailures, traces, lastHeartbeat, isRecovering } = useObservability();
  const { stressIndex, signals: foresightSignals } = useForecasting();
  const { alertLevel } = useGuardian();
  
  const [isOptimizationOpen, setIsOptimizationOpen] = React.useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  
  const liveSignals = React.useMemo(() => {
    const signals = [];

    // System Health Signal
    if (syncHealth !== 'HEALTHY') {
      signals.push({
        id: 'SYS-HEALTH',
        type: 'ALERT',
        label: 'Sync Integrity',
        hub: 'Global System',
        msg: syncHealth === 'STALE' 
          ? 'Critical desync detected. Workforce nodes have not reconciled in >10s.' 
          : 'Sync latency detected. Operational state may be inconsistent.',
        severity: 'HIGH'
      });
    }

    // Strategic Foresight Signal (New)
    if (stressIndex > 60) {
      signals.push({
        id: 'SIG-STRESS',
        type: 'ALERT',
        label: 'High Operational Stress',
        hub: 'Global Workforce',
        msg: `Structural stress index has reached ${formatMetric(stressIndex)}%. Capacity constraints detected.`,
        severity: 'HIGH'
      });
    }

    const activitySignals = activities.slice(0, 3).map(act => ({
      id: act.id,
      type: act.type === 'SECURITY' ? 'ALERT' : 'INSIGHT',
      label: act.label,
      hub: act.hub || 'Global Registry',
      msg: act.message,
      severity: act.type === 'SECURITY' ? 'HIGH' : (act.type === 'GOVERNANCE' ? 'MEDIUM' : 'STABLE')
    }));

    // Pad with base signals if needed
    const combined = [...signals, ...activitySignals, ...BASE_STRATEGIC_SIGNALS];
    return combined.slice(0, 3);
  }, [activities, syncHealth, stressIndex]);

  const workforceHealth = React.useMemo(() => {
    // Dynamic health calculation based on active vs total
    const total = employees.length;
    const active = employees.filter(e => e.status === 'ACTIVE').length;
    return total > 0 ? Math.round((active / total) * 100) : 0;
  }, [employees]);

  const dynamicRadarData = React.useMemo(() => {
    return RISK_RADAR_DATA.map(d => 
      d.subject === 'Workforce Health' ? { ...d, value: workforceHealth } : d
    );
  }, [workforceHealth]);

  if (!hasMounted) return null;

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12 pb-20">
      
      {/* Executive Command Hero - Calm & Authoritative */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
             <div className="px-2.5 py-1 bg-slate-950 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Executive War Room
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-200" />
             <div className="flex items-center gap-1.5">
               <div className={`w-2 h-2 rounded-full ${isRecovering ? 'bg-amber-500 animate-pulse' : (syncHealth === 'HEALTHY' ? 'bg-emerald-500' : 'bg-rose-500')}`} />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 {isRecovering ? 'Autonomous Recovery Active' : `Global Status: ${syncHealth}`}
               </span>
             </div>
             {alertLevel !== 'NORMAL' && (
               <>
                 <div className="w-1 h-1 rounded-full bg-slate-200" />
                 <div className="flex items-center gap-1.5">
                   <ShieldAlert className={`w-3.5 h-3.5 ${alertLevel === 'CRITICAL' ? 'text-rose-600 animate-bounce' : 'text-amber-500'}`} />
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${alertLevel === 'CRITICAL' ? 'text-rose-600' : 'text-amber-500'}`}>
                     Governance Alert: {alertLevel}
                   </span>
                 </div>
               </>
             )}
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter leading-none">
              Command Center
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Strategic organizational oversight and operational foresight. Monitor global signals, detect anomalies, and visualize enterprise-scale health.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsSimulatorOpen(true)}
             className="bg-indigo-600 text-white px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
           >
              <Play className="w-[18px] h-[18px] stroke-[1.5px]" />
              Strategy Simulator
           </button>
           <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2">
              <BarChart3 className="w-[18px] h-[18px] stroke-[1.5px]" />
              Strategic Report
           </button>
           <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20">
              <Target className="w-[18px] h-[18px] stroke-[1.5px]" />
              Executive Sync
           </button>
        </div>
      </div>

      {/* Strategic Intelligence Layer: Proactive Signals */}
      {liveSignals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {liveSignals.map((signal) => (
            <StrategicSignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-12">
          <EmptyState 
            title="No Strategic Signals Detected"
            description="The organizational monitoring system is currently scanning for anomalies. No high-priority alerts or predictive risks are currently registered."
            icon={Activity}
          />
        </div>
      )}

      {/* Primary Intelligence Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Operational Heatmap: Branch vs Dept */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-10 border border-slate-200/60 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Operational Density Heatmap</h2>
                 <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">Cross-Hub Performance Comparison</p>
              </div>
              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                 <Maximize2 className="w-3.5 h-3.5" />
                 View Full Matrix
              </button>
           </div>

           <div className="overflow-x-auto">
              {HUB_HEATMAP_DATA.length > 0 ? (
                <table className="w-full">
                   <thead>
                      <tr>
                         <th className="text-left pb-6 px-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Hub Location</th>
                         <th className="pb-6 px-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">HR Gov</th>
                         <th className="pb-6 px-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Operations</th>
                         <th className="pb-6 px-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Finance</th>
                         <th className="pb-6 px-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Technical</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {HUB_HEATMAP_DATA.map((row) => (
                        <tr key={row.hub} className="group">
                           <td className="py-5 px-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black">
                                    {row.hub[0]}
                                 </div>
                                 <span className="text-[13px] font-black text-slate-900 tracking-tight">{row.hub}</span>
                              </div>
                           </td>
                           <td className="py-2 px-2"><HeatmapCell value={row.hr} /></td>
                           <td className="py-2 px-2"><HeatmapCell value={row.ops} /></td>
                           <td className="py-2 px-2"><HeatmapCell value={row.fin} /></td>
                           <td className="py-2 px-2"><HeatmapCell value={row.tech} /></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              ) : (
                <EmptyState 
                  title="Operational Matrix Unavailable"
                  description="Regional hub density data is currently being reconciled. Performance visualizations will resume once the sync cycle completes."
                  icon={Zap}
                />
              )}
           </div>

           <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimal</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-indigo-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sub-Optimal</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-rose-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Signal</span>
                 </div>
              </div>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                 Live sync updated 2m ago
              </div>
           </div>
        </div>

        {/* Strategic Radar: Enterprise Risk Profile */}
        <div className="bg-slate-950 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-white tracking-tight leading-none">Enterprise Risk Radar</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Trust & Stability Index</p>
                 </div>
                 <Zap className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>

              <div className="h-[300px] w-full mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart 
                      cx="50%" 
                      cy="50%" 
                      outerRadius="65%" 
                      data={dynamicRadarData}
                      margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
                    >
                       <PolarGrid stroke="#334155" />
                       <PolarAngleAxis 
                         dataKey="subject" 
                         tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                       />
                       <Radar
                         name="Trust Index"
                         dataKey="value"
                         stroke="#6366f1"
                         fill="#6366f1"
                         fillOpacity={0.3}
                         strokeWidth={2}
                       />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>

              <div className="mt-10 space-y-4">
                 <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                       <Sparkles className="w-4 h-4 text-indigo-400" />
                       <span className="text-[11px] font-black uppercase tracking-widest">AI Consensus</span>
                    </div>
                    <span className="text-[11px] font-black text-emerald-400">STABLE</span>
                 </div>
                 <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic px-2">
                    "Organizational trust boundaries are secure. Operational continuity risks in Abuja hub require monitoring due to workload density."
                 </p>
              </div>
           </div>

           {/* Ambient Glow */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        </div>

        {/* System Integrity & Sync Health Surface */}
        <div className="bg-white rounded-[32px] p-10 border border-slate-200/60 shadow-sm space-y-8">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tight leading-none">System Integrity Node</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Realtime Sync Health</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                syncHealth === 'HEALTHY' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                syncHealth === 'DEGRADED' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${syncHealth === 'HEALTHY' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                 {syncHealth}
              </div>
           </div>

           <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Reconciliation Heartbeat</span>
                    <span className="text-slate-900">{(Date.now() - lastHeartbeat) / 1000}s ago</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${syncHealth === 'HEALTHY' ? 'bg-indigo-500' : 'bg-rose-500'}`} 
                      style={{ width: `${Math.max(0, 100 - (Date.now() - lastHeartbeat) / 100)}%` }}
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Active Traces</span>
                    <span className="text-xl font-black text-indigo-600">{traces.filter(t => t.status === 'PENDING').length}</span>
                 </div>
                 <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block mb-1">Sync Faults</span>
                    <span className="text-xl font-black text-rose-600">{reconciliationFailures}</span>
                 </div>
              </div>
           </div>

           <div className="pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mutation Latency Feed</h4>
              <div className="space-y-3 max-h-[120px] overflow-auto pr-2 custom-scrollbar">
                 {traces.slice(0, 5).map(trace => (
                   <div key={trace.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${trace.status === 'SUCCESS' ? 'bg-emerald-400' : trace.status === 'CONFLICT' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                         <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">{trace.label}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{trace.latency ? `${trace.latency}ms` : '---'}</span>
                   </div>
                 ))}
                 {traces.length === 0 && (
                    <div className="text-[10px] font-medium text-slate-300 italic py-2">Waiting for enterprise mutations...</div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Strategic Foresight: Trend Visualization */}
      <div className="bg-white rounded-[32px] p-10 border border-slate-200/60 shadow-sm">
         <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
               <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Operational Foresight</h2>
               <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">Predictive Productivity & Engagement Projections</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Deterministic Model Active</span>
               </div>
            </div>
         </div>

         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[
                 { date: 'Mon', engagement: 82, productivity: 88 },
                 { date: 'Tue', engagement: 85, productivity: 92 },
                 { date: 'Wed', engagement: 78, productivity: 84 },
                 { date: 'Thu', engagement: 82, productivity: 86 },
                 { date: 'Fri', engagement: 88, productivity: 90 },
                 { date: 'Sat', engagement: 92, productivity: 94 },
                 { date: 'Sun', engagement: 90, productivity: 92 },
               ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
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
                    dataKey="engagement" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEng)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="productivity" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorProd)" 
                  />
               </AreaChart>
            </ResponsiveContainer>
         </div>

         {/* Global Strategy Footer */}
         <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <Zap className="w-6 h-6" />
               </div>
               <div className="space-y-0.5">
                  <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">Suler Guardian Protocol</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Strategic Defense Active</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsOptimizationOpen(true)}
                 className="h-[52px] px-8 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3"
               >
                  <ArrowRightLeft className="w-4 h-4" />
                  Optimize Regional Resources
               </button>
               <button className="h-[52px] px-8 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Download Strategy Brief
               </button>
            </div>
         </div>

         {/* Resource Optimization Intelligence Portal */}
         <ResourceOptimizationPortal 
           isOpen={isOptimizationOpen}
           onClose={() => setIsOptimizationOpen(false)}
         />

         {/* Strategic Strategy Simulator Canvas */}
         <StrategySimulator 
           isOpen={isSimulatorOpen}
           onClose={() => setIsSimulatorOpen(false)}
         />
      </div>
    </div>
  );
}

const StrategicSignalCard = ({ signal }: any) => {
  const severityStyles: Record<string, string> = {
    HIGH: 'border-rose-200 bg-rose-50/30 text-rose-600',
    MEDIUM: 'border-amber-200 bg-amber-50/30 text-amber-600',
    STABLE: 'border-indigo-200 bg-indigo-50/30 text-indigo-600',
  };

  const iconMap: Record<string, any> = {
    ALERT: AlertTriangle,
    INSIGHT: Sparkles,
    PREDICTION: TrendingUp,
  };

  const Icon = iconMap[signal.type];

  return (
    <div className={`p-6 rounded-[24px] border transition-all hover:shadow-md cursor-pointer group ${severityStyles[signal.severity]}`}>
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white border border-inherit flex items-center justify-center">
                <Icon className="w-4 h-4" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest">{signal.label}</span>
          </div>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
       </div>
       <p className="text-[14px] font-black tracking-tight mb-2 leading-tight">{signal.msg}</p>
       <div className="flex items-center gap-2">
          <Globe className="w-3 h-3 opacity-60" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{signal.hub}</span>
       </div>
    </div>
  );
};

const HeatmapCell = ({ value }: { value: number }) => {
  const getStyle = (v: number) => {
    if (v > 90) return 'bg-indigo-500 text-white';
    if (v > 80) return 'bg-indigo-300 text-indigo-900';
    if (v > 70) return 'bg-indigo-100 text-indigo-800';
    return 'bg-rose-100 text-rose-800';
  };

  return (
    <div className={`w-full h-10 rounded-xl flex items-center justify-center text-[12px] font-black transition-all hover:scale-105 cursor-pointer shadow-sm ${getStyle(value)}`}>
       {value}%
    </div>
  );
};
