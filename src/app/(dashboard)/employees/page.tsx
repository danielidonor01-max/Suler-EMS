"use client";

import React, { useState } from 'react';
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable } from "@/components/tables/DataTable";
import {
  Users,
  UserCheck,
  Briefcase,
  UserPlus,
  Activity,
  ShieldCheck,
  History,
  Layout,
  Edit3,
  UserMinus,
  Zap,
  Eye
} from 'lucide-react';

import {
  EditEmployeeModal,
  SuspendAccessModal,
  ModifyRoleModal,
  OnboardMemberModal,
  PromoteEmployeeModal
} from "@/components/modals/WorkforceModals";
import { OrgChart } from "@/components/organization/OrgChart";
import { ForensicTimelineDrawer } from "@/components/drawers/ForensicTimelineDrawer";
import { useWorkforce, Employee } from "@/context/WorkforceContext";
import { useOrganization } from "@/context/OrganizationContext";
import { useEmployeeProfile } from "@/context/EmployeeProfileContext";
import { EmployeeChip } from "@/components/employees/EmployeeChip";

import { PermissionGate } from "@/components/common/PermissionGate";
import { Permissions } from "@/modules/auth/domain/permission.model";

export default function EmployeesPage() {
  const { employees, metrics } = useWorkforce();
  const { currentHub } = useOrganization();
  const { openProfile } = useEmployeeProfile();
  const [viewMode, setViewMode] = useState<'REGISTRY' | 'CHART'>('REGISTRY');

  const filteredEmployees = employees.filter(emp => 
    currentHub === 'All Regions' || emp.hub === currentHub
  );
  
  // Governance Interaction State
  const [activeGovernance, setActiveGovernance] = useState<{ 
    type: 'EDIT' | 'ROLE' | 'SUSPEND' | 'AUDIT' | 'PROMOTE' | null, 
    employee: Employee | null 
  }>({ type: null, employee: null });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Onboarding Form State
  const [hub, setHub] = useState('lagos');
  const [designation, setDesignation] = useState('engineer');
  
  // Governance Row Actions. "View Profile" is first so it's the
  // canonical entry to the centred EmployeeProfileModal — same modal
  // every clickable name+avatar in the app opens.
  const rowActions = [
    {
      label: 'View Profile',
      icon: Eye,
      onClick: (emp: Employee) => openProfile(emp.id)
    },
    {
      label: 'Edit Identity',
      icon: Edit3,
      permission: Permissions.WORKFORCE_EDIT,
      onClick: (emp: Employee) => setActiveGovernance({ type: 'EDIT', employee: emp })
    },
    {
      label: 'Audit Trail',
      icon: History,
      permission: Permissions.WORKFORCE_VIEW,
      onClick: (emp: Employee) => setActiveGovernance({ type: 'AUDIT', employee: emp })
    },
    {
      label: 'Promote Member',
      icon: Zap,
      permission: Permissions.WORKFORCE_PROMOTE,
      onClick: (emp: Employee) => setActiveGovernance({ type: 'PROMOTE', employee: emp })
    },
    {
      label: 'Suspend Access',
      icon: UserMinus,
      permission: Permissions.WORKFORCE_DELETE,
      onClick: (emp: Employee) => setActiveGovernance({ type: 'SUSPEND', employee: emp }),
      variant: 'danger' as const
    },
  ];

  const columns = [
    {
      header: "Staff Member",
      accessor: "name",
      render: (_val: string, emp: Employee) => (
        <EmployeeChip
          employeeId={emp.id}
          name={emp.name}
          sublabel={emp.id}
          size="md"
        />
      )
    },
    {
      header: "Hub / Location",
      accessor: "hub",
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
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Hub: Lagos</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter leading-none">
              {viewMode === 'REGISTRY' ? 'Workforce Registry' : 'Organization Chart'}
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              {viewMode === 'REGISTRY' 
                ? 'Advanced executive control over organizational staff entities, operational designations, and governance protocols.'
                : 'Visual structural hierarchy of Suler Global, mapping reporting lines and leadership clusters.'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setViewMode(viewMode === 'REGISTRY' ? 'CHART' : 'REGISTRY')}
             className={`px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 border ${
               viewMode === 'CHART' ? 'bg-slate-950 text-white border-slate-950' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
             }`}
           >
              <Layout className="w-[18px] h-[18px] stroke-[1.5px]" />
              {viewMode === 'REGISTRY' ? 'Org Chart' : 'Registry View'}
           </button>

           <PermissionGate permission={Permissions.WORKFORCE_CREATE} showLocked>
             <button 
               onClick={() => setIsOnboardingOpen(true)}
               className="bg-slate-950 hover:bg-slate-900 text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
             >
                <UserPlus className="w-[18px] h-[18px] stroke-[1.5px]" />
                Onboard Member
             </button>
           </PermissionGate>
        </div>
      </div>

      {/* Strategic Intelligence Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Workforce" value={metrics.totalEmployees.toString()} trend={{ direction: 'up', value: '12%' }} icon={Users} variant="tonal-info" />
        <MetricCard label="Active Status" value={metrics.activeCount.toString()} trend={{ direction: 'neutral', value: 'LIVE' }} icon={UserCheck} variant="tonal-success" />
        <MetricCard label="Operational Hubs" value="3" variant="tonal-info" icon={Briefcase} />
        <MetricCard label="New Hires (Month)" value={metrics.newHiresThisMonth.toString()} trend={{ direction: 'up', value: 'QUEUE' }} icon={Activity} variant="tonal-success" />
      </div>

      {viewMode === 'REGISTRY' ? (
        <DataTable
          title="Principal Staff Registry"
          description="Comprehensive record of organizational entities, departmental hubs, and operational designations."
          data={filteredEmployees}
          columns={columns}
          rowActions={rowActions}
        />
      ) : (
        <OrgChart />
      )}

      {/* Modals & Command Surfaces */}
      <OnboardMemberModal 
        isOpen={isOnboardingOpen} 
        onClose={() => setIsOnboardingOpen(false)}
      />

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

      {activeGovernance.type === 'PROMOTE' && activeGovernance.employee && (
        <PromoteEmployeeModal 
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
    </div>
  );
}
