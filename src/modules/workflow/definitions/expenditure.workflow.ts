import { WorkflowDefinition, TransitionGuard } from '../domain/workflow.types';
import { Permissions } from '@/modules/auth/domain/permission.model';

/**
 * Expenditure Workflow Definition (v1)
 *
 * Mirrors the shape of LeaveWorkflow so the engine, repository, audit registry,
 * and approval queue UI all stay reusable. State machine:
 *
 *   DRAFT ─ SUBMIT ──► SUBMITTED ─ APPROVE_FINANCE ──► APPROVED ─ DISBURSE ──► DISBURSED  (terminal)
 *                          │                              │
 *                   REJECT_FINANCE                      CANCEL
 *                          ▼                              ▼
 *                      REJECTED                       CANCELLED  (terminal)
 *
 * Constraints (enforced here + in ExpenditureService):
 *   1. DISBURSED is terminal — no REJECT, CANCEL, or EDIT.
 *   2. Budget balance check happens in the service before DISBURSE (state
 *      machine can't query the DB).
 *   3. Amount is immutable after SUBMIT — there is no update endpoint.
 */

const rejectionCommentGuard: TransitionGuard = ({ payload }) => {
  if (!payload?.comment || payload.comment.trim().length < 5) {
    return { valid: false, reason: 'A valid reason (min 5 chars) is required for rejections.' };
  }
  return { valid: true };
};

export const ExpenditureWorkflow: WorkflowDefinition = {
  id: 'expenditure-workflow',
  name: 'Expenditure Approval Process',
  version: 1,
  initialState: 'DRAFT',
  states: {
    DRAFT: {
      label: 'Draft',
      allowedActions: ['SUBMIT', 'CANCEL'],
    },
    SUBMITTED: {
      label: 'Pending Finance Approval',
      allowedActions: ['APPROVE_FINANCE', 'REJECT_FINANCE', 'CANCEL'],
    },
    APPROVED: {
      label: 'Approved — Awaiting Disbursement',
      allowedActions: ['DISBURSE', 'CANCEL'],
    },
    DISBURSED: {
      label: 'Disbursed',
      // Terminal — irreversible per Phase 4 constraint #1.
      allowedActions: [],
    },
    REJECTED: {
      label: 'Rejected',
      allowedActions: [],
    },
    CANCELLED: {
      label: 'Cancelled',
      allowedActions: [],
    },
  },
  transitions: {
    SUBMIT: {
      from: 'DRAFT',
      to: 'SUBMITTED',
      label: 'Submit for Approval',
      // No role gate — the requester submits. Server enforces requester == actor.
    },
    CANCEL: {
      from: ['DRAFT', 'SUBMITTED', 'APPROVED'],
      to: 'CANCELLED',
      label: 'Cancel Expenditure',
      // Cancellation allowed from any pre-disbursement state. Server enforces
      // requester-or-finance check (finance can cancel on behalf in edge cases).
    },
    APPROVE_FINANCE: {
      from: 'SUBMITTED',
      to: 'APPROVED',
      label: 'Finance Approve',
      requiredRole: 'FINANCE_MANAGER',
      requiredPermission: Permissions.FINANCE_APPROVE,
    },
    REJECT_FINANCE: {
      from: 'SUBMITTED',
      to: 'REJECTED',
      label: 'Finance Reject',
      requiredRole: 'FINANCE_MANAGER',
      requiredPermission: Permissions.FINANCE_APPROVE,
      guards: [rejectionCommentGuard],
    },
    DISBURSE: {
      from: 'APPROVED',
      to: 'DISBURSED',
      label: 'Disburse Funds',
      requiredRole: 'FINANCE_MANAGER',
      requiredPermission: Permissions.FINANCE_DISBURSE,
      // Budget-balance guard runs in ExpenditureService (needs DB lookup;
      // engine guards are sync/stateless).
    },
  },
};
