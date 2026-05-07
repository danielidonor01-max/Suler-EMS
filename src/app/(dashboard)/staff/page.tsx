"use client";

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Briefcase, 
  Building2, 
  Activity, 
  Download,
  Filter,
  Search,
  Sparkles,
  MapPin
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { MetricCard } from '@/components/dashboard/MetricCard';

// Initial Mock Data
const MOCK_STAFF = [
  { id: 'SUL-001', name: 'Chinedu Okoro', role: 'Principal Admin', department: 'Executive', location: 'Lagos HQ' },
  { id: 'SUL-002', name: 'Sarah Williams', role: 'Operations Lead', department: 'Logistics', location: 'Abuja Branch' },
  { id: 'SUL-003', name: 'David Okafor', role: 'Financial Controller', department: 'Finance', location: 'Lagos HQ' },
  { id: 'SUL-004', name: 'Blessing Udoh', role: 'HR Manager', department: 'Human Resources', location: 'Port Harcourt' },
];

export default function WorkforcePage() {
  const [data] = useState(MOCK_STAFF);

  const columns = [
    {
      header: "Staff Member",
      accessor: "name",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
            {val.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-[14px] font-black text-slate-900 tracking-tight">{val}</div>
            <div className="text-[11px] font-bold text-slate-400 mt-0.5">{row.id}</div>
          </div>
        </div>
      )
    },
    {
      header: "Designation",
      accessor: "role",
      render: (val: string, row: any) => (
        <div>
          <div className="text-[13px] font-black text-slate-700 tracking-tight">{val}</div>
          <div className="text-[11px] font-bold text-indigo-500/70 uppercase tracking-widest mt-0.5">{row.department}</div>
        </div>
      )
    },
    {
      header: "Operational Hub",
      accessor: "location",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[13px] font-bold text-slate-600">{val}</span>
        </div>
      )
    },
    {
      header: "Control",
      accessor: "id",
      render: () => (
        <button className="px-4 py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all">
          Profile
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
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Organizational Intelligence
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Workforce Registry
            </h1>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Comprehensive record of organization-wide human resources, departmental structures, and operational roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border border-slate-100">
              <Building2 className="w-4 h-4" />
              Org Chart
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2.5 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-100">
              <UserPlus className="w-4 h-4" />
              Onboard Staff
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl" />
      </div>

      {/* KPI Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Workforce" 
          value="1,284" 
          trend={{ value: 12, isPositive: true }}
          variant="tonal-info"
          icon="groups"
        />
        <MetricCard 
          label="Active Roles" 
          value="42" 
          variant="tonal-success"
          icon="work"
        />
        <MetricCard 
          label="Pending Sync" 
          value="14" 
          variant="tonal-warning"
          icon="sync"
        />
        <MetricCard 
          label="Capacity" 
          value="94%" 
          variant="tonal-success"
          icon="trending_up"
        />
      </div>

      {/* Registry Surface */}
      <DataTable 
        title="Staff Directory"
        description="Executive record of all organizational staff members and their operational designations."
        data={data}
        columns={columns}
      />
    </div>
  );
}
