"use client";

import React, { useState } from 'react';
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable } from "@/components/tables/DataTable";
import { Users, UserCheck, Briefcase, Mail, UserPlus, Sparkles, LayoutDashboard } from 'lucide-react';

import { EmployeeService } from "@/modules/employees/services/employee.service";
import { EmployeeResponseDTO } from "@/modules/employees/dto/employee.dto";
import { Can } from "@/components/auth/Governance";
import { Permissions } from "@/modules/auth/domain/permission.model";

export default function EmployeesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [employees, setEmployees] = useState<EmployeeResponseDTO[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      const result = await EmployeeService.getEmployees({
        page: currentPage,
        limit: 10,
      });
      if (!isMounted) return;
      if (result.success) {
        setEmployees(result.data.data);
        setTotalItems(result.data.meta.total);
      } else {
        setError(result.error.message);
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
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs uppercase shadow-sm">
            {emp.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-extrabold text-slate-900 leading-tight tracking-tight">{emp.fullName}</span>
            <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{emp.staffId} • {emp.email}</span>
          </div>
        </div>
      )
    },
    {
      header: "Department",
      accessor: "departmentName",
      render: (val: string) => (
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
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
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
          val === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${val === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-[11px] font-black uppercase tracking-widest">{val}</span>
        </div>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      {/* Premium Executive Hero */}
      <div className="bg-white rounded-[40px] p-12 border border-slate-100 shadow-premium relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-[640px]">
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Operational Hub
              </div>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">
              Staff Management
            </h1>
            <p className="text-[16px] font-medium text-slate-400 leading-relaxed max-w-[520px]">
              Executive oversight and granular control of organization staff members, operational roles, and governance policies.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 shrink-0">
            <button className="btn-capsule bg-indigo-600 text-white shadow-xl shadow-indigo-100 active:scale-[0.98]">
              <UserPlus className="w-4.5 h-4.5" />
              Initiate New Onboarding
            </button>
            <button className="btn-capsule bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 shadow-sm">
              Generate Operational Registry
            </button>
          </div>
        </div>
        {/* Abstract Workspace Signal */}
        <div className="absolute -right-20 -bottom-20 w-[480px] h-[480px] bg-slate-50 rounded-full blur-[80px] opacity-60" />
      </div>

      {/* Tonal Performance Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Staff Count"
          value="1,284"
          trend={{ direction: 'up', value: '+12% YOY' }}
          icon={Users}
          variant="tonal-info"
        />
        <MetricCard 
          label="Active Workforce"
          value="1,156"
          trend={{ direction: 'neutral', value: 'Live' }}
          icon={UserCheck}
          variant="tonal-success"
        />
        <MetricCard 
          label="Organization Roles"
          value="42"
          trend={{ direction: 'up', value: 'Optimized' }}
          icon={Briefcase}
          variant="primary"
        />
        <MetricCard 
          label="Pending Syncs"
          value="14"
          trend={{ direction: 'up', value: 'In Queue' }}
          icon={Mail}
          variant="tonal-warning"
        />
      </div>

      {/* Main Execution Registry */}
      <div className="bg-white rounded-[40px] p-2 border border-slate-100/50 shadow-premium overflow-hidden">
        <DataTable 
          title="Principal Registry"
          description="Consolidated record of organizational staff and administrative roles."
          data={employees}
          columns={columns}
        />
      </div>
    </div>
  );
}
