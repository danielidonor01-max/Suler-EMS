import { WorkflowDefinition, TransitionGuard } from '../domain/workflow.types';
import { Permissions } from '@/modules/auth/domain/permission.model';

/**
 * Guard: Rejections must have a comment.
 */
const rejectionCommentGuard: TransitionGuard = ({ payload }) => {
  if (!payload?.comment || payload.comment.trim().length < 5) {
    return { valid: false, reason: 'A valid reason (min 5 chars) is required for rejections.' };
  }
  return { valid: true };
};

/**
 * Leave Request Workflow Definition (v1)
 */
export const LeaveWorkflow: WorkflowDefinition = {
  id: 'leave-workflow',
  name: 'Leave Request Process',
  version: 1,
  initialState: 'DRAFT',
  states: {
    DRAFT: {
      label: 'Draft',
      allowedActions: ['SUBMIT', 'CANCEL'],
    },
    SUBMITTED: {
      label: 'Pending Manager Review',
      allowedActions: ['APPROVE_MANAGER', 'REJECT_MANAGER', 'CANCEL'],
    },
    MANAGER_APPROVED: {
      label: 'Pending HR Review',
      allowedActions: ['APPROVE_HR', 'REJECT_HR'],
    },
    APPROVED: {
      label: 'Approved',
      allowedActions: ['REVOKE'],
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
    },
    CANCEL: {
      from: ['DRAFT', 'SUBMITTED'],
      to: 'CANCELLED',
      label: 'Cancel Request',
    },
    APPROVE_MANAGER: {
      from: 'SUBMITTED',
      to: 'MANAGER_APPROVED',
      label: 'Manager Approve',
      requiredRole: 'MANAGER',
    },
    REJECT_MANAGER: {
      from: 'SUBMITTED',
      to: 'REJECTED',
      label: 'Manager Reject',
      requiredRole: 'MANAGER',
      guards: [rejectionCommentGuard],
    },
    APPROVE_HR: {
      from: 'MANAGER_APPROVED',
      to: 'APPROVED',
      label: 'Final HR Approval',
      requiredRole: 'HR',
      requiredPermission: Permissions.LEAVE_APPROVE,
    },
    REJECT_HR: {
      from: 'MANAGER_APPROVED',
      to: 'REJECTED',
      label: 'HR Reject',
      requiredRole: 'HR',
      requiredPermission: Permissions.LEAVE_APPROVE,
      guards: [rejectionCommentGuard],
    },
    REVOKE: {
      from: 'APPROVED',
      to: 'CANCELLED',
      label: 'Revoke Approval',
      requiredRole: 'HR',
      requiredPermission: Permissions.LEAVE_APPROVE,
    },
  },
};
