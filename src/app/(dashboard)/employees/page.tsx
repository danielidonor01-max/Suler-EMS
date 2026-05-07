"use client";

import React, { useState } from 'react';
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable } from "@/components/tables/DataTable";
import { StatusBadge, BadgeVariant } from "@/components/ui/StatusBadge";
import { Users, UserCheck, Home, UserPlus, Briefcase, Mail } from 'lucide-react';

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
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
            {emp.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-slate-900 leading-tight">{emp.fullName}</span>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-tighter">{emp.staffId} • {emp.email}</span>
          </div>
        </div>
      )
    },
    {
      header: "Department",
      accessor: "departmentName",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-semibold">{val}</span>
        </div>
      )
    },
    {
      header: "Designation",
      accessor: "roleName",
      render: (val: string) => (
        <span className="text-slate-500 font-medium text-[13px]">{val}</span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (val: string) => {
        const variantMap: Record<string, BadgeVariant> = {
          'Active': 'success',
          'Inactive': 'warning',
          'On Leave': 'warning',
          'Terminated': 'danger',
        };
        return (
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${val === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className={`text-[11px] font-bold uppercase tracking-widest ${val === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {val}
            </span>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-breathing max-w-[1600px] mx-auto animate-in">
      <PageHeader 
        title="Staff Management"
        description="Executive control and governance of organization staff members."
        actions={
          <div className="flex items-center gap-3">
            <Can permission={Permissions.EMPLOYEE_EXPORT}>
              <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                Export Registry
              </button>
            </Can>
            <Can permission={Permissions.EMPLOYEE_CREATE}>
              <button className="btn-premium btn-primary">
                <UserPlus className="w-4 h-4" />
                Add Staff Member
              </button>
            </Can>
          </div>
        }
      />

      {/* Executive KPI Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 negative-space-lg">
        <MetricCard 
          label="Total Workforce"
          value="1,284"
          trend={{ direction: 'up', value: '+12% YOY' }}
          icon={Users}
        />
        <MetricCard 
          label="Active Personnel"
          value="1,156"
          trend={{ direction: 'neutral', value: '90.2%' }}
          icon={UserCheck}
        />
        <MetricCard 
          label="Operational Capacity"
          value="92%"
          trend={{ direction: 'up', value: 'Optimal' }}
          icon={Briefcase}
          variant="secondary"
        />
        <MetricCard 
          label="Pending Onboarding"
          value="14"
          trend={{ direction: 'up', value: 'In Queue' }}
          icon={Mail}
        />
      </div>

      {/* Main Operational Table */}
      <div className="space-y-6">
        {error ? (
          <div className="p-20 bg-white rounded-[32px] border border-slate-100 text-center shadow-premium">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-rose-500 font-bold text-2xl">!</span>
            </div>
            <h4 className="text-slate-900 font-bold mb-2">Operational Data Error</h4>
            <p className="text-slate-500 text-sm mb-8">{error}</p>
            <button className="btn-premium btn-primary" onClick={() => setCurrentPage(1)}>
              Retry Sync
            </button>
          </div>
        ) : (
          <DataTable 
            title="Workforce Registry"
            description="Manage organizational staff, roles, and operational status."
            data={employees}
            columns={columns}
          />
        )}
      </div>
    </div>
  );
}
