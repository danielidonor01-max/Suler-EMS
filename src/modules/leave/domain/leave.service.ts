/**
 * LeaveService — the single domain API for leave requests.
 *
 * The client never creates or transitions WorkflowInstances directly. Every
 * leave-related mutation funnels through here so that:
 *   - LeaveRequest + WorkflowInstance + WorkflowAuditEntry stay consistent
 *   - The audit trail is complete (no half-written entries)
 *   - The workflow engine is an implementation detail we can swap out later
 *
 * Pattern from feedback_workflow_encapsulation.md.
 */

import prisma from '@/lib/prisma';
import { LeaveWorkflow } from '@/modules/workflow/definitions/leave.workflow';
import { WorkflowEngine } from '@/modules/workflow/engine/workflow.engine';
import { PrismaWorkflowRepository } from '@/modules/workflow/repositories/prisma-workflow.repository';

const workflowRepo = new PrismaWorkflowRepository();

export type LeaveType = 'ANNUAL' | 'SICK' | 'CASUAL' | 'MATERNITY' | 'PATERNITY' | 'COMPASSIONATE';

export interface SubmitLeaveInput {
  employeeId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  actor: { id: string; name: string; role: string; permissions: string[] };
}

export interface TransitionLeaveInput {
  leaveRequestId: string;
  action: 'APPROVE_MANAGER' | 'REJECT_MANAGER' | 'APPROVE_HR' | 'REJECT_HR' | 'CANCEL' | 'REVOKE';
  comment?: string;
  actor: { id: string; name: string; role: string; permissions: string[] };
}

export type LeaveStatus = 'DRAFT' | 'SUBMITTED' | 'MANAGER_APPROVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

/**
 * Submit a new leave request. Creates LeaveRequest + WorkflowInstance + initial
 * audit entry in a single transaction. Returns the persisted LeaveRequest with
 * its workflow instance and audit history attached.
 */
export async function submitLeave(input: SubmitLeaveInput) {
  if (input.endDate < input.startDate) {
    throw new Error('endDate cannot be earlier than startDate');
  }
  if (input.reason.trim().length < 3) {
    throw new Error('A reason is required (min 3 chars)');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Create the leave request in SUBMITTED state.
    const leaveRequest = await tx.leaveRequest.create({
      data: {
        employeeId: input.employeeId,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason,
        status: 'SUBMITTED',
      },
    });

    // 2. Create the workflow instance pointing at the leave request.
    const instance = await tx.workflowInstance.create({
      data: {
        workflowId: LeaveWorkflow.id,
        version: LeaveWorkflow.version,
        currentState: 'SUBMITTED',
        resourceId: leaveRequest.id,
        assignedRoleId: 'MANAGER',
      },
    });

    // 3. Link request → instance.
    await tx.leaveRequest.update({
      where: { id: leaveRequest.id },
      data: { workflowInstanceId: instance.id },
    });

    // 4. First audit entry: DRAFT → SUBMITTED.
    await tx.workflowAuditEntry.create({
      data: {
        instanceId: instance.id,
        actorId: input.actor.id,
        actorName: input.actor.name,
        actorRole: input.actor.role,
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        action: 'SUBMIT',
        comment: input.reason,
      },
    });

    return tx.leaveRequest.findUniqueOrThrow({
      where: { id: leaveRequest.id },
      include: {
        employee: { select: { id: true, staffId: true, firstName: true, lastName: true, email: true } },
      },
    });
  });
}

/**
 * Transition a leave request. Delegates validation to WorkflowEngine and the
 * atomic state+audit write to PrismaWorkflowRepository. Returns the updated
 * LeaveRequest (not the workflow instance — domain owns the response shape).
 */
export async function transitionLeave(input: TransitionLeaveInput) {
  const leaveRequest = await prisma.leaveRequest.findUniqueOrThrow({
    where: { id: input.leaveRequestId },
  });
  if (!leaveRequest.workflowInstanceId) {
    throw new Error(`Leave request ${input.leaveRequestId} has no workflow instance`);
  }

  const instanceResult = await workflowRepo.getInstance(leaveRequest.workflowInstanceId);
  if (!instanceResult.success) {
    throw new Error(instanceResult.error.message);
  }
  const instance = instanceResult.data;

  const validation = WorkflowEngine.evaluateTransition(LeaveWorkflow, {
    instance,
    actor: input.actor as any,
    action: input.action,
    comment: input.comment,
  });
  if (!validation.success) {
    const err = new Error(validation.error.message);
    (err as any).code = validation.error.code;
    throw err;
  }

  const transitionDef = LeaveWorkflow.transitions[input.action];
  const execResult = await workflowRepo.executeTransition(
    {
      instance,
      actor: input.actor as any,
      action: input.action,
      comment: input.comment,
      payload: { toState: transitionDef.to },
    },
    { table: 'LeaveRequest', status: transitionDef.to },
  );
  if (!execResult.success) {
    throw new Error(execResult.error.message);
  }

  return prisma.leaveRequest.findUniqueOrThrow({
    where: { id: leaveRequest.id },
    include: {
      employee: { select: { id: true, staffId: true, firstName: true, lastName: true, email: true } },
    },
  });
}

export interface ListLeaveFilter {
  employeeId?: string;
  /** When set, returns requests whose workflow instance is in any of these states. */
  states?: LeaveStatus[];
  /** When true, includes audit history. Off by default to keep payloads small. */
  includeHistory?: boolean;
  limit?: number;
}

export async function listLeaveRequests(filter: ListLeaveFilter = {}) {
  return prisma.leaveRequest.findMany({
    where: {
      ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
      ...(filter.states && filter.states.length ? { status: { in: filter.states } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filter.limit ?? 100,
    include: {
      employee: { select: { id: true, staffId: true, firstName: true, lastName: true, email: true, jobTitle: true, branch: true } },
    },
  });
}

export async function getLeaveRequest(id: string, opts: { includeHistory?: boolean } = {}) {
  const request = await prisma.leaveRequest.findUniqueOrThrow({
    where: { id },
    include: {
      employee: { select: { id: true, staffId: true, firstName: true, lastName: true, email: true, jobTitle: true, branch: true } },
    },
  });

  if (!opts.includeHistory || !request.workflowInstanceId) return { ...request, history: [] };

  const history = await prisma.workflowAuditEntry.findMany({
    where: { instanceId: request.workflowInstanceId },
    orderBy: { timestamp: 'asc' },
  });
  return { ...request, history };
}
