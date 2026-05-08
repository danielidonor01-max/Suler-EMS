"use client";

import React, { useState } from 'react';
import { 
  UserPlus, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Filter, 
  Search,
  ExternalLink,
  MoreHorizontal,
  PlusCircle,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { MetricCard } from '@/components/dashboard/MetricCard';
import { InviteUserModal } from '@/components/modals/InviteUserModal';

// Mock Invitation Data
const MOCK_INVITATIONS = [
  { id: 'INV-001', name: 'Dr. Afolabi James', email: 'a.james@suler.com', role: 'Medical Director', office: 'Lagos HQ', status: 'PENDING', sentAt: '2026-05-06 09:00', expiresAt: '2026-05-13 09:00' },
  { id: 'INV-002', name: 'Sarah Chidimma', email: 's.chidimma@suler.com', role: 'Finance Admin', office: 'Abuja Operations', status: 'ACTIVATED', sentAt: '2026-05-05 14:20', expiresAt: '-' },
  { id: 'INV-003', name: 'John Doe', email: 'j.doe@suler.com', role: 'Operations Manager', office: 'Benin Branch', status: 'EXPIRED', sentAt: '2026-04-20 10:00', expiresAt: '2026-04-27 10:00' },
  { id: 'INV-004', name: 'Zainab Yusuf', email: 'z.yusuf@suler.com', role: 'HR Lead', office: 'Lagos HQ', status: 'PENDING', sentAt: '2026-05-07 11:30', expiresAt: '2026-05-14 11:30' },
];

export default function ProvisioningHub() {
  const [invites] = useState(MOCK_INVITATIONS);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const columns = [
    {
      header: "Recipient Context",
      accessor: "name",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] uppercase">
            {val.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-[14px] font-black text-slate-900 tracking-tight leading-none mb-1">{val}</div>
            <div className="text-[11px] font-bold text-slate-400 lowercase tracking-tight">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: "Identity Scoping",
      accessor: "role",
      render: (val: string, row: any) => (
        <div>
          <div className="text-[13px] font-black text-slate-700 tracking-tight mb-1">{val}</div>
          <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{row.office}</div>
        </div>
      )
    },
    {
      header: "Lifecycle Status",
      accessor: "status",
      render: (val: string) => {
        const styles: Record<string, string> = {
          PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
          ACTIVATED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          EXPIRED: 'bg-slate-100 text-slate-500 border-slate-200'
        };
        return (
          <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${styles[val]}`}>
            {val}
          </span>
        );
      }
    },
    {
      header: "Expiration",
      accessor: "expiresAt",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[12px] font-medium text-slate-500">{val}</span>
        </div>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">
      
      {/* High-Authority Header */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-indigo-50 text-indigo-500 rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 border border-indigo-100">
                <ShieldCheck className="w-3 h-3" />
                Identity Infrastructure
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Provisioning Hub
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Secure invitation-based onboarding pipeline. Manage organizational identity lifecycle and access provisioning.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20"
            >
              <UserPlus className="w-[18px] h-[18px] stroke-[1.5px]" />
              Invite New User
            </button>
            <button className="bg-white hover:bg-slate-50 text-slate-900 flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border border-slate-200">
              <Users className="w-[18px] h-[18px] stroke-[1.5px]" />
              Bulk Provision
            </button>
          </div>
        </div>
      </div>

      {/* Lifecycle KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Active Invites" value="12" variant="tonal-info" icon={Mail} />
        <MetricCard label="Activation Rate" value="92%" variant="tonal-success" icon={CheckCircle2} />
        <MetricCard label="Expired / Revoked" value="3" variant="tonal-warning" icon={AlertCircle} />
        <MetricCard label="Total Identities" value="1,284" variant="tonal-info" icon={Users} />
      </div>

      {/* Provisioning Workspace */}
      <DataTable 
        title="Identity Onboarding Pipeline"
        description="Monitor pending invitations and verify organizational provisioning status across all hubs."
        data={invites}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No pending invitations found in the pipeline."
      />

      {/* Invite Modal */}
      <InviteUserModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
