"use client";

import React, { useState } from 'react';
import { MetricCard } from "@/components/dashboard/MetricCard";
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
  History
} from 'lucide-react';

import { EmployeeService } from "@/modules/employees/services/employee.service";
import { EmployeeResponseDTO } from "@/modules/employees/dto/employee.dto";

export default function EmployeesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [employees, setEmployees] = useState<EmployeeResponseDTO[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponseDTO | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const result = await EmployeeService.getEmployees({
        page: currentPage,
        limit: 10,
      });
      if (!isMounted) return;
      if (result.success) {
        setEmployees(result.data.data);
        setTotalItems(result.data.meta.total);
      }
      setLoading(false);
    }
    loadData();
    return () => { isMounted = false; };
  }, [currentPage]);

  const columns = [
    {
      header: "Staff Member",
      accessor: "fullName",
      render: (val: string, emp: EmployeeResponseDTO) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] uppercase">
            {emp.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-black text-slate-900 tracking-tight leading-none mb-1">{emp.fullName}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{emp.staffId}</span>
          </div>
        </div>
      )
    },
    {
      header: "Department",
      accessor: "departmentName",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <span className="text-slate-700 font-bold text-[13px]">{val}</span>
        </div>
      )
    },
    {
      header: "Designation",
      accessor: "roleName",
      render: (val: string) => (
        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">{val}</span>
      )
    },
    {
      header: "Operational Status",
      accessor: "status",
      render: (val: string) => (
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border ${
          val === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${val === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{val}</span>
        </div>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">
      
      {/* Executive Hero - Tighter, Professional */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 border border-slate-100">
                <ShieldCheck className="w-3 h-3" />
                Organizational Hub
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Staff Management
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Executive oversight and granular control of organization staff members, operational roles, and governance policies.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md">
              <UserPlus className="w-4 h-4" />
              Onboard Staff
            </button>
            <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all">
              Export Registry
            </button>
          </div>
        </div>
      </div>

      {/* Operational Stats Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Staff" value="1,284" trend={{ direction: 'up', value: '12%' }} icon={Users} variant="tonal-info" />
        <MetricCard label="Active Workforce" value="1,156" trend={{ direction: 'neutral', value: 'LIVE' }} icon={UserCheck} variant="tonal-success" />
        <MetricCard label="Role Capacity" value="42" variant="primary" icon={Briefcase} />
        <MetricCard label="Pending Sync" value="14" trend={{ direction: 'up', value: 'QUEUE' }} icon={Activity} variant="tonal-warning" />
      </div>

      {/* Main Execution Registry */}
      <DataTable 
        title="Principal Staff Registry"
        description="Comprehensive record of organizational entities and designations."
        data={employees}
        columns={columns}
        onRowClick={(row) => setSelectedEmployee(row)}
      />

      {/* Employee Detail Surface (Contextual Drawer) */}
      <Drawer 
        isOpen={!!selectedEmployee} 
        onClose={() => setSelectedEmployee(null)}
        title={selectedEmployee?.fullName || ''}
        subtitle={selectedEmployee?.staffId || ''}
      >
        <div className="space-y-10 animate-in">
           {/* Profile Header Block */}
           <div className="flex items-center gap-6 p-6 rounded-[20px] bg-slate-50 border border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 text-2xl font-black">
                {selectedEmployee?.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="space-y-1.5">
                 <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">Operational</span>
                    <span className="text-[11px] font-bold text-slate-400">Since Jan 2024</span>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedEmployee?.fullName}</h3>
                 <p className="text-[13px] font-bold text-slate-500">{selectedEmployee?.roleName} • {selectedEmployee?.departmentName}</p>
              </div>
           </div>

           {/* Detail Grid */}
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Email Identity</span>
                 <p className="text-[13px] font-bold text-slate-900">{selectedEmployee?.email}</p>
              </div>
              <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Departmental Hub</span>
                 <p className="text-[13px] font-bold text-slate-900">{selectedEmployee?.departmentName}</p>
              </div>
           </div>

           {/* Workflow Timeline Segment */}
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <History className="w-4 h-4 text-slate-400" />
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Timeline</h4>
              </div>
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                 {[
                   { label: 'Role Update', desc: 'Promoted to Principal Admin', time: '2d ago' },
                   { label: 'Attendance Sync', desc: 'Biometric record verified', time: '5h ago' }
                 ].map((log, i) => (
                   <div key={i} className="relative pl-10">
                      <div className="absolute left-2 top-1.5 w-2 h-2 rounded-full bg-indigo-500 border-2 border-white ring-4 ring-slate-50" />
                      <div className="flex justify-between items-start">
                         <p className="text-[12px] font-black text-slate-900">{log.label}</p>
                         <span className="text-[10px] font-bold text-slate-300">{log.time}</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{log.desc}</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Action Quick Access */}
           <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-widest transition-all">
                 <Building2 className="w-4 h-4" />
                 Org Structure
              </button>
              <button className="flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-widest transition-all">
                 <Calendar className="w-4 h-4" />
                 Schedule
              </button>
           </div>
        </div>
      </Drawer>
    </div>
  );
}
