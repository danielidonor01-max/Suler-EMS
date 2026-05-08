"use client";

import React, { useState } from 'react';
import { 
  Megaphone, 
  Target, 
  Globe, 
  Building2, 
  ShieldCheck, 
  Plus, 
  Activity, 
  Users, 
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { DataTable } from '@/components/tables/DataTable';
import { useToast } from '@/components/common/ToastContext';
import { Select } from '@/components/forms/Select';

// Mock Broadcast History
const MOCK_BROADCASTS = [
  { id: 'BRD-001', title: 'Q3 Operational Strategy', author: 'Chinedu Okoro', scope: 'GLOBAL', priority: 'STRATEGIC', sentAt: '2h ago', reach: '92%', ack: '74%' },
  { id: 'BRD-002', title: 'Abuja Hub Policy Update', author: 'Sarah Williams', scope: 'REGIONAL', priority: 'OPERATIONAL', sentAt: '1d ago', reach: '100%', ack: '98%' },
  { id: 'BRD-003', title: 'Security Protocol V2', author: 'David Okafor', scope: 'GLOBAL', priority: 'CRITICAL', sentAt: '3d ago', reach: '100%', ack: '100%' },
];

import { useWorkforce } from '@/context/WorkforceContext';
import { useActivity } from '@/context/ActivityContext';
import { useAccess } from '@/context/AccessContext';

export default function BroadcastCenter() {
  const { employees } = useWorkforce();
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [scope, setScope] = useState('Global (All Entities)');
  const [priority, setPriority] = useState('Strategic Insight');
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const handleDispatch = () => {
    if (!headline || !content) {
      toast({
        type: 'error',
        message: 'Broadcast Failed',
        description: 'Headline and content are required for global directives.'
      });
      return;
    }

    setIsDispatching(true);
    toast({
      type: 'loading',
      message: 'Dispatching Global Directive...',
      description: `Synchronizing with ${employees.length} verified identity nodes.`
    });

    setTimeout(() => {
      setIsDispatching(false);
      setIsModalOpen(false);
      
      pushActivity({
        type: 'SYSTEM',
        label: 'Global Broadcast Dispatched',
        message: `Strategic Directive [${headline}] dispatched to ${employees.length} recipients. Scope: ${scope}.`,
        author: userRole,
        status: 'SUCCESS'
      });

      toast({
        type: 'success',
        message: 'Broadcast Dispatched Successfully',
        description: `Directive queued for ${employees.length} verified recipients.`,
        action: {
          label: 'Audit Trail',
          onClick: () => console.log('Viewing audit trail...')
        }
      });
      setHeadline('');
      setContent('');
    }, 2000);
  };

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12 pb-20">

      {/* High-Authority Broadcast Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
             <div className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 border border-rose-100">
                <Megaphone className="w-3 h-3" />
                Authority Broadcast Center
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-200" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Reach: {employees.length} Entities</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
              Executive Broadcasts
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Dispatch high-authority organizational announcements, policy updates, and strategic directives with targeted precision and audit tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-8 h-[48px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-slate-900/10 group"
           >
              <Plus className="w-[18px] h-[18px] stroke-[1.5px]" />
              New Broadcast
           </button>
        </div>
      </div>

      {/* Strategic Broadcast Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <BroadcastMetric label="Total Reach" value="98.4%" trend="+2.1%" icon={Globe} />
         <BroadcastMetric label="Avg. Acknowledgment" value="84%" trend="Optimal" icon={CheckCircle2} />
         <BroadcastMetric label="Critical Alerts" value="0" trend="Nominal" icon={ShieldCheck} />
         <BroadcastMetric label="Pending Sync" value="12" trend="Queue" icon={Activity} />
      </div>

      {/* Broadcast Registry */}
      <DataTable 
        title="Broadcast Registry"
        description="History of executive-grade directives, organizational policy updates, and critical system alerts."
        data={MOCK_BROADCASTS}
        columns={[
          {
            header: "Broadcast Identity",
            accessor: "title",
            render: (val, brd) => (
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  brd.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[14px] font-black text-slate-900 tracking-tight mb-1">{brd.title}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Author: {brd.author}</p>
                </div>
              </div>
            )
          },
          {
            header: "Scope / Priority",
            accessor: "priority",
            render: (val, brd) => (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-slate-300" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{brd.scope}</span>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md w-fit text-[9px] font-black uppercase tracking-widest border ${
                  brd.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                  brd.priority === 'STRATEGIC' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                  'bg-slate-50 text-slate-600 border-slate-100'
                }`}>
                  {brd.priority}
                </div>
              </div>
            )
          },
          {
            header: "Reach / Engagement",
            accessor: "reach",
            render: (val, brd) => (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-black text-slate-900">{brd.reach}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sent: {brd.sentAt}</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: brd.reach }} />
                </div>
              </div>
            )
          },
          {
            header: "Ack Rate",
            accessor: "ack",
            render: (val) => (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[13px] font-black text-slate-900">{val}</span>
              </div>
            )
          }
        ]}
        emptyMessage="No organizational broadcasts discovered."
        recoveryAction={{
          label: "New Broadcast",
          icon: Plus,
          onClick: () => setIsModalOpen(true)
        }}
      />

      {/* Create Broadcast Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Initialize Global Directive"
        subtitle="Executive Communication Framework"
        size="lg"
      >
         <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Broadcast Headline</label>
               <input 
                 type="text" 
                 value={headline}
                 onChange={(e) => setHeadline(e.target.value)}
                 placeholder="e.g. Mandatory Compliance Certification Update"
                 className="w-full h-[56px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[15px] font-black text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
               />
            </div>

            <div className="grid grid-cols-2 gap-8">
               <Select 
                 label="Target Audience (Scope)"
                 value={scope}
                 onChange={setScope}
                 options={[
                   { label: 'Global (All Entities)', value: 'Global (All Entities)' },
                   { label: 'Hub-Specific (Regional)', value: 'Hub-Specific (Regional)' },
                   { label: 'Department-Specific', value: 'Department-Specific' },
                   { label: 'Role-Specific (e.g. Managers)', value: 'Role-Specific (e.g. Managers)' },
                 ]}
               />
               <Select 
                 label="Directive Priority"
                 value={priority}
                 onChange={setPriority}
                 options={[
                   { label: 'Strategic Insight', value: 'Strategic Insight' },
                   { label: 'Operational Update', value: 'Operational Update' },
                   { label: 'Critical Action Required', value: 'Critical Action Required' },
                   { label: 'High-Priority Alert', value: 'High-Priority Alert' },
                 ]}
               />
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Broadcast Content</label>
               <textarea 
                 rows={6}
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 placeholder="Enter the official directive content here..."
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-[14px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
               />
            </div>

            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[24px] flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                     <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[12px] font-black text-slate-900 leading-none mb-1">Enforce Acknowledgment</p>
                     <p className="text-[10px] font-bold text-slate-400 leading-none uppercase tracking-widest">Requires digital signature upon receipt</p>
                  </div>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
               </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
               <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isDispatching}
                className="px-8 h-[52px] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
               >
                 Discard
               </button>
               <button 
                onClick={handleDispatch}
                disabled={isDispatching}
                className="bg-slate-900 hover:bg-black text-white flex items-center gap-3 px-10 h-[52px] rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 group disabled:opacity-70"
               >
                  {isDispatching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      Dispatch Broadcast
                      <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
               </button>
            </div>
         </div>
      </Modal>
    </div>
  );
}

const BroadcastMetric = ({ label, value, trend, icon: Icon }: any) => (
  <div className="bg-white p-7 border border-slate-200/60 rounded-[28px] shadow-sm group hover:shadow-md transition-all">
     <div className="flex items-center justify-between mb-5">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center">
           <Icon className="w-6 h-6 stroke-[1.5px]" />
        </div>
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">{trend}</span>
     </div>
     <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
     </div>
  </div>
);
