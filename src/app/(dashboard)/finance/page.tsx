"use client";

import React, { useState } from 'react';
import { 
  DollarSign, 
  Target, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Building2,
  Briefcase,
  PieChart,
  CreditCard,
  Zap,
  History
} from 'lucide-react';
import { useFinance, Expenditure, Budget, ProjectFunding } from '@/context/FinanceContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useWorkforce } from '@/context/WorkforceContext';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DataTable } from '@/components/tables/DataTable';
import { CreateExpenditureModal, AllocateProjectFundingModal } from '@/components/modals/FinanceModals';
import { RouteGuard } from '@/components/common/RouteGuard';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export default function FinanceDashboard() {
  const { budgets, expenditures, projects, approveExpenditure, payExpenditure } = useFinance();
  const { currentHub } = useOrganization();
  const { employees } = useWorkforce();
  const { userRole, user } = useAccess();
  
  const [isExpOpen, setIsExpOpen] = useState(false);
  const [isProjOpen, setIsProjOpen] = useState(false);

  // Access Control: Hub Managers can only see data for their hub.
  const isHubManager = userRole === 'HUB_MANAGER';
  const userEmployee = employees.find(e => e.id === user?.employeeId);
  const effectiveHub = isHubManager ? userEmployee?.hub || 'All Regions' : currentHub;

  // Hub Filtering
  const filteredBudgets = budgets.filter(b => effectiveHub === 'All Regions' || b.hub === effectiveHub);
  const filteredExp = expenditures.filter(e => effectiveHub === 'All Regions' || e.hub === effectiveHub);
  const filteredProjects = projects.filter(p => effectiveHub === 'All Regions' || p.hub === effectiveHub);

  // Financial Aggregates
  const totalAllocated = filteredBudgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spent, 0);
  const burnRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const budgetColumns = [
    {
      header: "Cost Center",
      accessor: "name",
      render: (val: string, b: Budget) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center border border-slate-800 shadow-sm">
            <PieChart className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-slate-900 tracking-tight leading-none mb-1">{b.name}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{b.department}</span>
          </div>
        </div>
      )
    },
    {
      header: "Allocation",
      accessor: "allocated",
      render: (val: number) => (
        <span className="text-[14px] font-black text-slate-900">{formatCurrency(val)}</span>
      )
    },
    {
      header: "Utilization",
      accessor: "spent",
      render: (val: number, b: Budget) => {
        const pct = (val / b.allocated) * 100;
        return (
          <div className="flex items-center gap-3">
             <div className="flex-1 h-1.5 min-w-[80px] bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${pct}%` }} 
                />
             </div>
             <span className="text-[11px] font-black text-slate-900">{pct.toFixed(1)}%</span>
          </div>
        );
      }
    }
  ];

  const expColumns = [
    {
      header: "Expenditure",
      accessor: "description",
      render: (val: string, e: Expenditure) => (
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-slate-900 tracking-tight mb-1">{e.description}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{e.category}</span>
        </div>
      )
    },
    {
      header: "Amount",
      accessor: "amount",
      render: (val: number) => (
        <span className="text-[14px] font-black text-slate-900">{formatCurrency(val)}</span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (val: string) => (
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block ${
          val === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          val === 'APPROVED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
          val === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
          'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {val}
        </div>
      )
    }
  ];

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_MANAGER']}>
      <div className="section-breathing max-w-[1400px] mx-auto animate-in space-y-6">
      
      {/* Financial Command Surface */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2.5 py-1 bg-slate-950 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
              <DollarSign className="w-3 h-3" />
              Financial Governance Layer
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
            Financial Intelligence
          </h1>
          <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
            Enterprise-scale oversight of budgeting, operational expenditure, and capital funding across all regional cost centers.
          </p>
        </div>

        {!isHubManager && (
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsExpOpen(true)}
               className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 flex items-center gap-2 px-6 h-[44px] rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm"
             >
                <Zap className="w-[18px] h-[18px] stroke-[1.5px]" />
                Request Funds
             </button>
             <button 
               onClick={() => setIsProjOpen(true)}
               className="bg-slate-950 hover:bg-black text-white flex items-center gap-2 px-8 h-[44px] rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
             >
                <Plus className="w-[18px] h-[18px] stroke-[1.5px]" />
                New Budget Allocation
             </button>
          </div>
        )}
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Allocation" value={formatCurrency(totalAllocated)} icon={PieChart} variant="tonal-info" />
        <MetricCard label="Global Spent" value={formatCurrency(totalSpent)} trend={{ direction: 'up', value: '4.2%' }} variant="tonal-info" icon={TrendingUp} />
        <MetricCard label="Burn Rate" value={`${burnRate.toFixed(1)}%`} trend={{ direction: 'neutral', value: 'OPTIMIZED' }} variant="tonal-success" icon={Activity} />
        <MetricCard label="Financial Integrity" value="Verified" variant="tonal-success" icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Budget Overview */}
         <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Active Budgets</h2>
               </div>
               <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                  Context: {effectiveHub}
               </div>
            </div>
            <DataTable 
              title="Budget Performance"
              description="Strategic resource allocation and utilization monitoring across departments."
              data={filteredBudgets}
              columns={budgetColumns}
              rowActions={!isHubManager ? [
                { label: 'Edit Budget', icon: Edit3, onClick: () => {} },
                { label: 'View Audit', icon: History, onClick: () => {} }
              ] : []}
            />
         </div>

         {/* Expenditure Requests */}
         <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Expenditure Control</h2>
               </div>
            </div>
            <DataTable 
              title="Funding Requests"
              description="Real-time monitoring of operational and capital expenditure approvals."
              data={filteredExp}
              columns={expColumns}
              rowActions={!isHubManager ? [
                { label: 'Approve', icon: ShieldCheck, onClick: (e: Expenditure) => approveExpenditure(e.id), hidden: (e: Expenditure) => e.status !== 'PENDING' },
                { label: 'Settle Payment', icon: Zap, onClick: (e: Expenditure) => payExpenditure(e.id), hidden: (e: Expenditure) => e.status !== 'APPROVED' },
                { label: 'Reject', icon: Trash2, onClick: () => {}, variant: 'danger', hidden: (e: Expenditure) => e.status !== 'PENDING' }
              ] : [
                { label: 'View Audit', icon: History, onClick: () => {} }
              ]}
            />
         </div>
      </div>

      {/* Project Funding Surface */}
      <div className="space-y-6">
         <div className="flex items-center gap-2 px-2">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Project Funding Status</h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProjects.map(proj => {
               const pct = (proj.utilized / proj.allocation) * 100;
               return (
                  <div key={proj.id} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                           <Target className="w-6 h-6" />
                        </div>
                        <div className={`px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${
                           proj.status === 'FUNDED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                           {proj.status}
                        </div>
                     </div>
                     <div className="space-y-1 mb-6">
                        <h4 className="text-[15px] font-bold text-slate-900 tracking-tight leading-none">{proj.projectName}</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{proj.hub}</p>
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Utilization</span>
                           <span className="text-[10px] font-black text-slate-900">{formatCurrency(proj.utilized)} / {formatCurrency(proj.allocation)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                           <div 
                             className="h-full bg-slate-900 rounded-full transition-all duration-1000" 
                             style={{ width: `${pct}%` }} 
                           />
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      {/* Modals */}
      <CreateExpenditureModal isOpen={isExpOpen} onClose={() => setIsExpOpen(false)} />
      <AllocateProjectFundingModal isOpen={isProjOpen} onClose={() => setIsProjOpen(false)} />

      </div>
    </RouteGuard>
  );
}
