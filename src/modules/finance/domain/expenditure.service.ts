/**
 * ExpenditureService — single domain API for expenditures. Mirrors LeaveService.
 *
 * Constraints enforced (Phase 4):
 *   1. DISBURSED is irreversible — workflow definition has no exits from DISBURSED.
 *   2. Budget balance validated before DISBURSE — throws BUDGET_EXCEEDED (→ 409).
 *   3. Amount is immutable after SUBMIT — there is intentionally no `updateAmount`.
 *   4. Workflow engine + repository carry every state change; client never
 *      touches WorkflowInstance directly (encapsulation rule).
 */

import prisma from '@/lib/prisma';
import { ExpenditureWorkflow } from '@/modules/workflow/definitions/expenditure.workflow';
import { WorkflowEngine } from '@/modules/workflow/engine/workflow.engine';

export type ExpenditureAction =
  | 'SUBMIT'
  | 'APPROVE_FINANCE'
  | 'REJECT_FINANCE'
  | 'DISBURSE'
  | 'CANCEL';

export type ExpenditureStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CANCELLED';

export interface Actor {
  id: string;
  name: string;
  role: string;
  permissions: string[];
  employeeId?: string;
}

export interface SubmitExpenditureInput {
  budgetId: string;
  categoryId?: string | null;
  amount: number;
  currency?: string;
  description: string;
  vendor?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  actor: Actor;
}

export class ExpenditureError extends Error {
  constructor(public code: string, message: string, public httpStatus = 400) {
    super(message);
    this.name = 'ExpenditureError';
  }
}

/**
 * Submit a new expenditure. Atomically creates Expenditure (status=SUBMITTED) +
 * WorkflowInstance + first audit entry. Amount snapshot is frozen here.
 */
export async function submitExpenditure(input: SubmitExpenditureInput) {
  if (input.amount <= 0) {
    throw new ExpenditureError('VALIDATION_ERROR', 'amount must be positive');
  }
  if (input.description.trim().length < 3) {
    throw new ExpenditureError('VALIDATION_ERROR', 'description is required');
  }
  if (!input.actor.employeeId) {
    throw new ExpenditureError('NO_EMPLOYEE', 'Submitter must be linked to an employee record');
  }

  // Verify the budget is active.
  const budget = await prisma.budget.findUniqueOrThrow({
    where: { id: input.budgetId },
    select: { id: true, status: true, currency: true },
  });
  if (budget.status !== 'ACTIVE') {
    throw new ExpenditureError('BUDGET_INACTIVE', `Budget is ${budget.status}, cannot accept expenditures`);
  }

  return prisma.$transaction(async (tx) => {
    const expenditure = await tx.expenditure.create({
      data: {
        budgetId: input.budgetId,
        categoryId: input.categoryId ?? null,
        amount: input.amount,
        currency: input.currency ?? budget.currency ?? 'NGN',
        description: input.description.trim(),
        vendor: input.vendor,
        reference: input.reference,
        requestedById: input.actor.employeeId!,
        metadata: input.metadata as any,
        status: 'SUBMITTED',
      },
    });

    const instance = await tx.workflowInstance.create({
      data: {
        workflowId: ExpenditureWorkflow.id,
        version: ExpenditureWorkflow.version,
        currentState: 'SUBMITTED',
        resourceId: expenditure.id,
        assignedRoleId: 'FINANCE_MANAGER',
      },
    });

    await tx.expenditure.update({
      where: { id: expenditure.id },
      data: { workflowInstanceId: instance.id },
    });

    await tx.workflowAuditEntry.create({
      data: {
        instanceId: instance.id,
        actorId: input.actor.id,
        actorName: input.actor.name,
        actorRole: input.actor.role,
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        action: 'SUBMIT',
        comment: input.description.trim().slice(0, 200),
      },
    });

    return tx.expenditure.findUniqueOrThrow({
      where: { id: expenditure.id },
      include: {
        budget: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, code: true } },
        requestedBy: { select: { id: true, staffId: true, firstName: true, lastName: true, email: true } },
      },
    });
  });
}

export interface TransitionExpenditureInput {
  expenditureId: string;
  action: ExpenditureAction;
  comment?: string;
  paymentMethod?: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'CARD';
  actor: Actor;
}

/**
 * Transition expenditure status. Validates via WorkflowEngine, then atomically
 * writes audit entry + workflow instance + expenditure status (and on DISBURSE,
 * increments Budget.spentAmount + Category.spentAmount).
 *
 * Budget balance is verified before DISBURSE inside the same transaction. If
 * the budget would go negative, throws BUDGET_EXCEEDED (→ 409).
 */
