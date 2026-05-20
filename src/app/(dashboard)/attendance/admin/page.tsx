"use client";

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  Filter, 
  Download,
  Fingerprint,
  Zap,
  Activity,
  ShieldCheck,
  History,
  ArrowRight,
  Target
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Drawer } from '@/components/common/Drawer';
import { EmptyState } from '@/components/common/EmptyState';

// Initial Mock Data
const MOCK_ATTENDANCE = [
  { id: 'att-001', staffName: 'Chinedu Okoro', checkIn: '08:00 AM', status: 'ON_TIME', department: 'Executive', staffId: 'SUL-001' },
  { id: 'att-002', staffName: 'Sarah Williams', checkIn: '08:15 AM', status: 'LATE', department: 'Operations', staffId: 'SUL-002' },
  { id: 'att-003', staffName: 'David Okafor', checkIn: '07:55 AM', status: 'ON_TIME', department: 'Finance', staffId: 'SUL-003' },
  { id: 'att-004', staffName: 'Blessing Udoh', checkIn: '09:00 AM', status: 'LATE', department: 'HR', staffId: 'SUL-004' },
];

export default function AttendancePage() {
  const [data] = useState(MOCK_ATTENDANCE);
  const [selectedLog, setSelectedLog] = useState<typeof MOCK_ATTENDANCE[0] | null>(null);

  const columns = [
    {
      header: "Staff Member",
      accessor: "staffName",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
              {val.split(' ').map(n => n[0]).join('')}
           </div>
           <div>
              <div className="text-[14px] font-bold text-slate-900 tracking-tight leading-none mb-1">{val}</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{row.department}</div>
           </div>
        </div>
      )
    },
    {
      header: "Log Time",
      accessor: "checkIn",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[13px] font-bold text-slate-600">{val}</span>
        </div>
      )
    },
    {
      header: "Registry Status",
      accessor: "status",
      render: (val: string) => (
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border ${
          val === 'ON_TIME' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          <div className={`w-1 h-1 rounded-full ${val === 'ON_TIME' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
          <span className="text-[9px] font-medium uppercase tracking-widest">{val.replace('_', ' ')}</span>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in space-y-12">
      
      {/* Executive Command Hub - Floating Layout */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
             <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Fingerprint className="w-3 h-3" />
                Biometric Sync Active
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-200" />
             <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Network Status: Stable</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter leading-none">
              Attendance & Presence
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Real-time executive monitoring of workforce presence, punctuality trends, and automated biometric reconciliation datasets.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 h-[44px] rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2">
              <Download className="w-[18px] h-[18px] stroke-[1.5px]" />
              Export Logs
           </button>
           <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 h-[44px] rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all shadow-premium">
              <RefreshCcw className="w-[18px] h-[18px] stroke-[1.5px]" />
              Reconcile Devices
           </button>
        </div>
      </div>

      {/* Operational Presence Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Present Today" value="1,156" trend={{ direction: 'up', value: '4.2%' }} variant="tonal-success" icon={CheckCircle2} />
        <MetricCard label="Late Arrivals" value="12" trend={{ direction: 'down', value: '2.1%' }} variant="tonal-warning" icon={History} />
        <MetricCard label="Remote Sync" value="42" variant="tonal-info" icon={Activity} />
        <MetricCard label="System Health" value="Optimal" variant="tonal-success" icon={ShieldCheck} />
      </div>

      {/* Registry Surface */}
      {data.length > 0 ? (
        <DataTable 
          title="Presence Registry"
          description="Consolidated log of biometric check-ins and operational presence signals across all organization hubs."
          data={data}
          columns={columns}
          onRowClick={(row) => setSelectedLog(row)}
        />
      ) : (
        <div className="p-20 bg-white border border-slate-200 rounded-[24px] shadow-premium">
           <EmptyState 
            title="No Attendance Logs Detected" 
            description="The biometric synchronization has not yet transmitted today's presence datasets for this workspace hub."
            actionLabel="Initiate Manual Sync"
            onAction={() => {}}
            icon={Fingerprint}
           />
        </div>
      )}

      {/* Attendance Detail Surface (Drawer) */}
      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.staffName || ''}
        subtitle={selectedLog?.staffId}
      >
         <div className="space-y-10 animate-in">
            {/* Summary Block */}
            <div className="p-7 bg-slate-50 border border-slate-200 rounded-[16px] space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-[14px] font-bold text-slate-900">{selectedLog?.staffName}</span>
                     <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{selectedLog?.department}</span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-medium uppercase tracking-widest ${
                    selectedLog?.status === 'ON_TIME' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {selectedLog?.status.replace('_', ' ')}
                  </div>
               </div>
 
               <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-6">
                  <div className="space-y-1.5">
                     <span className="text-[9px] font-medium text-slate-300 uppercase tracking-widest">Check-in Time</span>
                     <p className="text-[14px] font-bold text-slate-900">{selectedLog?.checkIn}</p>
                  </div>
                  <div className="space-y-1.5">
                     <span className="text-[9px] font-medium text-slate-300 uppercase tracking-widest">Device Source</span>
                     <p className="text-[14px] font-bold text-slate-900">Terminal 04 (HQ)</p>
                  </div>
               </div>
            </div>

            {/* Precision Timeline */}
            <div className="space-y-5">
               <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Operational History</h4>
               </div>
              <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                 {[
                   { label: 'Check-in Recorded', desc: 'Verified via biometric scan at Main Entrance.', time: '08:00 AM' },
                   { label: 'System Sync', desc: 'Registry updated across all operational hubs.', time: '08:01 AM' }
                 ].map((log, i) => (
                   <div key={i} className="relative pl-10">
                      <div className="absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full bg-slate-900 ring-4 ring-slate-50" />
                      <div className="flex justify-between items-start">
                        <p className="text-[12px] font-bold text-slate-900">{log.label}</p>
                        <span className="text-[10px] font-medium text-slate-300">{log.time}</span>
                     </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-relaxed">{log.desc}</p>
                   </div>
                 ))}
              </div>
           </div>

            {/* Actions Intelligence */}
            <div className="pt-6 border-t border-slate-100 flex gap-3">
               <button className="flex-1 bg-slate-900 hover:bg-black text-white h-[44px] rounded-[12px] text-[11px] font-bold uppercase tracking-widest shadow-premium transition-all flex items-center justify-center gap-2">
                  <RefreshCcw className="w-4 h-4 stroke-[1.5px]" />
                  Reconcile Log
               </button>
               <button className="w-[44px] h-[44px] flex items-center justify-center border border-slate-200 text-slate-400 rounded-[12px] hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
                  <ArrowRight className="w-4 h-4 stroke-[1.5px]" />
               </button>
            </div>
        </div>
      </Drawer>
    </div>
  );
}
