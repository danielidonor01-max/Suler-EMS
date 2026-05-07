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
  Send
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
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">
      {/* Executive Hero */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Encrypted Channels Active
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Organizational Communication
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Unified operational collaboration layer for strategic broadcasts, workflow discussions, and inter-departmental alignment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md">
              <Megaphone className="w-4 h-4" />
              New Broadcast
            </button>
          </div>
        </div>
      </div>

      {/* Operational Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Active Threads" value="12" variant="tonal-info" icon="forum" />
        <MetricCard label="Broadcast Reach" value="98%" variant="tonal-success" icon="campaign" />
        <MetricCard label="Pending Acknowledgments" value="4" variant="tonal-warning" icon="history" />
        <MetricCard label="System Health" value="Stable" variant="tonal-success" icon="check_circle" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Broadcast Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-slate-400" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Strategic Broadcasts</h2>
            </div>
            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
          </div>

          <div className="space-y-4">
            {MOCK_BROADCASTS.map((item) => (
              <div key={item.id} className="group bg-white p-6 rounded-[22px] border border-slate-100 hover:border-slate-300 transition-all shadow-sm flex items-start justify-between gap-6">
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest">{item.category}</span>
                      <span className="text-[11px] font-bold text-slate-400">{item.time}</span>
                    </div>
                    <h3 className="text-[15px] font-black text-slate-900 tracking-tight">{item.title}</h3>
                    <p className="text-[12px] font-bold text-slate-400">By {item.author}</p>
                  </div>
                </div>
                <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Threads */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-slate-400" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Active Threads</h2>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-[24px] border border-slate-100 p-2 space-y-2">
             {MOCK_THREADS.map((thread) => (
               <div key={thread.id} className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                      thread.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {thread.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">{thread.time}</span>
                  </div>
                  <h4 className="text-[13px] font-black text-slate-900 tracking-tight mb-1">{thread.title}</h4>
                  <p className="text-[11px] font-medium text-slate-400 line-clamp-1">{thread.lastMessage}</p>
                  <div className="mt-3 flex items-center justify-between">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                             {i}
                          </div>
                        ))}
                     </div>
                     <span className="text-[10px] font-bold text-slate-400">{thread.participants} members</span>
                  </div>
               </div>
             ))}
             
             <button className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:border-slate-300 hover:text-slate-600 transition-all flex items-center justify-center gap-2">
                <Plus className="w-3.5 h-3.5" />
                New Thread
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
