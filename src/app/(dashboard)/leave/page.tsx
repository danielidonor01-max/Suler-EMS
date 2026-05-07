"use client";

import React, { useState } from 'react';
import { Activity, Plus, Download, ShieldCheck, History, Calendar, Clock, ArrowRight, User } from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { Drawer } from "@/components/common/Drawer";
import { WorkflowInstance, WorkflowAction } from '@/modules/workflow/domain/workflow.types';
import { WorkflowEngine } from '@/modules/workflow/engine/workflow.engine';
import { LeaveWorkflow } from '@/modules/workflow/definitions/leave.workflow';
import { WorkflowStatusBadge, ApprovalTimeline, WorkflowActionBar } from '@/components/workflow/WorkflowUI';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';

const INITIAL_LEAVE_REQUESTS: (WorkflowInstance & { employeeName: string, type: string, dates: string })[] = [
  {
    id: 'leave-001' as any,
    workflowId: 'leave-workflow',
    version: 1,
    currentState: 'SUBMITTED',
    resourceId: 'res-001' as any,
    employeeName: 'Alex Okereke',
    type: 'Annual Leave',
    dates: '10 Jun - 15 Jun',
    history: [
      {
        id: 'audit-001' as any,
        instanceId: 'leave-001' as any,
        timestamp: '2024-05-01T10:00:00Z',
        actorId: 'user-emp-001' as any,
        actorName: 'Alex Okereke',
        actorRole: 'EMPLOYEE',
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        action: 'SUBMIT',
        comment: 'Vacation with family in Enugu.',
      }
    ],
    createdAt: '2024-05-01T10:00:00Z',
    updatedAt: '2024-05-01T10:00:00Z',
  },
  {
    id: 'leave-002' as any,
    workflowId: 'leave-workflow',
    version: 1,
    currentState: 'MANAGER_APPROVED',
    resourceId: 'res-002' as any,
    employeeName: 'David Okafor',
    type: 'Sick Leave',
    dates: '06 May - 07 May',
    history: [
       { id: 'a1' as any, instanceId: 'l2' as any, timestamp: '2024-05-01T09:00:00Z', actorId: 'u1' as any, actorName: 'David Okafor', actorRole: 'EMPLOYEE', fromState: 'DRAFT', toState: 'SUBMITTED', action: 'SUBMIT' },
       { id: 'a2' as any, instanceId: 'l2' as any, timestamp: '2024-05-02T14:00:00Z', actorId: 'u2' as any, actorName: 'Segun Manager', actorRole: 'MANAGER', fromState: 'SUBMITTED', toState: 'MANAGER_APPROVED', action: 'APPROVE_MANAGER', comment: 'Approved. Get well soon.' },
    ],
    createdAt: '2024-05-01T09:00:00Z',
    updatedAt: '2024-05-02T14:00:00Z',
  }
];

export default function LeaveRequestsPage() {
  const { user } = useAccess();
  const [requests, setRequests] = useState(INITIAL_LEAVE_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<typeof INITIAL_LEAVE_REQUESTS[0] | null>(null);

  const handleAction = (action: WorkflowAction, comment?: string) => {
    if (!selectedRequest) return;

    const result = WorkflowEngine.executeTransition(LeaveWorkflow, {
      instance: selectedRequest,
      actor: { id: user.id as any, name: user.name, role: user.role, permissions: user.permissions },
      action,
      comment,
      payload: { comment } 
    });

    if (result.success) {
      const updated = { ...selectedRequest, ...result.data };
      setRequests(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
      setSelectedRequest(updated as any);
    }
  };

  const columns = [
    {
      header: "Staff Member",
      accessor: "employeeName",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">
              {val.split(' ').map(n => n[0]).join('')}
           </div>
           <div>
              <div className="text-[14px] font-black text-slate-900 tracking-tight leading-none mb-1">{val}</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{row.type}</div>
           </div>
        </div>
      )
    },
    {
      header: "Operational Window",
      accessor: "dates",
      render: (val: string) => <span className="text-[13px] font-bold text-slate-600">{val}</span>
    },
    {
      header: "Pipeline Status",
      accessor: "currentState",
      render: (val: string) => <WorkflowStatusBadge state={val} />
    },
    {
      header: "Last Update",
      accessor: "updatedAt",
      render: (val: string) => {
        const d = new Date(val);
        const formatted = new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: '2-digit' }).format(d);
        return <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{formatted}</span>;
      }
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">
      
      {/* Executive Hero */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Workflow Engine Active
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Leave Management
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Review and process organization-wide leave requests and approval pipelines with executive oversight.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all">
              Export Registry
            </button>
            <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md">
              <Plus className="w-4 h-4" />
              New Request
            </button>
          </div>
        </div>
      </div>

      {/* Operational Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Pending Approvals" value="14" trend={{ direction: 'up', value: '2' }} variant="tonal-warning" icon={Clock} />
        <MetricCard label="Active Workflows" value="42" variant="tonal-info" icon={Activity} />
        <MetricCard label="Approvals Today" value="8" trend={{ direction: 'up', value: '12' }} variant="tonal-success" icon={ShieldCheck} />
        <MetricCard label="Escalations" value="1" variant="tonal-danger" icon={Activity} />
      </div>

      {/* Registry Stream */}
      <DataTable 
        title="Active Workflow Pipelines"
        description="Real-time status of organization-wide leave requests and approval steps."
        data={requests}
        columns={columns}
        onRowClick={(row) => setSelectedRequest(row)}
      />

      {/* Workflow Depth Surface (Contextual Drawer) */}
      <Drawer 
        isOpen={!!selectedRequest} 
        onClose={() => setSelectedRequest(null)}
        title={`Leave Request: ${selectedRequest?.employeeName}`}
        subtitle={selectedRequest?.id as any}
      >
        <div className="space-y-10 animate-in">
           {/* Request Summary Block */}
           <div className="p-7 bg-slate-50 border border-slate-100 rounded-[20px] space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <span className="text-[13px] font-black text-slate-900">{selectedRequest?.employeeName}</span>
                 </div>
                 <WorkflowStatusBadge state={selectedRequest?.currentState || ''} />
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Leave Type</span>
                    <p className="text-[14px] font-bold text-slate-900">{selectedRequest?.type}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Operational Period</span>
                    <p className="text-[14px] font-bold text-slate-900">{selectedRequest?.dates}</p>
                 </div>
              </div>
           </div>

           {/* Executive Actions */}
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-slate-400" />
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Governance Authorization</h4>
              </div>
              <WorkflowActionBar 
                instance={selectedRequest as any} 
                definition={LeaveWorkflow} 
                onAction={handleAction} 
              />
           </div>

           {/* Activity Timeline Segment */}
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <History className="w-4 h-4 text-slate-400" />
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Approval Timeline</h4>
              </div>
              <div className="p-2 border border-slate-100 rounded-[20px]">
                 <ApprovalTimeline instance={selectedRequest as any} />
              </div>
           </div>
        </div>
      </Drawer>
    </div>
  );
}
