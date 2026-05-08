"use client";

import React, { useState, useMemo } from 'react';
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CapabilityIntelligence } from "@/components/dashboard/CapabilityIntelligence";
import { DataTable } from "@/components/tables/DataTable";
import { Drawer } from "@/components/common/Drawer";
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  Mail, 
  UserPlus, 
  Sparkles, 
  Search,
  Activity,
  ShieldCheck,
  Building2,
  Calendar,
  MoreVertical,
  Clock,
  History,
  Layout,
  Target,
  AlertTriangle
} from 'lucide-react';

import { useWorkforce, Employee } from "@/context/WorkforceContext";
import { InviteUserModal } from "@/components/modals/InviteUserModal";
import { ConflictResolutionPortal } from "@/components/common/ConflictResolutionPortal";
import { useMutation } from "@/hooks/useMutation";

export default function EmployeesPage() {
  const { employees, updateEmployee, undoMutation, canUndo } = useWorkforce();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // Conflict State
  const [conflictData, setConflictData] = useState<{
    isOpen: boolean;
    entityName: string;
    localState: any;
    serverState: any;
    id: string;
  }>({
    isOpen: false,
    entityName: '',
    localState: null,
    serverState: null,
    id: ''
  });

  const { mutate: dispatchUpdate } = useMutation(
    async ({ id, updates }: { id: string, updates: any }) => {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1000));
      return updateEmployee(id, updates);
    },
    {
      activityLabel: 'Identity Synchronized',
      activityType: 'GOVERNANCE',
      successMessage: 'Identity metadata synchronized across nodes.',
      onError: (err: any) => {
        if (err.status === 409) {
          const emp = employees.find(e => e.id === conflictData.id) || selectedEmployee;
          setConflictData(prev => ({
            ...prev,
            isOpen: true,
            entityName: emp?.name || 'Unknown Entity',
            localState: { ...emp, status: 'MODIFIED' }, // Mock what we tried to do
            serverState: { ...emp, _v: err.serverVersion }
          }));
        }
      }
    }
  );

  const activeCount = useMemo(() => employees.filter(e => e.status === 'ACTIVE').length, [employees]);
  const pendingCount = useMemo(() => employees.filter(e => e.status === 'PENDING').length, [employees]);

  const columns = [
    {
      header: "Staff Member",
      accessor: "name",
      render: (val: string, emp: Employee) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] uppercase">
            {emp.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-black text-slate-900 tracking-tight leading-none mb-1">{emp.name}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{emp.id}</span>
          </div>
        </div>
      )
    },
    {
      header: "Hub / Office",
      accessor: "office",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="text-slate-700 font-bold text-[13px]">{val}</span>
        </div>
      )
    },
    {
      header: "Department",
      accessor: "department",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <span className="text-slate-500 font-medium text-[13px]">{val}</span>
        </div>
      )
    },
    {
      header: "Designation",
      accessor: "role",
      render: (val: string) => (
        <span className="text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">{val}</span>
      )
    },
    {
      header: "Operational Status",
      accessor: "status",
      render: (val: string) => (
        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg border ${
          val === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
          val === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
          'bg-slate-50 text-slate-600 border-slate-100'
        }`}>
          <div className={`w-1 h-1 rounded-full ${val === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span className="text-[9px] font-black uppercase tracking-widest">{val}</span>
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
             <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Operational Integrity
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-200" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Hub: Lagos HQ</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
              Workforce Registry
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Advanced executive control over organizational staff entities, operational designations, and governance protocols.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {canUndo && (
             <button 
               onClick={undoMutation}
               className="bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 px-6 h-[44px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 animate-in slide-in-from-right-4"
             >
                <History className="w-[18px] h-[18px] stroke-[2px]" />
                Undo Mutation
             </button>
           )}
           <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 h-[44px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2">
              <Layout className="w-[18px] h-[18px] stroke-[1.5px]" />
              View Org Chart
           </button>
           <button 
             onClick={() => setIsInviteModalOpen(true)}
             className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md"
           >
              <UserPlus className="w-[18px] h-[18px] stroke-[1.5px]" />
              Onboard Member
           </button>
        </div>
      </div>

      {/* Strategic Intelligence Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Entities" value={employees.length.toLocaleString()} trend={{ direction: 'up', value: 'GLOBAL' }} icon={Users} variant="tonal-info" />
        <MetricCard label="Active Status" value={activeCount.toLocaleString()} trend={{ direction: 'neutral', value: 'LIVE' }} icon={UserCheck} variant="tonal-success" />
        <MetricCard label="Pending Provisioning" value={pendingCount.toLocaleString()} variant="tonal-warning" icon={Activity} />
        <MetricCard label="System Sync" value="Nominal" trend={{ direction: 'up', value: 'SYNCED' }} icon={ShieldCheck} variant="tonal-success" />
      </div>

      {/* Operational Registry Stream */}
      <DataTable 
        title="Principal Staff Registry"
        description="Comprehensive record of organizational entities, departmental hubs, and operational designations."
        data={employees}
        columns={columns}
        onRowClick={(row) => setSelectedEmployee(row)}
        emptyMessage="No staff members discovered in this registry."
        recoveryAction={{
          label: "Onboard Member",
          icon: UserPlus,
          onClick: () => setIsInviteModalOpen(true)
        }}
      />

      {/* Global Provisioning Pipeline Modal */}
      <InviteUserModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* Governance Conflict Resolution Portal */}
      <ConflictResolutionPortal 
        isOpen={conflictData.isOpen}
        onClose={() => setConflictData(prev => ({ ...prev, isOpen: false }))}
        entityName={conflictData.entityName}
        localState={conflictData.localState}
        serverState={conflictData.serverState}
        onResolve={(action) => {
          if (action === 'RELOAD') {
            // In a real app, we'd fetch latest. Here we just sync with localStorage
            window.location.reload();
          } else if (action === 'OVERWRITE') {
            // Force update by ignoring version or passing latest version
            updateEmployee(conflictData.id, { ...conflictData.localState, _v: conflictData.serverState._v });
            setConflictData(prev => ({ ...prev, isOpen: false }));
          } else {
            setConflictData(prev => ({ ...prev, isOpen: false }));
          }
        }}
      />

      {/* Contextual Intelligence Surface (Drawer) */}
      <Drawer 
        isOpen={!!selectedEmployee} 
        onClose={() => setSelectedEmployee(null)}
        title={selectedEmployee?.name || ''}
        subtitle={selectedEmployee?.id || ''}
      >
        <div className="space-y-10 animate-in">
           {/* Member Summary Block */}
           <div className="flex items-center gap-6 p-7 rounded-[20px] bg-slate-50 border border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 text-2xl font-black shadow-sm">
                {selectedEmployee?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="space-y-2">
                 <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      selectedEmployee?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {selectedEmployee?.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Joined: {selectedEmployee?.joinedAt}
                    </span>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{selectedEmployee?.name}</h3>
                 <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest opacity-70">{selectedEmployee?.role}</p>
              </div>
           </div>

           {/* Core Hub Data */}
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1.5">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Institutional Email</span>
                 <p className="text-[14px] font-bold text-slate-900">{selectedEmployee?.email}</p>
              </div>
              <div className="space-y-1.5">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Operational Hub</span>
                 <p className="text-[14px] font-bold text-slate-900">{selectedEmployee?.office}</p>
              </div>
              <div className="space-y-1.5">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Primary Department</span>
                 <p className="text-[14px] font-bold text-slate-900">{selectedEmployee?.department}</p>
              </div>
              <div className="space-y-1.5">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Contact Identity</span>
                 <p className="text-[14px] font-bold text-slate-900">{selectedEmployee?.phone || 'Not Configured'}</p>
              </div>
           </div>

           {/* Capability Intelligence - Strategic Visual */}
           <CapabilityIntelligence 
              title="Individual Capability Profile"
              data={[
                { category: 'Technical', value: 92 },
                { category: 'Comm.', value: 78 },
                { category: 'Lead.', value: 65 },
                { category: 'Creativity', value: 88 },
                { category: 'Problem Solving', value: 95 },
              ]}
              insight={`${selectedEmployee?.name} displays high technical proficiency and exceptional problem-solving capabilities within the ${selectedEmployee?.department} department. Recommended for growth track in Q3.`}
           />

           {/* Actions Intelligence */}
           <div className="grid grid-cols-2 gap-4">
               <button 
                 onClick={() => {
                   if (selectedEmployee) {
                     setConflictData(prev => ({ ...prev, id: selectedEmployee.id }));
                     // Force a version check failure by passing a stale version (0)
                     dispatchUpdate({ id: selectedEmployee.id, updates: { status: 'ACTIVE' } });
                   }
                 }}
                 className="flex items-center justify-center gap-3 h-[44px] rounded-xl border border-rose-200 hover:bg-rose-50 text-[10px] font-black text-rose-600 uppercase tracking-widest transition-all shadow-sm"
               >
                  <AlertTriangle className="w-4 h-4 stroke-[1.5px]" />
                  Simulate Conflict
               </button>
               <button className="flex items-center justify-center gap-3 h-[44px] rounded-xl border border-slate-200 hover:bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-widest transition-all shadow-sm">
                  <Calendar className="w-4 h-4 stroke-[1.5px]" />
                  Shift Registry
               </button>
           </div>
        </div>
      </Drawer>
    </div>
  );
}
