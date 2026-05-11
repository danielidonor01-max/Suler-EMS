"use client";

import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  UserPlus,
  Building2
} from 'lucide-react';
import { useTeams, Team } from '@/context/TeamContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useWorkforce } from '@/context/WorkforceContext';
import { DataTable } from '@/components/tables/DataTable';
import { CreateTeamModal, AddMemberModal } from '@/components/modals/TeamModals';
import { CapabilityIntelligence } from '@/components/dashboard/CapabilityIntelligence';
import { CapacityIntelligencePanel } from '@/components/team/CapacityIntelligencePanel';

export default function TeamsPage() {
  const { teams, deleteTeam } = useTeams();
  const { currentHub } = useOrganization();
  const { employees } = useWorkforce();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Filter teams based on active context
  const filteredTeams = teams.filter(t => 
    currentHub === 'All Regions' || t.hub === currentHub
  );

  const teamColumns = [
    {
      header: "Team Identity",
      accessor: "name",
      render: (val: string, team: Team) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-indigo-400 flex items-center justify-center border border-slate-800">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-slate-900 tracking-tight leading-none mb-1">{team.name}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{team.hub}</span>
          </div>
        </div>
      )
    },
    {
      header: "Manager",
      accessor: "managerId",
      render: (val: string) => {
        const mgr = employees.find(e => e.id === val);
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
              {mgr?.name.split(' ').map(n => n[0]).join('') || '??'}
            </div>
            <span className="text-slate-900 font-bold text-[13px]">{mgr?.name || 'Unassigned'}</span>
          </div>
        );
      }
    },
    {
      header: "Registry Size",
      accessor: "members",
      render: (val: string[]) => (
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[12px] font-bold">{val.length} Members</span>
        </div>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      
      {/* Executive Command Surface */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              Operational Execution Layer
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
            Operational Intelligence
          </h1>
          <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
            Advanced executive overview of team performance, capacity impact, and strategic resource coordination.
          </p>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsCreateOpen(true)}
             className="bg-slate-950 hover:bg-black text-white flex items-center gap-2 px-8 h-[44px] rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
           >
              <Plus className="w-[18px] h-[18px] stroke-[1.5px]" />
              New Team
           </button>
        </div>
      </div>

      {/* Intelligence Layer: Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="h-full">
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
         <div className="h-full">
            <CapacityIntelligencePanel />
         </div>
      </div>

      {/* Execution Surface: Teams Registry */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
               <Building2 className="w-4 h-4 text-slate-400" />
               <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Active Execution Units</h2>
            </div>
            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
               Context: {currentHub}
            </div>
         </div>
         
         <DataTable 
           title="Teams Registry"
           description="Comprehensive record of organizational teams, leadership, and operational scale."
           data={filteredTeams}
           columns={teamColumns}
           rowActions={[
             { label: 'Add Member', icon: UserPlus, onClick: (team: Team) => { setSelectedTeam(team); setIsAddMemberOpen(true); } },
             { label: 'Dissolve Team', icon: Trash2, onClick: (team: Team) => deleteTeam(team.id), variant: 'danger' }
           ]}
         />
      </div>

      {/* Modals */}
      <CreateTeamModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      {selectedTeam && (
        <AddMemberModal 
          isOpen={isAddMemberOpen} 
          onClose={() => { setIsAddMemberOpen(false); setSelectedTeam(null); }} 
          team={selectedTeam} 
        />
      )}
    </div>
  );
}
