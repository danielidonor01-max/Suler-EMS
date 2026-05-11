"use client";

import React, { useState } from 'react';
import { 
  History, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  FileText,
  Zap,
  ChevronRight,
  Filter,
  Download,
  Calendar,
  User,
  Calculator,
  Users
} from 'lucide-react';
import { usePayroll, PayrollRun, PayrollEntry } from '@/context/PayrollContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useWorkforce } from '@/context/WorkforceContext';
import { useAccess } from '@/context/AccessContext';
import { DataTable } from '@/components/tables/DataTable';
import { AddAdjustmentModal, BulkAdjustmentModal } from '@/components/modals/PayrollModals';
import { formatCurrency, formatNumber } from '@/lib/utils/formatCurrency';

export default function PayrollRegisterPage() {
  const { payrollRuns, generateDraftRun, approveRun, processRun, deleteRun } = usePayroll();
  const { currentHub } = useOrganization();
  const { employees } = useWorkforce();
  const { userRole } = useAccess();
  
  const [isAdjOpen, setIsAdjOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);

  // Access Control
  const isFinanceAdmin = userRole === 'FINANCE_ADMIN';

  // Hub Filtering
  const filteredRuns = payrollRuns.filter(r => currentHub === 'All Regions' || r.hub === currentHub);
  
  // Active Run Display
  const displayRun = selectedRun || filteredRuns.find(r => r.status === 'DRAFT' || r.status === 'REVIEWED') || filteredRuns[0];

  const columns = [
    {
      header: "Employee",
      accessor: "employeeId",
      render: (val: string) => {
        const emp = employees.find(e => e.id === val);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
              {emp?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900 tracking-tight leading-none mb-1">{emp?.name}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{val}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: "Base Salary",
      accessor: "baseSalary",
      render: (val: number) => <span className="text-[13px] font-bold text-slate-900">{formatCurrency(val)}</span>
    },
    {
      header: "Bonus/Award",
      accessor: "totalBonuses",
      render: (val: number) => <span className="text-[13px] font-bold text-emerald-600">+{formatNumber(val)}</span>
    },
    {
      header: "Gross Pay",
      accessor: "grossPay",
      render: (val: number) => <span className="text-[13px] font-black text-slate-900">{formatCurrency(val)}</span>
    },
    {
      header: "PAYE Tax",
      accessor: "paye",
      render: (val: number) => <span className="text-[12px] font-bold text-rose-500">({formatNumber(val)})</span>
    },
    {
      header: "Pension (8%)",
      accessor: "pension",
      render: (val: number) => <span className="text-[12px] font-bold text-amber-600">({formatNumber(val)})</span>
    },
    {
      header: "Net Salary",
      accessor: "netPay",
      render: (val: number) => (
        <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[13px] font-black border border-indigo-100">
          {formatCurrency(val)}
        </div>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">
      
      {/* Registry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
             <div className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Payroll Register
             </div>
             <div className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md text-[9px] font-bold uppercase tracking-[0.2em]">
                {displayRun?.period || 'No Active Run'}
             </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
            Compensation Registry
          </h1>
          <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[520px]">
            Operational breakdown of basic salaries, bonuses, and statutory compliance for the current payroll cycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsBulkOpen(true)}
             className="h-11 px-6 bg-slate-100 text-slate-900 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
           >
              <Users className="w-4 h-4" />
              Bulk Adjustments
           </button>
           <button 
             onClick={() => setIsAdjOpen(true)}
             className="h-11 px-6 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:border-slate-300 transition-all flex items-center gap-2"
           >
              <Plus className="w-4 h-4" />
              Add Single
           </button>
           <button 
             onClick={() => generateDraftRun('May 2026', currentHub)}
             className="h-11 px-8 bg-slate-950 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
           >
              <Zap className="w-4 h-4" />
              Initialize Cycle
           </button>
        </div>
      </div>

      {/* Registry Surface */}
      {displayRun ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-[24px] border border-slate-200 shadow-premium">
             <div className="flex items-center gap-6">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Liability</span>
                   <span className="text-[20px] font-black text-slate-900">{formatCurrency(displayRun.totalGross)}</span>
                </div>
                <div className="w-px h-10 bg-slate-100" />
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Disbursable</span>
                   <span className="text-[20px] font-black text-indigo-600">{formatCurrency(displayRun.totalNet)}</span>
                </div>
                <div className="w-px h-10 bg-slate-100" />
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                   <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        displayRun.status === 'PROCESSED' ? 'bg-emerald-500' :
                        displayRun.status === 'APPROVED' ? 'bg-indigo-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{displayRun.status}</span>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                <button className="p-2.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 hover:text-slate-900">
                   <Download className="w-4 h-4" />
                </button>
                {displayRun.status === 'DRAFT' && !isFinanceAdmin && (
                  <button 
                    onClick={() => approveRun(displayRun.id)}
                    className="h-10 px-6 bg-indigo-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                     Approve Register
                  </button>
                )}
                {displayRun.status === 'APPROVED' && !isFinanceAdmin && (
                  <button 
                    onClick={() => processRun(displayRun.id)}
                    className="h-10 px-8 bg-emerald-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                     Process Disbursement
                  </button>
                )}
             </div>
          </div>

          <DataTable 
            title="Compensation Breakdown"
            description="Detailed salary structure and statutory compliance logs."
            data={displayRun.entries}
            columns={columns}
            rowActions={[
              { label: 'View Payslip', icon: FileText, onClick: () => {} },
              { label: 'Edit Breakdown', icon: Edit3, onClick: () => {}, hidden: () => displayRun.status !== 'DRAFT' }
            ]}
          />
        </div>
      ) : (
        <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
           <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
              <Calendar className="w-8 h-8" />
           </div>
           <h3 className="text-lg font-bold text-slate-900">No Active Payroll Run</h3>
           <p className="text-[13px] text-slate-400 mt-2">Initialize a new payroll cycle to generate the compensation register.</p>
        </div>
      )}

      <AddAdjustmentModal isOpen={isAdjOpen} onClose={() => setIsAdjOpen(false)} />
      <BulkAdjustmentModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} />
    </div>
  );
}
