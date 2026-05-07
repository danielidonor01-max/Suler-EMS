"use client";

import React, { useState } from 'react';
import { Sparkles, Activity, Plus, Filter, Download } from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { WorkflowInstance, WorkflowAction } from '@/modules/workflow/domain/workflow.types';
import { WorkflowEngine } from '@/modules/workflow/engine/workflow.engine';
import { LeaveWorkflow } from '@/modules/workflow/definitions/leave.workflow';
import { WorkflowStatusBadge, ApprovalTimeline, WorkflowActionBar } from '@/components/workflow/WorkflowUI';
import { useAccess } from '@/context/AccessContext';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/modals/Modal';
import { MetricCard } from '@/components/dashboard/MetricCard';

// Initial Mock Data
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
    } else {
      alert(`Error: ${result.error.message}`);
    }
  };

  const columns = [
    {
      header: "Staff Member",
      accessor: "employeeName",
      render: (val: string, row: any) => (
        <div>
          <div className="text-[14px] font-black text-slate-900 tracking-tight">{val}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-0.5">{row.type}</div>
        </div>
      )
    },
    {
      header: "Dates",
      accessor: "dates",
      render: (val: string) => <span className="text-[13px] font-bold text-slate-600">{val}</span>
    },
    {
      header: "Status",
      accessor: "currentState",
      render: (val: string) => <WorkflowStatusBadge state={val} />
    },
    {
      header: "Last Activity",
      accessor: "updatedAt",
      render: (val: string) => {
        const d = new Date(val);
        const formatted = new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
        return <span className="text-[12px] font-bold text-slate-400">{formatted}</span>;
      }
    },
    {
      header: "Control",
      accessor: "id",
      render: (_: any, row: any) => (
        <button 
          className="px-4 py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
          onClick={() => setSelectedRequest(row)}
        >
          Manage
        </button>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      {/* Premium Executive Hero */}
      <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-premium relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-[600px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Activity className="w-3 h-3" />
                Workflow Engine
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Leave Management
            </h1>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Review and process organization-wide leave requests and approval pipelines with executive oversight.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border border-slate-100">
              <Download className="w-4 h-4" />
              Export Pipeline
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2.5 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-100">
              <Plus className="w-4 h-4" />
              New Request
            </button>
          </div>
        </div>

        {/* Subtle background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl" />
      </div>

      {/* Tonal KPI Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Pending Approvals" 
          value="14" 
          trend={{ value: 2, isPositive: false }}
          variant="tonal-warning"
          icon="pending"
        />
        <MetricCard 
          label="Active Workflows" 
          value="42" 
          variant="tonal-info"
          icon="activity"
        />
        <MetricCard 
          label="Approvals Today" 
          value="8" 
          trend={{ value: 12, isPositive: true }}
          variant="tonal-success"
          icon="verified"
        />
        <MetricCard 
          label="Rejected Items" 
          value="3" 
          variant="tonal-danger"
          icon="block"
        />
      </div>

      {/* Primary Execution Surface */}
      <DataTable 
        title="Active Pipelines"
        description="Real-time status of organization-wide leave requests and approval steps."
        data={requests}
        columns={columns}
      />

      {/* Workflow Detail Modal */}
      {selectedRequest && (
        <Modal isOpen={true} onClose={() => setSelectedRequest(null)} size="lg">
          <ModalHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[18px] bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Leave Request: {selectedRequest.employeeName}</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry ID: {selectedRequest.id}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-8">
                <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[28px]">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-6">Request Context</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                      <span className="text-sm font-bold text-slate-900">{selectedRequest.type}</span>
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Operational Period</label>
                      <span className="text-sm font-bold text-slate-900">{selectedRequest.dates}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-6">Executive Actions</h4>
                  <WorkflowActionBar 
                    instance={selectedRequest} 
                    definition={LeaveWorkflow} 
                    onAction={handleAction} 
                  />
                </div>
              </div>

              <div className="border-l border-slate-100 pl-8">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-6">Activity Timeline</h4>
                 <ApprovalTimeline instance={selectedRequest} />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
             <button 
               className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-black uppercase tracking-wider transition-all" 
               onClick={() => setSelectedRequest(null)}
             >
               Dismiss
             </button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
