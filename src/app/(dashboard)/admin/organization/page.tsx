"use client";

import React, { useState } from 'react';
import { 
  Globe, 
  Building2, 
  Users, 
  ShieldCheck, 
  ChevronRight, 
  Plus, 
  MapPin, 
  Network,
  Search,
  MoreVertical,
  Activity,
  Maximize2,
  Building,
  Target,
  Download,
  Zap,
  Trash2
} from 'lucide-react';
import { CreateHubModal, CreateDeptModal } from '@/components/modals/OrganizationModals';

// Mock Organizational Data
const ORG_STRUCTURE = [
  {
    id: 'lagos-hq',
    name: 'Lagos HQ',
    type: 'Primary Hub',
    departments: [
      { id: 'exec', name: 'Executive', lead: 'Chinedu Okoro', staff: 12 },
      { id: 'hr', name: 'Human Resources', lead: 'Blessing Udoh', staff: 24 },
      { id: 'fin', name: 'Finance', lead: 'David Okafor', staff: 18 }
    ]
  },
  {
    id: 'abuja-ops',
    name: 'Abuja Operations',
    type: 'Regional Branch',
    departments: [
      { id: 'log', name: 'Logistics', lead: 'Sarah Williams', staff: 42 },
      { id: 'comp', name: 'Compliance', lead: 'Ibrahim Musa', staff: 8 }
    ]
  },
  {
    id: 'benin-branch',
    name: 'Benin Branch',
    type: 'Support Hub',
    departments: [
      { id: 'tech', name: 'Technical Support', lead: 'Efe Omon', staff: 15 }
    ]
  }
];

import { useOrganization } from '@/context/OrganizationContext';
import { History as UndoIcon } from 'lucide-react';

