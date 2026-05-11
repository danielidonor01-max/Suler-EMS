"use client";

import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3,
  Globe,
  Layers,
  MoreVertical,
  Activity,
  History,
  Zap,
  ArrowRightLeft
} from 'lucide-react';
import { useOrganization, Hub, Department } from '@/context/OrganizationContext';
import { 
  CreateHubModal, 
  EditHubModal, 
  CreateDepartmentModal, 
  EditDepartmentModal 
} from '@/components/modals/OrganizationModals';
import { DataTable } from '@/components/tables/DataTable';
import { MetricCard } from '@/components/dashboard/MetricCard';

export default function OrganizationPage() {
  const { hubs, departments, currentHub, switchHub, deleteHub, deleteDepartment, undoMutation, canUndo } = useOrganization();
  
  // Modal states
  const [isCreateHubOpen, setIsCreateHubOpen] = useState(false);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Filtered views based on current context
  const filteredHubs = hubs.filter(h => h.id !== 'HUB-00');
  const filteredDepts = currentHub === 'All Regions' 
    ? departments 
    : departments.filter(d => d.parentHub === currentHub);

  const hubColumns = [
    {
      header: "Regional Hub",
      accessor: "name",
      render: (val: string, hub: Hub) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-slate-900 tracking-tight leading-none mb-1">{hub.name}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{hub.geography}</span>
          </div>
        </div>
      )
    },
    {
      header: "Classification",
      accessor: "category",
      render: (val: string) => (
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{val}</span>
      )
    },
    {
      header: "Departments",
      accessor: "departments",
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-900 font-bold text-[13px]">{val} Units</span>
        </div>
      )
    },
    {
      header: "Principal Staff",
      accessor: "staff",
      render: (val: number) => (
        <span className="text-slate-900 font-bold text-[13px]">{val} Members</span>
      )
    }
  ];

  const deptColumns = [
    {
      header: "Operational Unit",
      accessor: "name",
      render: (val: string, dept: Department) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-slate-900 tracking-tight leading-none mb-1">{dept.name}</span>
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">{dept.parentHub}</span>
          </div>
        </div>
      )
    },
    {
      header: "Functional Lead",
      accessor: "lead",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400 uppercase">
            {val.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-slate-900 font-bold text-[13px]">{val}</span>
        </div>
      )
    },
    {
      header: "Registry Size",
      accessor: "staff",
      render: (val: number) => (
        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">{val} Staff</span>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      
      {/* Executive Command Surface */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
             <div className="px-2.5 py-1 bg-slate-950 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                Enterprise Topology
             </div>
             {canUndo && (
               <button 
                 onClick={undoMutation}
                 className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 uppercase tracking-widest transition-all"
               >
                 <History className="w-3 h-3" />
                 Undo Mutation
               </button>
             )}
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter leading-none">
              Organization Governance
            </h1>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Advanced executive control over regional hubs, departmental entities, and structural hierarchy across the enterprise.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsCreateHubOpen(true)}
             className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm"
           >
              <Plus className="w-[18px] h-[18px] stroke-[1.5px]" />
              New Hub
           </button>
           <button 
             onClick={() => setIsCreateDeptOpen(true)}
             className="bg-slate-950 hover:bg-slate-900 text-white flex items-center gap-2 px-8 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
           >
              <Zap className="w-[18px] h-[18px] stroke-[1.5px]" />
              Establish Department
           </button>
        </div>
      </div>

      {/* Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Active Hubs" value={filteredHubs.length.toString()} icon={MapPin} variant="tonal-info" />
        <MetricCard label="Global Units" value={departments.length.toString()} icon={Layers} variant="tonal-info" />
        <MetricCard label="Context Integrity" value="High" icon={ShieldCheck} variant="tonal-success" />
        <MetricCard label="Structural Health" value="98%" icon={Activity} variant="tonal-success" />
      </div>

      {/* Hub Management Surface */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
               <Building2 className="w-4 h-4 text-slate-400" />
               <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Regional Hub Registry</h2>
            </div>
         </div>
         <DataTable 
           title="Office Hubs"
           description="Strategic regional nodes and corporate headquarters governing organizational operations."
           data={filteredHubs}
           columns={hubColumns}
           rowActions={[
             { label: 'Edit Hub', icon: Edit3, onClick: (hub: Hub) => setSelectedHub(hub) },
             { label: 'Switch Context', icon: ArrowRightLeft, onClick: (hub: Hub) => switchHub(hub.id) },
             { label: 'Dissolve Hub', icon: Trash2, onClick: (hub: Hub) => deleteHub(hub.id), variant: 'danger' }
           ]}
         />
      </div>

      {/* Department Management Surface */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
               <Briefcase className="w-4 h-4 text-slate-400" />
               <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Departmental Infrastructure</h2>
            </div>
            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
               Active Context: {currentHub}
            </div>
         </div>
         <DataTable 
           title="Operational Departments"
           description="Functional units and specialized leadership clusters within the selected hub."
           data={filteredDepts}
           columns={deptColumns}
           rowActions={[
             { label: 'Edit Dept', icon: Edit3, onClick: (dept: Department) => setSelectedDept(dept) },
             { label: 'Dissolve Unit', icon: Trash2, onClick: (dept: Department) => deleteDepartment(dept.id), variant: 'danger' }
           ]}
         />
      </div>

      {/* Modals */}
      <CreateHubModal isOpen={isCreateHubOpen} onClose={() => setIsCreateHubOpen(false)} />
      {selectedHub && (
        <EditHubModal 
          isOpen={true} 
          onClose={() => setSelectedHub(null)} 
          hub={selectedHub} 
        />
      )}

      <CreateDepartmentModal isOpen={isCreateDeptOpen} onClose={() => setIsCreateDeptOpen(false)} />
      {selectedDept && (
        <EditDepartmentModal 
          isOpen={true} 
          onClose={() => setSelectedDept(null)} 
          dept={selectedDept} 
        />
      )}
    </div>
  );
}
