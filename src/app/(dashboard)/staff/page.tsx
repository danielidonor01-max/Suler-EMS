"use client";

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Briefcase, 
  Activity, 
  MapPin,
  ShieldCheck,
  MoreVertical,
  Mail,
  Phone,
  Layout,
  Target,
  History,
  ShieldAlert,
  UserCog,
  ArrowRightLeft,
  XCircle,
  FileText
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Drawer } from '@/components/common/Drawer';
import { useWorkforce, Employee } from '@/context/WorkforceContext';
import { 
  OnboardMemberModal, 
  SuspendAccessModal, 
  ModifyRoleModal,
  EditEmployeeModal 
} from '@/components/modals/WorkforceModals';

export default function WorkforcePage() {
  const { employees, metrics } = useWorkforce();
  const [selectedStaff, setSelectedStaff] = useState<Employee | null>(null);
  const [activeKebab, setActiveKebab] = useState<string | null>(null);
  
  // Modal states
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null);

  const columns = [
    {
      header: "Staff Member",
      accessor: "name",
      render: (val: string, row: Employee) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] uppercase">
            {val.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-[14px] font-bold text-slate-900 tracking-tight leading-none mb-1">{val}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{row.id}</div>
          </div>
        </div>
      )
    },
    {
      header: "Designation",
      accessor: "designation",
      render: (val: string, row: Employee) => (
        <div>
          <div className="text-[13px] font-bold text-slate-700 tracking-tight leading-none mb-1.5">{val || row.role}</div>
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.15em]">{row.department || 'Operations'}</div>
        </div>
      )
    },
    {
      header: "Operational Hub",
      accessor: "office",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[13px] font-bold text-slate-600">{val}</span>
        </div>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (val: string) => (
        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 ${
          val === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
        }`}>
          <div className={`w-1 h-1 rounded-full ${val === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {val}
        </div>
      )
    },
    {
      header: "",
      accessor: "id",
      render: (_: string, row: Employee) => (
        <div className="relative flex justify-end">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveKebab(activeKebab === row.id ? null : row.id);
            }}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {activeKebab === row.id && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-[16px] shadow-premium z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="p-2 space-y-1">
                  <div className="px-3 py-1.5 mb-1">
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Management</span>
                  </div>
                  <KebabItem icon={UserCog} label="Edit Identity" onClick={() => { setIsEditOpen(true); setTargetEmployee(row); setActiveKebab(null); }} />
                  <KebabItem icon={ArrowRightLeft} label="Transfer Placement" onClick={() => setActiveKebab(null)} />
                  <KebabItem icon={ShieldCheck} label="Modify Access" onClick={() => { setIsRoleOpen(true); setTargetEmployee(row); setActiveKebab(null); }} />
                  <KebabItem icon={ShieldAlert} label="Suspend Access" variant="danger" onClick={() => { setIsSuspendOpen(true); setTargetEmployee(row); setActiveKebab(null); }} />
                  
                  <div className="border-t border-slate-100 my-1 pt-1" />
                  <div className="px-3 py-1.5 mb-1">
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Insights</span>
                  </div>
                  <KebabItem icon={History} label="View Audit Trail" onClick={() => setActiveKebab(null)} />
               </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10" onClick={() => setActiveKebab(null)}>
      
      {/* Executive Hero */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 border border-slate-100">
                <ShieldCheck className="w-3 h-3" />
                Organizational Intelligence
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Workforce Registry
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Comprehensive record of organization-wide human resources, departmental structures, and operational roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2">
                <Layout className="w-[18px] h-[18px] stroke-[1.5px]" />
                Org Chart
             </button>
            <button 
              onClick={() => setIsOnboardOpen(true)}
              className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <UserPlus className="w-[18px] h-[18px] stroke-[1.5px]" />
              Onboard Member
            </button>
          </div>
        </div>
      </div>

      {/* KPI Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Workforce" value={metrics.totalEmployees.toString()} trend={{ direction: 'up', value: '12%' }} variant="tonal-info" icon={Users} />
        <MetricCard label="Active Status" value={metrics.activeCount.toString()} variant="tonal-success" icon={ShieldCheck} />
        <MetricCard label="Operational Hubs" value="3" variant="tonal-info" icon={MapPin} />
        <MetricCard label="Governance Sync" value="98%" variant="tonal-success" icon={Activity} />
      </div>

      {/* Registry Surface */}
      <DataTable 
        title="Staff Directory"
        description="Executive record of all organizational staff members and their operational designations."
        data={employees}
        columns={columns}
        onRowClick={(row) => setSelectedStaff(row)}
      />

      {/* Staff Detail Drawer */}
      <Drawer
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        title={selectedStaff?.name || ''}
        subtitle={selectedStaff?.id}
      >
        {selectedStaff && (
          <div className="space-y-10 animate-in">
             {/* Summary Card */}
             <div className="p-7 bg-slate-50 border border-slate-100 rounded-[20px] space-y-6">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 text-xl font-bold">
                     {selectedStaff.name.split(' ').map(n => n[0]).join('')}
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{selectedStaff.name}</h3>
                      <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">{selectedStaff.designation || selectedStaff.role}</p>
                   </div>
                </div>
  
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Department</span>
                      <p className="text-[14px] font-bold text-slate-900">{selectedStaff.department || 'Operations'}</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Primary Hub</span>
                      <p className="text-[14px] font-bold text-slate-900">{selectedStaff.office}</p>
                   </div>
                </div>
             </div>
  
             {/* Contact Detail Section */}
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-slate-400" />
                   <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Contact Intelligence</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                   <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                         <Mail className="w-4.5 h-4.5" />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Work Email</p>
                         <p className="text-[13px] font-bold text-slate-900">{selectedStaff.email}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                         <Phone className="w-4.5 h-4.5" />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Operational Mobile</p>
                         <p className="text-[13px] font-bold text-slate-900">{selectedStaff.phone || '+234 801 ...'}</p>
                      </div>
                   </div>
                </div>
             </div>
  
             {/* Actions */}
             <div className="grid grid-cols-2 gap-4">
                <button className="bg-slate-900 hover:bg-black text-white h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2">
                   <Target className="w-4 h-4 stroke-[1.5px]" />
                   Initiate Transfer
                </button>
                <button 
                  onClick={() => { setSelectedStaff(null); setIsRoleOpen(true); setTargetEmployee(selectedStaff); }}
                  className="bg-white border border-slate-200 text-slate-600 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-widest hover:border-slate-300 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                   <ShieldCheck className="w-4 h-4 stroke-[1.5px]" />
                   Modify Access
                </button>
             </div>
          </div>
        )}
      </Drawer>

      {/* Modals */}
      <OnboardMemberModal isOpen={isOnboardOpen} onClose={() => setIsOnboardOpen(false)} />
      {targetEmployee && (
        <>
          <SuspendAccessModal 
            isOpen={isSuspendOpen} 
            onClose={() => setIsSuspendOpen(false)} 
            employee={targetEmployee} 
          />
          <ModifyRoleModal 
            isOpen={isRoleOpen} 
            onClose={() => setIsRoleOpen(false)} 
            employee={targetEmployee} 
          />
          <EditEmployeeModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            employee={targetEmployee}
          />
        </>
      )}
    </div>
  );
}

const KebabItem = ({ icon: Icon, label, onClick, variant = 'default' }: any) => (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-bold transition-colors ${
      variant === 'danger' 
        ? 'text-rose-600 hover:bg-rose-50' 
        : 'text-slate-600 hover:bg-slate-50'
    }`}
  >
    <Icon className={`w-4 h-4 stroke-[1.5px] ${variant === 'danger' ? 'text-rose-500' : 'text-slate-400'}`} />
    {label}
  </button>
);