export default function OrganizationWorkspace() {
  const { hubs, departments, currentHub, setCurrentHub, addHub, addDepartment, undoMutation, canUndo } = useOrganization();
  const [isHubModalOpen, setIsHubModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isEstablishing, setIsEstablishing] = useState(false);

  const handleCreateHub = (data: any) => {
    addHub(data);
    setIsHubModalOpen(false);
  };

  const handleCreateDept = (data: any) => {
    addDepartment(data);
    setIsDeptModalOpen(false);
  };

  const selectedOffice = hubs.find(h => h.name === currentHub) || hubs[0];
  const hubDepartments = departments.filter(d => d.parentHub === selectedOffice?.name);

  return (
    <div className="h-[calc(100vh-72px)] flex overflow-hidden animate-in fade-in duration-500">
      
      {/* Left: Hierarchy Rail (Operational Tree) */}
      <div className="hidden lg:flex w-[340px] bg-white border-r border-slate-200/60 flex-col shrink-0 relative z-30">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Architecture</span>
             </div>
             <div className="flex items-center gap-2">
               {canUndo && (
                 <button 
                   onClick={undoMutation}
                   className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors animate-in zoom-in"
                   title="Undo Topology Mutation"
                 >
                    <UndoIcon className="w-3.5 h-3.5" />
                 </button>
               )}
               <button 
                 onClick={() => setIsHubModalOpen(true)}
                 className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
               >
                  <Plus className="w-4 h-4" />
               </button>
             </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Search hubs or departments..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-[11px] font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-slate-300 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
           {hubs.map((office) => (
             <div key={office.id} className="space-y-2">
                <button 
                  onClick={() => setCurrentHub(office.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    currentHub === office.name ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                   <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black ${
                        currentHub === office.name ? 'bg-white/10' : 'bg-slate-100 text-slate-900'
                      }`}>
                         {office.name[0]}
                      </div>
                      <div className="text-left">
                         <p className="text-[13px] font-black tracking-tight leading-none mb-1">{office.name}</p>
                         <p className={`text-[9px] font-bold uppercase tracking-widest ${currentHub === office.name ? 'text-slate-400' : 'text-slate-400'}`}>
                            {office.category}
                         </p>
                      </div>
                   </div>
                   <ChevronRight className={`w-4 h-4 transition-transform ${currentHub === office.name ? 'rotate-90' : ''}`} />
                </button>

                {currentHub === office.name && (
                  <div className="pl-11 space-y-1 animate-in slide-in-from-top-2 duration-300">
                     <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100 mb-4">
                        <div className="space-y-0.5">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hub Authority</p>
                           <p className="text-[12px] font-bold text-slate-900">Standard Regional</p>
                        </div>
                        <button 
                          onClick={() => {
                            if (hubDepartments.length > 0) {
                              alert(`GOVERNANCE BLOCK: Cannot delete ${office.name}. This hub contains ${hubDepartments.length} active departments. Please reassign or dissolve departments first.`);
                            }
                          }}
                          className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Hub"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>

                     {hubDepartments.map(dept => (
                       <div key={dept.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer group transition-all">
                          <div>
                             <p className="text-[12px] font-bold text-slate-700 group-hover:text-slate-900">{dept.name}</p>
                             <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{dept.staff} Members</p>
                          </div>
                          <MoreVertical className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400" />
                       </div>
                     ))}
                     <button 
                       onClick={() => setIsDeptModalOpen(true)}
                       className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-all group"
                     >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Add Department</span>
                     </button>
                  </div>
                )}
             </div>
           ))}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 text-slate-400">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Sync Enabled</span>
           </div>
        </div>
      </div>

      {/* Right: Topology Workspace (Org Chart Canvas) */}
      <div className="flex-1 bg-slate-50 relative flex flex-col min-w-0">
         {/* Canvas Header */}
         <div className="min-h-[72px] px-4 md:px-8 py-4 border-b border-slate-200/40 bg-white/80 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4 md:gap-6">
               <div className="flex flex-col">
                  <h2 className="text-[14px] md:text-[15px] font-black text-slate-900 tracking-tight leading-none mb-1">{selectedOffice?.name}</h2>
                  <div className="flex items-center gap-2">
                     <MapPin className="w-3 h-3 text-slate-400" />
                     <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest">{selectedOffice?.category} Topology</span>
                  </div>
               </div>
               <div className="hidden sm:block h-6 w-px bg-slate-200" />
               <div className="hidden sm:flex items-center gap-6">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Departments</span>
                     <span className="text-[13px] font-black text-slate-900 leading-none">{hubDepartments.length} Units</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Coverage</span>
                     <span className="text-[13px] font-black text-emerald-600 leading-none">100%</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 ml-auto md:ml-0">
               <button className="flex items-center gap-2 px-3 md:px-4 h-[36px] md:h-[40px] bg-white border border-slate-200 rounded-xl text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-all shadow-sm">
                  <Network className="w-4 h-4" />
                  <span className="hidden sm:inline">Topology View</span>
               </button>
               <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <Maximize2 className="w-4 h-4" />
               </button>
            </div>
         </div>

         {/* Org Chart Surface */}
         <div className="flex-1 relative overflow-hidden flex items-center justify-center p-10">
            {/* Grid Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
            
            {isEstablishing ? (
              <div className="relative z-10 flex flex-col items-center gap-6 animate-pulse">
                 <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40">
                    <Zap className="w-8 h-8" />
                 </div>
                 <div className="text-center">
                    <p className="text-[15px] font-black text-slate-900 tracking-tight mb-1">Applying Architecture Sync...</p>
                    <p className="text-[12px] font-medium text-slate-400">Updating global organizational registry</p>
                 </div>
              </div>
            ) : (
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                 <div className="flex flex-col items-center space-y-16">
                    {/* Parent Hub */}
                    <div className="w-[280px] p-6 bg-slate-900 rounded-[24px] shadow-2xl relative">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white text-lg font-black">
                             {selectedOffice?.name[0]}
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Primary Hub</p>
                             <p className="text-lg font-black text-white tracking-tight leading-none">{selectedOffice?.name}</p>
                          </div>
                       </div>
                       {/* Connector Down */}
                       <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-slate-900 to-slate-200" />
                    </div>

                    {/* Children Departments */}
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 max-w-5xl mx-auto">
                       {hubDepartments.map((dept, idx) => (
                         <div key={dept.id} className="relative">
                            {/* Horizontal Connector Line - Hidden on wrap-heavy mobile */}
                            {hubDepartments.length > 1 && (
                              <div className={`hidden md:block absolute -top-16 h-px bg-slate-200 ${
                                idx === 0 ? 'left-1/2 right-0' : 
                                idx === hubDepartments.length - 1 ? 'left-0 right-1/2' : 
                                'left-0 right-0'
                              }`} />
                            )}
                            {/* Vertical Connector Line */}
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-px h-16 bg-slate-200" />

                            <div className="w-[180px] md:w-[220px] p-4 md:p-5 bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                               <div className="flex items-center gap-3 mb-3 md:mb-4">
                                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                     <Target className="w-4 h-4 md:w-5 md:h-5" />
                                  </div>
                                  <div>
                                     <p className="text-[12px] md:text-[14px] font-black text-slate-900 tracking-tight leading-none mb-1">{dept.name}</p>
                                     <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{dept.staff} Members</p>
                                  </div>
                               </div>
                               <div className="pt-3 md:pt-4 border-t border-slate-50 flex items-center justify-between">
                                  <div className="flex flex-col">
                                     <span className="text-[7px] md:text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Dept Lead</span>
                                     <span className="text-[10px] md:text-[11px] font-bold text-slate-600">{dept.lead}</span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}
         </div>

         {/* Canvas Controls */}
         <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-floating px-4 md:px-6 py-2.5 md:py-3 flex items-center gap-4 md:gap-6 z-20 whitespace-nowrap">
            <div className="flex items-center gap-2 md:gap-3 border-r border-slate-100 pr-4 md:pr-6">
               <button className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Out</button>
               <span className="text-[10px] md:text-[11px] font-black text-slate-900">100%</span>
               <button className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">In</button>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
               <button className="hidden sm:inline text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest">Reflow</button>
               <button className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 md:gap-2">
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Export Map</span>
               </button>
            </div>
         </div>
      </div>

      <CreateHubModal 
        isOpen={isHubModalOpen} 
        onClose={() => setIsHubModalOpen(false)} 
        onSubmit={handleCreateHub}
      />
      <CreateDeptModal 
        isOpen={isDeptModalOpen} 
        onClose={() => setIsDeptModalOpen(false)} 
        parentHub={selectedOffice.name} 
        onSubmit={handleCreateDept}
      />
    </div>
  );
}
