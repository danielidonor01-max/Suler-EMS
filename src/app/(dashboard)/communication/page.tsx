"use client";

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Megaphone, 
  Users, 
  Search, 
  Plus, 
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  MoreVertical,
  Activity,
  ShieldCheck,
  Send,
  Target,
  Zap,
  Layout
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';

const MOCK_BROADCASTS = [
  { id: 'br-001', title: 'Q2 Operational Strategy Update', author: 'Executive Office', time: '2h ago', category: 'STRATEGY' },
  { id: 'br-002', title: 'Maintenance Window: Biometric Sync', author: 'System Admin', time: '5h ago', category: 'SYSTEM' },
];

const MOCK_THREADS = [
  { id: 'th-001', title: 'Leave Approval: Alex Okereke', participants: 3, lastMessage: 'Reviewing documentation now.', status: 'ACTIVE', time: '10m ago' },
  { id: 'th-002', title: 'Payroll Reconciliation Q1', participants: 5, lastMessage: 'Tax discrepancies resolved.', status: 'RESOLVED', time: '1d ago' },
];

export default function CommunicationPage() {
  return (
    <div className="animate-in space-y-12">
      {/* Executive Command Hub - Floating Layout */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
             <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Encrypted Operational Channels
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-200" />
             <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Global Sync: Nominal</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter leading-none">
              Communication Hub
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Unified collaboration layer for strategic broadcasts, secure operational discussions, and inter-departmental alignment.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 py-3 rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm">
              <Activity className="w-4 h-4" />
              Channel Analytics
           </button>
           <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all shadow-premium">
              <Megaphone className="w-4 h-4" />
              New Broadcast
           </button>
        </div>
      </div>

      {/* Strategic Insights Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Active Threads" value="12" variant="tonal-info" icon={MessageSquare} trend={{ direction: 'up', value: '4' }} />
        <MetricCard label="Network Reach" value="98.4%" variant="tonal-success" icon={Zap} trend={{ direction: 'neutral', value: 'LIVE' }} />
        <MetricCard label="Pending Sync" value="4" variant="tonal-warning" icon={Clock} />
        <MetricCard label="System Status" value="Secure" variant="tonal-success" icon={ShieldCheck} />
      </div>

      {/* Collaboration Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Primary Broadcast Stream */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-900">Strategic Broadcasts</h2>
            </div>
            <button className="text-[10px] font-medium text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Registry View</button>
          </div>

          <div className="space-y-4">
            {MOCK_BROADCASTS.map((item) => (
              <div key={item.id} className="group bg-white p-6 rounded-[24px] border border-slate-200 hover:border-slate-400 transition-all shadow-premium flex items-start justify-between gap-6 cursor-pointer">
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                    <Activity className="w-6 h-6 stroke-[1.5px]" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[8px] font-medium uppercase tracking-[0.15em]">{item.category}</span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{item.time}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{item.title}</h3>
                    <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">Authorized by: <span className="text-slate-600">{item.author}</span></p>
                  </div>
                </div>
                <button className="p-3 text-slate-200 group-hover:text-slate-900 transition-all">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Threads Column */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-900">Active Threads</h2>
          </div>

          <div className="space-y-3">
              {MOCK_THREADS.map((thread) => (
                <div key={thread.id} className="bg-white p-5 rounded-[16px] border border-slate-200 hover:shadow-premium transition-all cursor-pointer group">
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${thread.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{thread.status}</span>
                     </div>
                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{thread.time}</span>
                   </div>
                   <h4 className="text-[14px] font-bold text-slate-900 tracking-tight mb-2 leading-tight">{thread.title}</h4>
                   <p className="text-[12px] font-medium text-slate-500 line-clamp-1 italic">"{thread.lastMessage}"</p>
                  
                  <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-4">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-7 h-7 rounded-[8px] border-2 border-white bg-slate-50 flex items-center justify-center text-[8px] font-bold text-slate-400 shadow-sm">
                             {i}
                          </div>
                        ))}
                     </div>
                     <button className="text-slate-300 group-hover:text-slate-900 transition-all">
                        <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
               </div>
             ))}
             
              <button className="w-full py-4 rounded-[16px] border border-dashed border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-widest hover:border-slate-400 hover:text-slate-900 hover:bg-white transition-all flex items-center justify-center gap-2.5">
                 <Plus className="w-4 h-4" />
                 Initiate Thread
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