export async function transitionExpenditure(input: TransitionExpenditureInput) {
  const expenditure = await prisma.expenditure.findUniqueOrThrow({
    where: { id: input.expenditureId },
    include: { budget: { select: { id: true, totalAmount: true, spentAmount: true } } },
  });
  if (!expenditure.workflowInstanceId) {
    throw new ExpenditureError('NO_WORKFLOW', 'Expenditure has no workflow instance');
  }

  const instance = await prisma.workflowInstance.findUniqueOrThrow({
    where: { id: expenditure.workflowInstanceId },
    include: { history: true },
  });

  // 1. Workflow engine validates state + role + permission + guards (sync/stateless).
  const validation = WorkflowEngine.evaluateTransition(ExpenditureWorkflow, {
    instance: instance as any,
    actor: input.actor as any,
    action: input.action,
    comment: input.comment,
    payload: { comment: input.comment },
  });
  if (!validation.success) {
    const code = validation.error.code;
    const status = code === 'UNAUTHORIZED_WORKFLOW_ACTION' ? 403
                : code === 'INVALID_STATE_TRANSITION' ? 409
                : code === 'GUARD_VIOLATION' ? 400
                : 400;
    throw new ExpenditureError(code, validation.error.message, status);
  }

  const transition = ExpenditureWorkflow.transitions[input.action];
  const toState = transition.to;

  // 2. CANCEL extra check: only the requester or Finance Manager may cancel.
  if (input.action === 'CANCEL') {
    const isRequester = expenditure.requestedById === input.actor.employeeId;
    const isFinance = input.actor.role === 'FINANCE_MANAGER' || input.actor.role === 'SUPER_ADMIN';
    if (!isRequester && !isFinance) {
      throw new ExpenditureError('FORBIDDEN', 'Only the requester or Finance can cancel', 403);
    }
  }

  // 3. DISBURSE: budget balance check (Constraint #2). Re-read inside tx for
  // serial safety — two concurrent disbursements should not both succeed.
  return prisma.$transaction(async (tx) => {
    if (input.action === 'DISBURSE') {
      const live = await tx.budget.findUniqueOrThrow({
        where: { id: expenditure.budgetId },
        select: { totalAmount: true, spentAmount: true },
      });
      const remaining = Number(live.totalAmount) - Number(live.spentAmount);
      const amount = Number(expenditure.amount);
      if (amount > remaining) {
        throw new ExpenditureError(
          'BUDGET_EXCEEDED',
          `Disbursement of ₦${amount.toLocaleString()} exceeds remaining budget of ₦${remaining.toLocaleString()}`,
          409,
        );
      }
    }

    // 3a. Append audit entry (immutable record of the transition).
    await tx.workflowAuditEntry.create({
      data: {
        instanceId: instance.id,
        actorId: input.actor.id,
        actorName: input.actor.name,
        actorRole: input.actor.role,
        fromState: instance.currentState,
        toState,
        action: input.action,
        comment: input.comment,
      },
    });

    // 3b. Update workflow instance (optimistic concurrency via version).
    await tx.workflowInstance.update({
      where: { id: instance.id },
      data: { currentState: toState, version: { increment: 1 } },
    });

    // 3c. Update Expenditure resource — status mirrors workflow state.
    const updateData: any = { status: toState };
    if (input.action === 'APPROVE_FINANCE') updateData.approvedById = input.actor.id;
    if (input.action === 'REJECT_FINANCE') updateData.rejectReason = input.comment;
    if (input.action === 'DISBURSE') {
      updateData.disbursedById = input.actor.id;
      updateData.paymentMethod = input.paymentMethod ?? 'BANK_TRANSFER';
      updateData.paymentDate = new Date();
    }
    await tx.expenditure.update({
      where: { id: expenditure.id },
      data: updateData,
    });

    // 3d. DISBURSE side-effects: increment budget + category spent.
    if (input.action === 'DISBURSE') {
      const amount = Number(expenditure.amount);
      await tx.budget.update({
        where: { id: expenditure.budgetId },
        data: { spentAmount: { increment: amount } },
      });
      if (expenditure.categoryId) {
        await tx.budgetCategory.update({
          where: { id: expenditure.categoryId },
          data: { spentAmount: { increment: amount } },
        });
      }
    }

    return tx.expenditure.findUniqueOrThrow({
      where: { id: expenditure.id },
      include: {
        budget: { select: { id: true, name: true, totalAmount: true, spentAmount: true } },
        category: { select: { id: true, name: true, code: true } },
        requestedBy: { select: { id: true, staffId: true, firstName: true, lastName: true, email: true } },
      },
    });
  });
}

export interface ListExpenditureFilter {
  requesterId?: string; // Employee.id
  states?: ExpenditureStatus[];
  budgetId?: string;
  limit?: number;
}

export async function listExpenditures(filter: ListExpenditureFilter = {}) {
  return prisma.expenditure.findMany({
    where: {
      ...(filter.requesterId ? { requestedById: filter.requesterId } : {}),
      ...(filter.states && filter.states.length ? { status: { in: filter.states } } : {}),
      ...(filter.budgetId ? { budgetId: filter.budgetId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filter.limit ?? 100,
    include: {
      budget: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, code: true } },
      requestedBy: { select: { id: true, staffId: true, firstName: true, lastName: true, email: true, jobTitle: true } },
    },
  });
}

export async function getExpenditure(id: string, opts: { includeHistory?: boolean } = {}) {
  const expenditure = await prisma.expenditure.findUniqueOrThrow({
    where: { id },
    include: {
      budget: { select: { id: true, name: true, currency: true, totalAmount: true, spentAmount: true } },
      category: { select: { id: true, name: true, code: true } },
      requestedBy: { select: { id: true, staffId: true, firstName: true, lastName: true, email: true, jobTitle: true } },
    },
  });

  if (!opts.includeHistory || !expenditure.workflowInstanceId) {
    return { ...expenditure, history: [] };
  }
  const history = await prisma.workflowAuditEntry.findMany({
    where: { instanceId: expenditure.workflowInstanceId },
    orderBy: { timestamp: 'asc' },
  });
  return { ...expenditure, history };
}
