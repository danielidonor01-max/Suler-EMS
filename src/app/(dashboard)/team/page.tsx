"use client";

import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  Activity, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Zap,
  TrendingUp,
  Mail,
  ArrowRight
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CapabilityIntelligence } from '@/components/dashboard/CapabilityIntelligence';

const MOCK_TEAM = [
  { id: '1', name: 'Alex Okereke', role: 'DevOps Engineer', status: 'ON_TIME', load: 85, skills: ['Cloud', 'Security'] },
  { id: '2', name: 'Sarah Williams', role: 'Ops Analyst', status: 'LATE', load: 92, skills: ['Logistics', 'Analytics'] },
  { id: '3', name: 'David Okafor', role: 'Fin Controller', status: 'ON_TIME', load: 60, skills: ['Audit', 'Payroll'] },
  { id: '4', name: 'John Doe', role: 'HR Lead', status: 'ON_TIME', load: 45, skills: ['Governance', 'Onboarding'] },
];

export default function TeamPage() {
  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">
      
      {/* Executive Hero */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Target className="w-3 h-3" />
                Manager Command Active
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Team Intelligence
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Managerial overview of team performance, competency distribution, and operational workload balancing.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <button className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all">
                Team Schedule
             </button>
             <button className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md">
                Allocate Resources
             </button>
          </div>
        </div>
      </div>

      {/* Team Performance Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Average Workload" value="72%" trend={{ direction: 'up', value: '5%' }} variant="tonal-info" icon={Zap} />
        <MetricCard label="Team Attendance" value="98%" trend={{ direction: 'neutral', value: 'LIVE' }} variant="tonal-success" icon={CheckCircle2} />
        <MetricCard label="Skill Readiness" value="84%" trend={{ direction: 'up', value: '2%' }} variant="tonal-info" icon={TrendingUp} />
        <MetricCard label="Pending Reviews" value="3" variant="tonal-warning" icon={Activity} />
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {MOCK_TEAM.map(member => (
           <div key={member.id} className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-sm font-black">
                    {member.name.split(' ').map(n => n[0]).join('')}
                 </div>
                 <button className="text-slate-300 hover:text-slate-900">
                    <MoreVertical className="w-4 h-4" />
                 </button>
              </div>

              <div className="space-y-1 mb-6">
                 <h4 className="text-[15px] font-black text-slate-900 tracking-tight leading-none">{member.name}</h4>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Workload</span>
                    <span className={`text-[10px] font-black ${member.load > 90 ? 'text-rose-500' : 'text-slate-900'}`}>{member.load}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${member.load > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${member.load}%` }} 
                    />
                 </div>

                 <div className="flex items-center justify-between pt-2">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                      member.status === 'ON_TIME' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {member.status.replace('_', ' ')}
                    </div>
                    <button className="text-slate-300 group-hover:text-slate-900 transition-all">
                       <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Team Capability Intelligence */}
         <div className="lg:col-span-1">
            <CapabilityIntelligence 
              title="Team Capability Profile"
              data={[
                { category: 'Technical', value: 85 },
                { category: 'Comm.', value: 70 },
                { category: 'Lead.', value: 92 },
                { category: 'Creativity', value: 65 },
                { category: 'Ops.', value: 88 },
              ]}
              insight="Team leadership readiness exceeds organization average by 14%. Communication proficiency identifies a mentorship opportunity for junior analysts."
            />
         </div>

         {/* Upcoming Availability */}
         <div className="bg-white p-8 rounded-[24px] border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Clock className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Team Availability</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Upcoming absences & Schedule sync</p>
               </div>
            </div>
            <div className="space-y-3">
               {[
                 { name: 'Sarah Williams', date: 'Next Monday', type: 'Annual Leave' },
                 { name: 'John Doe', date: 'Fri, 12 May', type: 'Sick Leave' }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                          {item.name[0]}
                       </div>
                       <span className="text-[13px] font-bold text-slate-900">{item.name}</span>
                    </div>
                    <div className="text-right">
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{item.date}</p>
                       <p className="text-[10px] font-bold text-indigo-500/70 uppercase tracking-widest mt-0.5">{item.type}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
