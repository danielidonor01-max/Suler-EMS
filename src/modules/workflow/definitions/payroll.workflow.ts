import { WorkflowDefinition } from '../domain/workflow.types';
import { Permissions } from '@/modules/auth/domain/permission.model';

/**
 * Payroll Run Workflow Definition (v1)
 *
 *   DRAFT ── SUBMIT_FOR_REVIEW ─► REVIEW ── APPROVE ─► APPROVED ── PROCESS ─► PROCESSED  (terminal)
 *      │                              │
 *      └────── CANCEL ──┬─────── CANCEL ──┬── REJECT ──► CANCELLED
 *                       │                 │
 *                       └─────────────────┘
 *
 * Constraints (defined here + enforced in PayrollService):
 *   1. PROCESSED is terminal — no edits, no recalc, no field mutations.
 *   2. SalaryStructure values are snapshotted onto each PayrollEntry at run
 *      creation time. Later salary changes never retroactively affect a run.
 *   3. PROCESS is idempotent via `updateMany` state guard inside the service.
 *   4. Service runs a reconciliation check (totals == Σ entries) before
 *      committing the PROCESS transition.
 *
 * Role canon: see ARCHITECTURE.md §2. HR_ADMIN may submit/review; only
 * FINANCE_MANAGER may APPROVE and PROCESS.
 */
export const PayrollRunWorkflow: WorkflowDefinition = {
  id: 'payroll-run-workflow',
  name: 'Payroll Run Approval Process',
  version: 1,
  initialState: 'DRAFT',
  states: {
    DRAFT: {
      label: 'Draft',
      allowedActions: ['SUBMIT_FOR_REVIEW', 'CANCEL'],
    },
    REVIEW: {
      label: 'In Review',
      allowedActions: ['APPROVE', 'REJECT', 'RETURN_TO_DRAFT'],
    },
    APPROVED: {
      label: 'Approved — Awaiting Processing',
      allowedActions: ['PROCESS', 'CANCEL'],
    },
    PROCESSED: {
      label: 'Processed',
      // Terminal — Constraint #1. Mistakes corrected by new adjustments + new run.
      allowedActions: [],
    },
    CANCELLED: {
      label: 'Cancelled',
      allowedActions: [],
    },
  },
  transitions: {
    SUBMIT_FOR_REVIEW: {
      from: 'DRAFT',
      to: 'REVIEW',
      label: 'Submit for Review',
      requiredRole: 'FINANCE_MANAGER',
      requiredPermission: Permissions.PAYROLL_EDIT,
    },
    RETURN_TO_DRAFT: {
      from: 'REVIEW',
      to: 'DRAFT',
      label: 'Return to Draft',
      requiredRole: 'HR_ADMIN',
      requiredPermission: Permissions.PAYROLL_VIEW,
    },
    APPROVE: {
      from: 'REVIEW',
      to: 'APPROVED',
      label: 'Approve Payroll Run',
      requiredRole: 'FINANCE_MANAGER',
      requiredPermission: Permissions.PAYROLL_APPROVE,
    },
    REJECT: {
      from: 'REVIEW',
      to: 'CANCELLED',
      label: 'Reject Payroll Run',
      requiredRole: 'FINANCE_MANAGER',
      requiredPermission: Permissions.PAYROLL_APPROVE,
    },
    PROCESS: {
      from: 'APPROVED',
      to: 'PROCESSED',
      label: 'Process Payroll Run',
      requiredRole: 'FINANCE_MANAGER',
      requiredPermission: Permissions.PAYROLL_PROCESS,
      // Reconciliation guard runs in the service (needs DB lookup;
      // engine guards are sync/stateless).
    },
    CANCEL: {
      from: ['DRAFT', 'APPROVED'],
      to: 'CANCELLED',
      label: 'Cancel Run',
      requiredRole: 'FINANCE_MANAGER',
      requiredPermission: Permissions.PAYROLL_EDIT,
    },
  },
};
