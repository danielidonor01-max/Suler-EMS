"use client";

import React, { useState } from 'react';
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CapabilityIntelligence } from "@/components/dashboard/CapabilityIntelligence";
import { DataTable } from "@/components/tables/DataTable";
import { Drawer } from "@/components/common/Drawer";
import { Modal } from "@/components/modals/Modal";
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
  AlertTriangle,
  Edit3,
  UserCog,
  UserMinus
} from 'lucide-react';

import { useWorkforce, Employee } from "@/context/WorkforceContext";
import { EditEmployeeModal, SuspendAccessModal, ModifyRoleModal } from "@/components/modals/WorkforceModals";
import { ForensicTimelineDrawer } from "@/components/drawers/ForensicTimelineDrawer";
import { ConflictResolutionPortal } from "@/components/common/ConflictResolutionPortal";
import { Select } from "@/components/forms/Select";

export default function EmployeesPage() {
  const { employees, updateEmployee } = useWorkforce();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  
  // Governance Interaction State
  const [activeGovernance, setActiveGovernance] = useState<{ 
    type: 'EDIT' | 'ROLE' | 'SUSPEND' | 'AUDIT' | null, 
    employee: Employee | null 
  }>({ type: null, employee: null });

  // Onboarding Form State
  const [hub, setHub] = useState('lagos');
  const [designation, setDesignation] = useState('engineer');
  
  // Governance Row Actions
  const rowActions = [
    { 
      label: 'Edit Identity', 
      icon: Edit3, 
      onClick: (emp: Employee) => setActiveGovernance({ type: 'EDIT', employee: emp }) 
    },
    { 
      label: 'Modify Role', 
      icon: UserCog, 
      onClick: (emp: Employee) => setActiveGovernance({ type: 'ROLE', employee: emp }) 
    },
    { 
      label: 'Audit Trail', 
      icon: History, 
      onClick: (emp: Employee) => setActiveGovernance({ type: 'AUDIT', employee: emp }) 
    },
    { 
      label: 'Suspend Access', 
      icon: UserMinus, 
      onClick: (emp: Employee) => setActiveGovernance({ type: 'SUSPEND', employee: emp }), 
      variant: 'danger' as const 
    },
  ];

  const columns = [
    {
      header: "Staff Member",
      accessor: "name",
      render: (val: string, emp: Employee) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] uppercase">
            {emp.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-slate-900 tracking-tight leading-none mb-1">{emp.name}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{emp.id}</span>
          </div>
        </div>
      )
    },
    {
      header: "Department",
      accessor: "office",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <span className="text-slate-700 font-bold text-[13px]">{val}</span>
        </div>
      )
    },
    {
      header: "Designation",
      accessor: "role",
      render: (val: string) => (
        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">{val}</span>
      )
    },
    {
      header: "Operational Status",
      accessor: "status",
      render: (val: string) => (
        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg border ${
          val === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          <div className={`w-1 h-1 rounded-full ${val === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span className="text-[9px] font-bold uppercase tracking-widest">{val}</span>
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
             <div className="px-2.5 py-1 bg-slate-950 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Operational Integrity
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-200" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Hub: Lagos HQ</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter leading-none">
              Workforce Registry
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Advanced executive control over organizational staff entities, operational designations, and governance protocols.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2">
              <Layout className="w-[18px] h-[18px] stroke-[1.5px]" />
              View Org Chart
           </button>
           <button 
             onClick={() => setIsOnboardingOpen(true)}
             className="bg-slate-950 hover:bg-slate-900 text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
           >
              <UserPlus className="w-[18px] h-[18px] stroke-[1.5px]" />
              Onboard Member
           </button>
        </div>
      </div>

      {/* Strategic Intelligence Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Entities" value="1,284" trend={{ direction: 'up', value: '12%' }} icon={Users} variant="tonal-info" />
        <MetricCard label="Active Status" value="1,156" trend={{ direction: 'neutral', value: 'LIVE' }} icon={UserCheck} variant="tonal-success" />
        <MetricCard label="Role Readiness" value="42" variant="tonal-info" icon={Briefcase} />
        <MetricCard label="System Sync" value="Nominal" trend={{ direction: 'up', value: 'QUEUE' }} icon={Activity} variant="tonal-success" />
      </div>

      {/* Operational Registry Stream */}
      <DataTable 
        title="Principal Staff Registry"
        description="Comprehensive record of organizational entities, departmental hubs, and operational designations."
        data={employees}
        columns={columns}
        rowActions={rowActions}
        onRowClick={(row) => setSelectedEmployee(row)}
      />

      {/* Onboarding Workflow - Centered Modal */}
      <Modal 
        isOpen={isOnboardingOpen} 
        onClose={() => setIsOnboardingOpen(false)}
      >
        <div className="modal-content-padding space-y-8 animate-in">
           <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Onboard Principal Staff</h3>
              <p className="text-[13px] font-medium text-slate-400">Identity & Access Governance</p>
           </div>

           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Legal Name</label>
                 <input type="text" className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 focus:bg-white rounded-xl p-4 h-[48px] text-[13px] font-bold outline-none transition-all" placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Corporate Identity (Email)</label>
                 <input type="email" className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 focus:bg-white rounded-xl p-4 h-[48px] text-[13px] font-bold outline-none transition-all" placeholder="j.doe@sulerglobal.com" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8">
              <Select 
                label="Operational Hub"
                value={hub}
                onChange={setHub}
                options={[
                  { label: 'Lagos HQ', value: 'lagos' },
                  { label: 'Abuja Operations', value: 'abuja' },
                  { label: 'Port Harcourt Hub', value: 'ph' }
                ]}
              />
              <Select 
                label="Principal Designation"
                value={designation}
                onChange={setDesignation}
                options={[
                  { label: 'Senior Engineer', value: 'engineer' },
                  { label: 'Operational Lead', value: 'lead' },
                  { label: 'Finance Controller', value: 'finance' }
                ]}
              />
           </div>

           <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Sparkles className="w-5 h-5 stroke-[1.5px]" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[12px] font-bold text-slate-900 leading-none">Automated Security Provisioning</p>
                    <p className="text-[10px] font-bold text-slate-400 leading-none">Standard identity protocols will be applied immediately.</p>
                 </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-[9px] font-bold uppercase tracking-widest">
                 System Active
              </div>
           </div>

           <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
              <button onClick={() => setIsOnboardingOpen(false)} className="px-8 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 transition-all">Cancel</button>
              <button className="bg-slate-950 hover:bg-slate-900 text-white px-10 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-slate-950/10">Initialize Member</button>
           </div>
        </div>
      </Modal>

      {/* Governance command Surface Modals */}
      {activeGovernance.type === 'EDIT' && activeGovernance.employee && (
        <EditEmployeeModal 
          isOpen={true}
          onClose={() => setActiveGovernance({ type: null, employee: null })}
          employee={activeGovernance.employee}
        />
      )}

      {activeGovernance.type === 'ROLE' && activeGovernance.employee && (
        <ModifyRoleModal 
          isOpen={true}
          onClose={() => setActiveGovernance({ type: null, employee: null })}
          employee={activeGovernance.employee}
        />
      )}

      {activeGovernance.type === 'SUSPEND' && activeGovernance.employee && (
        <SuspendAccessModal 
          isOpen={true}
          onClose={() => setActiveGovernance({ type: null, employee: null })}
          employee={activeGovernance.employee}
        />
      )}

      {activeGovernance.type === 'AUDIT' && activeGovernance.employee && (
        <ForensicTimelineDrawer 
          isOpen={true}
          onClose={() => setActiveGovernance({ type: null, employee: null })}
          employee={activeGovernance.employee}
        />
      )}

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
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 text-2xl font-bold shadow-sm">
                {selectedEmployee?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="space-y-2">
                 <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest border border-emerald-100">Verified</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Jan 2024</span>
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{selectedEmployee?.name}</h3>
                 <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest opacity-70">{selectedEmployee?.role}</p>
              </div>
           </div>

           {/* Core Hub Data */}
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1.5">
                 <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Email Identity</span>
                 <p className="text-[14px] font-bold text-slate-900">{selectedEmployee?.email}</p>
              </div>
              <div className="space-y-1.5">
                 <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Operational Hub</span>
                 <p className="text-[14px] font-bold text-slate-900">{selectedEmployee?.office}</p>
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
              insight={`${selectedEmployee?.name} displays high technical proficiency and exceptional problem-solving capabilities. Recommended for senior technical leadership track in Q3.`}
           />

           {/* Intelligence Timeline */}
           <div className="space-y-5">
              <div className="flex items-center gap-2">
                 <Target className="w-4 h-4 text-slate-400" />
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Operational History</h4>
              </div>
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                 {[
                   { label: 'Governance Review', desc: 'Protocol audit completed successfully.', time: '2d ago' },
                   { label: 'Access Modification', desc: 'Enhanced authorization levels granted.', time: '5h ago' }
                 ].map((log, i) => (
                   <div key={i} className="relative pl-10">
                      <div className="absolute left-2.5 top-1.5 w-1.5 h-1.5 rounded-full bg-slate-950 ring-4 ring-slate-50" />
                      <div className="flex justify-between items-start">
                         <p className="text-[12px] font-bold text-slate-900">{log.label}</p>
                         <span className="text-[10px] font-bold text-slate-300">{log.time}</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-relaxed">{log.desc}</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Actions Intelligence */}
           <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 h-[44px] rounded-xl border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-widest transition-all shadow-sm">
                 <ShieldCheck className="w-4 h-4 stroke-[1.5px]" />
                 Security Audit
              </button>
              <button className="flex items-center justify-center gap-3 h-[44px] rounded-xl border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-widest transition-all shadow-sm">
                 <Calendar className="w-4 h-4 stroke-[1.5px]" />
                 Shift Registry
              </button>
           </div>
        </div>
      </Drawer>
    </div>
  );
}
