"use client";

import React, { useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  Filter, 
  Download,
  Wallet,
  Receipt,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { MetricCard } from '@/components/dashboard/MetricCard';

// Initial Mock Data
const MOCK_PAYROLL = [
  { id: 'pay-001', staffName: 'Chinedu Okoro', amount: '₦1,250,000', status: 'PROCESSED', date: '2024-05-01' },
  { id: 'pay-002', staffName: 'Sarah Williams', amount: '₦850,000', status: 'PENDING', date: '2024-05-01' },
  { id: 'pay-003', staffName: 'David Okafor', amount: '₦920,000', status: 'PROCESSED', date: '2024-05-01' },
  { id: 'pay-004', staffName: 'Blessing Udoh', amount: '₦750,000', status: 'PROCESSED', date: '2024-05-01' },
  { id: 'pay-005', staffName: 'John Doe', amount: '₦1,100,000', status: 'FAILED', date: '2024-05-01' },
];

export default function PayrollPage() {
  const [data] = useState(MOCK_PAYROLL);

  const columns = [
    {
      header: "Beneficiary",
      accessor: "staffName",
      render: (val: string, row: any) => (
        <div>
          <div className="text-[14px] font-bold text-slate-900 tracking-tight">{val}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-0.5">Reference: {row.id}</div>
        </div>
      )
    },
    {
      header: "Disbursement",
      accessor: "amount",
      render: (val: string) => (
        <span className="text-[14px] font-bold text-slate-900 tracking-tighter">{val}</span>
      )
    },
    {
      header: "Execution Status",
      accessor: "status",
      render: (val: string) => (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          val === 'PROCESSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
          val === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
          'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            val === 'PROCESSED' ? 'bg-emerald-500' : 
            val === 'PENDING' ? 'bg-amber-500' : 
            'bg-rose-500'
          } animate-pulse`} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{val}</span>
        </div>
      )
    },
    {
      header: "Value Date",
      accessor: "date",
      render: (val: string) => (
        <span className="text-[12px] font-bold text-slate-400">{val}</span>
      )
    },
    {
      header: "Control",
      accessor: "id",
      render: () => (
        <button className="px-4 py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all">
          Audit
        </button>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      {/* Executive Hero */}
      <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-premium relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-[600px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Governance Secure
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Financial Registry
            </h1>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Secure management of organizational payroll, tax liabilities, and automated disbursement reconciliations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center gap-2 px-6 h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-slate-100 shadow-sm">
              <Receipt className="w-[18px] h-[18px] stroke-[1.5px]" />
              Tax Filing
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-8 h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl shadow-indigo-100/20">
              <Wallet className="w-[18px] h-[18px] stroke-[1.5px]" />
              Execute Batch
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/30 rounded-full -mr-32 -mt-32 blur-3xl" />
      </div>

      {/* KPI Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Payroll" 
          value="₦42.8M" 
          trend={{ direction: 'down', value: '1.2%' }}
          variant="tonal-info"
          icon={DollarSign}
        />
        <MetricCard 
          label="Disbursements" 
          value="84%" 
          trend={{ direction: 'up', value: '5.4%' }}
          variant="tonal-success"
          icon={Activity}
        />
        <MetricCard 
          label="Pending Sync" 
          value="12" 
          variant="tonal-warning"
          icon={RefreshCcw}
        />
        <MetricCard 
          label="Audit Score" 
          value="98%" 
          variant="tonal-success"
          icon={ShieldCheck}
        />
      </div>

      {/* Registry Surface */}
      <DataTable 
        title="Disbursement Registry"
        description="Encrypted record of organizational financial commitments and execution status."
        data={data}
        columns={columns}
      />
    </div>
  );
}
