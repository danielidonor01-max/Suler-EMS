"use client";

import React, { useState } from 'react';
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActionBar, ActionBarLeft, ActionBarRight } from "@/components/ui/ActionBar";
import { DataTable, ColumnDef } from "@/components/tables/DataTable";
import { TablePagination } from "@/components/tables/TablePagination";
import { StatusBadge, BadgeVariant } from "@/components/ui/StatusBadge";
import { Input } from "@/components/forms/Input";

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

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  const columns: ColumnDef<EmployeeResponseDTO>[] = [
    {
      header: "Staff Member",
      className: "pl-6",
      cell: (emp) => (
        <div>
          <div className="cell-primary">{emp.fullName}</div>
          <div className="cell-secondary">{emp.staffId} • {emp.email}</div>
        </div>
      )
    },
    {
      header: "Department",
      cell: (emp) => <span className="text-text-primary text-[13px]">{emp.departmentName}</span>
    },
    {
      header: "Designation",
      cell: (emp) => <span className="text-text-secondary text-[13px]">{emp.roleName}</span>
    },
    {
      header: "Hire Date",
      cell: (emp) => {
        const d = new Date(emp.hireDate);
        const formatted = new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
        return <span className="text-[13px] text-text-secondary tabular-nums">{formatted}</span>;
      }
    },
    {
      header: "Status",
      cell: (emp) => {
        // Map domain status to badge variant
        const variantMap: Record<string, BadgeVariant> = {
          'Active': 'success',
          'Inactive': 'warning',
          'On Leave': 'warning',
          'Terminated': 'danger',
        };
        return <StatusBadge variant={variantMap[emp.status] || 'info'}>{emp.status}</StatusBadge>;
      }
    },
    {
      header: "Actions",
      align: "right",
      className: "pr-6",
      cell: (emp) => (
        <div className="cell-actions justify-end">
          <button className="btn btn-sm btn-secondary">View</button>
          <Can permission={Permissions.EMPLOYEE_UPDATE}>
            <button className="btn btn-sm btn-secondary">Edit</button>
          </Can>
        </div>
      )
    }
  ];

  return (
    <div className="p-[var(--content-padding)]">
      <PageHeader 
        title="Staff Management"
        description="Manage, filter and monitor all organization staff members."
        actions={
          <>
            <Can permission={Permissions.EMPLOYEE_EXPORT}>
              <button className="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV
              </button>
            </Can>
            <Can permission={Permissions.EMPLOYEE_CREATE}>
              <button className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Staff
              </button>
            </Can>
          </>
        }
      />

      {/* KPI Strip */}
      <div className="dashboard-grid mb-[var(--space-lg)]">
        <MetricCard 
          label="Total Staff"
          value="1,284"
          trend={{ direction: 'up', value: '+12% vs last year' }}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
        />
        <MetricCard 
          label="Active Staff"
          value="1,156"
          trend={{ direction: 'up', value: '90% of workforce' }}
          iconBgColor="bg-green-50"
          iconTextColor="text-green-600"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          }
        />
        <MetricCard 
          label="On Leave"
          value="92"
          trend={{ direction: 'down', value: '8% of workforce' }}
          iconBgColor="bg-yellow-50"
          iconTextColor="text-yellow-600"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          }
        />
        <Can permission={Permissions.PAYROLL_VIEW}>
          <MetricCard 
            label="Monthly Hires"
            value="14"
            trend={{ direction: 'up', value: '+3 vs last month' }}
            iconBgColor="bg-green-50"
            iconTextColor="text-green-600"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            }
          />
        </Can>
      </div>

      {/* Table Card */}
      <div className="table-card bg-surface border border-border shadow-1 rounded-xl">
        <ActionBar>
          <ActionBarLeft>
            <div className="relative min-w-[260px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <Input className="pl-[38px] rounded-full h-[38px]" placeholder="Search by name or ID…" />
            </div>

            <div className="inline-flex items-center gap-1.5 h-[38px] px-3 bg-surface border border-border rounded-md text-sm font-medium text-text-primary cursor-pointer hover:border-text-muted hover:bg-bg transition-colors">
              <span className="text-text-secondary">Department:</span> All
            </div>
            <div className="inline-flex items-center gap-1.5 h-[38px] px-3 bg-surface border border-border rounded-md text-sm font-medium text-text-primary cursor-pointer hover:border-text-muted hover:bg-bg transition-colors">
              <span className="text-text-secondary">Status:</span> Active
            </div>
            <div className="inline-flex items-center gap-1.5 h-[38px] px-3 bg-surface border border-border rounded-md text-sm font-medium text-text-primary cursor-pointer hover:border-text-muted hover:bg-bg transition-colors">
              <span className="text-text-secondary">Type:</span> All
            </div>
          </ActionBarLeft>

          <ActionBarRight>
            <button className="btn btn-sm btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/>
              </svg>
              Sort
            </button>
          </ActionBarRight>
        </ActionBar>

        {error ? (
          <div className="p-8 text-center text-danger">
            <p className="mb-4">Error loading data: {error}</p>
            <button 
              className="btn btn-secondary" 
              onClick={() => setCurrentPage(1)} // trigger reload
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="p-12 text-center text-text-muted">Loading operational data...</div>
        ) : (
          <DataTable 
            data={employees}
            columns={columns}
            keyExtractor={(emp) => emp.id}
          />
        )}

        <TablePagination 
          totalItems={totalItems}
          itemsPerPage={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
