/**
 * PayrollAdjustmentService — simple state, not the workflow engine.
 *
 *   PENDING ──► APPLIED   (auto, inside PayrollService.processRun)
 *   PENDING ──► CANCELLED  (manual, before any run consumes it)
 *
 * Workflow engine is reserved for business-process approval routing
 * (see ARCHITECTURE.md §1). A bonus or deduction is a calculation input,
 * not a process. If you later need "bonuses > X require CFO approval",
 * introduce a separate approval workflow for THAT subset.
 */

import prisma from '@/lib/prisma';

export type AdjustmentType = 'BONUS' | 'DEDUCTION' | 'REIMBURSEMENT' | 'OVERTIME' | 'ADVANCE' | 'COMMISSION';
export type AdjustmentStatus = 'PENDING' | 'APPLIED' | 'CANCELLED';

export interface CreateAdjustmentInput {
  employeeId: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  /** YYYY-MM — which run cycle this should land on */
  effectivePeriod: string;
  createdById: string;
  metadata?: Record<string, unknown>;
}

export class AdjustmentError extends Error {
  constructor(public code: string, message: string, public httpStatus = 400) {
    super(message);
    this.name = 'AdjustmentError';
  }
}

export async function createAdjustment(input: CreateAdjustmentInput) {
  if (input.amount <= 0) {
    throw new AdjustmentError('VALIDATION_ERROR', 'amount must be positive');
  }
  if (!/^\d{4}-\d{2}$/.test(input.effectivePeriod)) {
    throw new AdjustmentError('VALIDATION_ERROR', 'effectivePeriod must be YYYY-MM');
  }
  if (input.reason.trim().length < 3) {
    throw new AdjustmentError('VALIDATION_ERROR', 'reason is required');
  }
  return prisma.payrollAdjustment.create({
    data: {
      employeeId: input.employeeId,
      type: input.type,
      amount: input.amount,
      reason: input.reason.trim(),
      effectivePeriod: input.effectivePeriod,
      createdById: input.createdById,
      status: 'PENDING',
      metadata: input.metadata as any,
    },
    include: {
      employee: { select: { id: true, staffId: true, firstName: true, lastName: true } },
    },
  });
}

export async function cancelAdjustment(id: string) {
  // Only PENDING adjustments can be cancelled. APPLIED ones are locked into
  // a processed run and must be corrected by adding a counter-adjustment in
  // a future period.
  const result = await prisma.payrollAdjustment.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
  if (result.count === 0) {
    throw new AdjustmentError('INVALID_STATE',
      'Cannot cancel: adjustment is not PENDING. APPLIED adjustments are immutable.', 409);
  }
  return prisma.payrollAdjustment.findUniqueOrThrow({ where: { id } });
}

export async function listAdjustments(opts: { employeeId?: string; period?: string; status?: AdjustmentStatus; limit?: number } = {}) {
  return prisma.payrollAdjustment.findMany({
    where: {
      ...(opts.employeeId ? { employeeId: opts.employeeId } : {}),
      ...(opts.period ? { effectivePeriod: opts.period } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: opts.limit ?? 100,
    include: {
      employee: { select: { id: true, staffId: true, firstName: true, lastName: true } },
    },
  });
}
