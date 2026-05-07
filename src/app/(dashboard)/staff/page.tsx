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
  MapPin,
  ShieldCheck,
  MoreVertical,
  Mail,
  Phone,
  Layout
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Drawer } from '@/components/common/Drawer';

// Initial Mock Data
const MOCK_STAFF = [
  { id: 'SUL-001', name: 'Chinedu Okoro', role: 'Principal Admin', department: 'Executive', location: 'Lagos HQ', email: 'c.okoro@suler.com', phone: '+234 801 234 5678' },
  { id: 'SUL-002', name: 'Sarah Williams', role: 'Operations Lead', department: 'Logistics', location: 'Abuja Branch', email: 's.williams@suler.com', phone: '+234 802 345 6789' },
  { id: 'SUL-003', name: 'David Okafor', role: 'Financial Controller', department: 'Finance', location: 'Lagos HQ', email: 'd.okafor@suler.com', phone: '+234 803 456 7890' },
  { id: 'SUL-004', name: 'Blessing Udoh', role: 'HR Manager', department: 'Human Resources', location: 'Port Harcourt', email: 'b.udoh@suler.com', phone: '+234 804 567 8901' },
];

export default function WorkforcePage() {
  const [data] = useState(MOCK_STAFF);
  const [selectedStaff, setSelectedStaff] = useState<typeof MOCK_STAFF[0] | null>(null);

  const columns = [
    {
      header: "Staff Member",
      accessor: "name",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] uppercase">
            {val.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-[14px] font-black text-slate-900 tracking-tight leading-none mb-1">{val}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{row.id}</div>
          </div>
        </div>
      )
    },
    {
      header: "Designation",
      accessor: "role",
      render: (val: string, row: any) => (
        <div>
          <div className="text-[13px] font-black text-slate-700 tracking-tight leading-none mb-1.5">{val}</div>
          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em]">{row.department}</div>
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
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">
      
      {/* Executive Hero */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 border border-slate-100">
                <ShieldCheck className="w-3 h-3" />
                Organizational Intelligence
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Workforce Registry
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Comprehensive record of organization-wide human resources, departmental structures, and operational roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all">
                <Layout className="w-4 h-4" />
                Org Chart
             </button>
            <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md">
              <UserPlus className="w-4 h-4" />
              Onboard Staff
            </button>
          </div>
        </div>
      </div>

      {/* KPI Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Workforce" value="1,284" trend={{ direction: 'up', value: '12%' }} variant="tonal-info" icon={Users} />
        <MetricCard label="Active Roles" value="42" variant="tonal-success" icon={Briefcase} />
        <MetricCard label="Pending Sync" value="14" variant="tonal-warning" icon={Activity} />
        <MetricCard label="Workload Capacity" value="94%" variant="tonal-success" icon={ShieldCheck} />
      </div>

      {/* Registry Surface */}
      <DataTable 
        title="Staff Directory"
        description="Executive record of all organizational staff members and their operational designations."
        data={data}
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
        <div className="space-y-10 animate-in">
           {/* Summary Card */}
           <div className="p-7 bg-slate-50 border border-slate-100 rounded-[20px] space-y-6">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 text-xl font-black">
                   {selectedStaff?.name.split(' ').map(n => n[0]).join('')}
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedStaff?.name}</h3>
                    <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">{selectedStaff?.role}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Department</span>
                    <p className="text-[14px] font-bold text-slate-900">{selectedStaff?.department}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Primary Hub</span>
                    <p className="text-[14px] font-bold text-slate-900">{selectedStaff?.location}</p>
                 </div>
              </div>
           </div>

           {/* Contact Detail Section */}
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-slate-400" />
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Intelligence</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                       <Mail className="w-4.5 h-4.5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Work Email</p>
                       <p className="text-[13px] font-bold text-slate-900">{selectedStaff?.email}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                       <Phone className="w-4.5 h-4.5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Operational Mobile</p>
                       <p className="text-[13px] font-bold text-slate-900">{selectedStaff?.phone}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Actions */}
           <div className="grid grid-cols-2 gap-4">
              <button className="bg-slate-900 text-white p-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md hover:bg-black transition-all">
                 Initiate Transfer
              </button>
              <button className="bg-white border border-slate-200 text-slate-600 p-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-slate-300 transition-all">
                 Modify Access
              </button>
           </div>
        </div>
      </Drawer>
    </div>
  );
}
