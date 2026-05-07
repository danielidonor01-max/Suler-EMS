"use client";

import React, { useState } from 'react';
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, ColumnDef } from "@/components/tables/DataTable";
import { WorkflowInstance, WorkflowAction } from '@/modules/workflow/domain/workflow.types';
import { WorkflowEngine } from '@/modules/workflow/engine/workflow.engine';
import { LeaveWorkflow } from '@/modules/workflow/definitions/leave.workflow';
import { WorkflowStatusBadge, ApprovalTimeline, WorkflowActionBar } from '@/components/workflow/WorkflowUI';
import { useAccess } from '@/context/AccessContext';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/modals/Modal';

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
      payload: { comment } // Guard expects payload.comment
    });

    if (result.success) {
      const updated = { ...selectedRequest, ...result.data };
      setRequests(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
      setSelectedRequest(updated as any);
    } else {
      alert(`Error: ${result.error.message}`);
    }
  };

  const columns: ColumnDef<typeof INITIAL_LEAVE_REQUESTS[0]>[] = [
    {
      header: "Staff Member",
      className: "pl-6",
      cell: (row) => (
        <div>
          <div className="cell-primary">{row.employeeName}</div>
          <div className="cell-secondary">{row.type}</div>
        </div>
      )
    },
    {
      header: "Dates",
      cell: (row) => <span className="text-[13px] text-text-primary">{row.dates}</span>
    },
    {
      header: "Status",
      cell: (row) => <WorkflowStatusBadge state={row.currentState} />
    },
    {
      header: "Last Activity",
      cell: (row) => {
        const d = new Date(row.updatedAt);
        const formatted = new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
        return <span className="text-[12px] text-text-muted">{formatted}</span>;
      }
    },
    {
      header: "Actions",
      align: "right",
      className: "pr-6",
      cell: (row) => (
        <button 
          className="btn btn-sm btn-secondary"
          onClick={() => setSelectedRequest(row)}
        >
          Manage
        </button>
      )
    }
  ];

  return (
    <div className="p-[var(--content-padding)]">
      <PageHeader 
        title="Leave Management"
        description="Review and process organization-wide leave requests and approval pipelines."
      />

      <div className="table-card bg-surface border border-border shadow-1 rounded-xl">
        <DataTable 
          data={requests}
          columns={columns}
          keyExtractor={(r) => r.id}
        />
      </div>

      {/* Workflow Detail Modal */}
      {selectedRequest && (
        <Modal isOpen={true} onClose={() => setSelectedRequest(null)} size="lg">
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">event_busy</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Leave Request: {selectedRequest.employeeName}</h3>
                <p className="text-xs text-text-muted">Workflow ID: {selectedRequest.id}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div className="p-4 bg-bg border border-border rounded-lg">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Request Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] text-text-muted block mb-1">Type</label>
                      <span className="text-sm font-medium">{selectedRequest.type}</span>
                    </div>
                    <div>
                      <label className="text-[11px] text-text-muted block mb-1">Period</label>
                      <span className="text-sm font-medium">{selectedRequest.dates}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Approval Actions</h4>
                  <WorkflowActionBar 
                    instance={selectedRequest} 
                    definition={LeaveWorkflow} 
                    onAction={handleAction} 
                  />
                </div>
              </div>

              <div className="border-l border-border pl-6">
                 <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Activity Log</h4>
                 <ApprovalTimeline instance={selectedRequest} />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
             <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>Close</button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
