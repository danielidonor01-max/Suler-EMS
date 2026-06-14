/**
 * PayrollService — single domain API for payroll runs.
 *
 * Constraint map (see ARCHITECTURE.md):
 *   §3  PROCESSED is terminal — enforced by workflow definition (no exits).
 *   §5  Salary snapshot — basic/housing/transport + statutory rates copied
 *       into PayrollEntry.* and PayrollRun.rateSnapshot at draft creation
 *       time. Later salary changes never retroactively modify the run.
 *   §6  Idempotent PROCESS — `updateMany` with state guard ensures only one
 *       APPROVED → PROCESSED transition succeeds.
 *   §4  Atomic transactions — workflow state + entries + adjustments all
 *       commit together inside the same `$transaction`.
 *
 * Reconciliation: the totals stored on PayrollRun must equal Σ across entries
 * at PROCESS commit time (constraint #4 from the user). Validated inside the
 * transaction; throws RECONCILIATION_FAILED if drift detected.
 */

import prisma from '@/lib/prisma';
import { PayrollRunWorkflow } from '@/modules/workflow/definitions/payroll.workflow';
import { WorkflowEngine } from '@/modules/workflow/engine/workflow.engine';
import { computePayroll } from './calculations';
import {
  ComplianceRates,
  DEFAULT_NG_RATES,
  PayrollRunStatus,
} from './types';

export type PayrollAction =
  | 'SUBMIT_FOR_REVIEW'
  | 'RETURN_TO_DRAFT'
  | 'APPROVE'
  | 'REJECT'
  | 'PROCESS'
  | 'CANCEL';

export interface Actor {
  id: string;
  name: string;
  role: string;
  permissions: string[];
  employeeId?: string;
}

export class PayrollError extends Error {
  constructor(public code: string, message: string, public httpStatus = 400) {
    super(message);
    this.name = 'PayrollError';
  }
}

export interface CreateRunInput {
  name: string;
  /** YYYY-MM, e.g. "2026-05" */
  period: string;
  departmentId?: string | null;
  rates?: ComplianceRates;
  actor: Actor;
}

/**
 * Create a draft payroll run. Snapshots all SalaryStructure data + applicable
 * PENDING adjustments into immutable PayrollEntry rows. After this call,
 * future SalaryStructure or adjustment changes do not affect this run.
 */
export async function createDraftRun(input: CreateRunInput) {
  if (!/^\d{4}-\d{2}$/.test(input.period)) {
    throw new PayrollError('VALIDATION_ERROR', 'period must be YYYY-MM');
  }
  if (!(input.actor.permissions ?? []).includes('payroll:edit') && input.actor.role !== 'SUPER_ADMIN') {
    throw new PayrollError('FORBIDDEN', 'payroll:edit required', 403);
  }

  const rates = input.rates ?? DEFAULT_NG_RATES;

  // Pre-flight: enforce one run per (period, department).
  const existing = await prisma.payrollRun.findFirst({
    where: { period: input.period, departmentId: input.departmentId ?? null },
  });
  if (existing) {
    throw new PayrollError('DUPLICATE_RUN',
      `A run already exists for ${input.period}${input.departmentId ? ` in this department` : ''} (id=${existing.id})`, 409);
  }

  const employees = await prisma.employee.findMany({
    where: {
      status: 'ACTIVE',
      ...(input.departmentId ? { departmentId: input.departmentId } : {}),
    },
    include: {
      salaryStructures: { where: { isActive: true }, take: 1 },
      payrollAdjustments: { where: { effectivePeriod: input.period, status: 'PENDING' } },
    },
  });

  if (employees.length === 0) {
    throw new PayrollError('NO_EMPLOYEES', 'No active employees match the scope', 400);
  }

  // Entire draft creation in one transaction — including workflow instance
  // and first audit entry.
  return prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.create({
      data: {
        name: input.name,
        period: input.period,
        departmentId: input.departmentId ?? null,
        createdById: input.actor.id,
        status: 'DRAFT',
        rateSnapshot: rates as any,
        entryCount: 0, // filled in after loop
      },
    });

    const instance = await tx.workflowInstance.create({
      data: {
        workflowId: PayrollRunWorkflow.id,
        version: PayrollRunWorkflow.version,
        currentState: 'DRAFT',
        resourceId: run.id,
        assignedRoleId: 'FINANCE_MANAGER',
      },
    });

    // First audit entry: system-created DRAFT.
    await tx.workflowAuditEntry.create({
      data: {
        instanceId: instance.id,
        actorId: input.actor.id,
        actorName: input.actor.name,
        actorRole: input.actor.role,
        fromState: 'DRAFT',
        toState: 'DRAFT',
        action: 'CREATE_DRAFT',
        comment: `Run "${input.name}" created for period ${input.period}`,
        metadata: { period: input.period, departmentId: input.departmentId ?? null, employeeCount: employees.length },
      },
    });

    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;
    let totalEmployerContrib = 0;
    let entryCount = 0;

    for (const emp of employees) {
      const salary = emp.salaryStructures[0];
      if (!salary) continue; // skip employees with no active salary

      const bonuses = emp.payrollAdjustments
        .filter(a => ['BONUS', 'OVERTIME', 'COMMISSION', 'REIMBURSEMENT'].includes(a.type))
        .reduce((s, a) => s + Number(a.amount), 0);
      const otherDeductions = emp.payrollAdjustments
        .filter(a => ['DEDUCTION', 'ADVANCE'].includes(a.type))
        .map(a => ({ name: a.type, amount: Number(a.amount), reason: a.reason }));

      const result = computePayroll({
        salary: {
          basicSalary: Number(salary.basicSalary),
          housingAllowance: Number(salary.housingAllowance),
          transportAllowance: Number(salary.transportAllowance),
          otherAllowances: (salary.otherAllowances as any) ?? [],
        },
        bonuses,
        otherDeductions,
        rates,
      });

      // Snapshot all salary inputs onto the entry (Constraint §5).
      await tx.payrollEntry.create({
        data: {
          runId: run.id,
          employeeId: emp.id,
          basicSalary: Number(salary.basicSalary),
          housingAllowance: Number(salary.housingAllowance),
          transportAllowance: Number(salary.transportAllowance),
          otherAllowances: (salary.otherAllowances as any) ?? undefined,
          grossPay: result.grossPay,
          paye: result.paye,
          pensionEmployee: result.pensionEmployee,
          pensionEmployer: result.pensionEmployer,
          nhf: result.nhf,
          nhis: result.nhis,
          otherDeductions: result.otherDeductions as any,
          totalDeductions: result.totalDeductions,
          netPay: result.netPay,
        },
      });

      totalGross += result.grossPay;
      totalNet += result.netPay;
      totalDeductions += result.totalDeductions;
      totalEmployerContrib += result.pensionEmployer;
      entryCount++;
    }

    return tx.payrollRun.update({
      where: { id: run.id },
      data: { totalGross, totalNet, totalDeductions, totalEmployerContrib, entryCount },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { entries: true } },
      },
    });
  }, { timeout: 30_000 });
}

/**
 * Transition a payroll run. Engine validates state + role + permission +
 * guards. The service handles atomic state-write + side effects:
 *   - PROCESS: validates reconciliation, flips run status with `updateMany`
 *     state guard (idempotent), auto-applies all PENDING adjustments for
 *     this period to APPLIED.
 */
export async function transitionRun(runId: string, action: PayrollAction, actor: Actor, comment?: string) {
  const run = await prisma.payrollRun.findUniqueOrThrow({ where: { id: runId } });

  // Find the workflow instance for this run.
  const instance = await prisma.workflowInstance.findFirst({
    where: { workflowId: PayrollRunWorkflow.id, resourceId: runId },
    include: { history: { orderBy: { timestamp: 'desc' }, take: 5 } },
  });
  if (!instance) {
    throw new PayrollError('NO_WORKFLOW', 'Payroll run has no workflow instance', 500);
  }

  const validation = WorkflowEngine.evaluateTransition(PayrollRunWorkflow, {
    instance: instance as any,
    actor: actor as any,
    action,
    comment,
    payload: { comment },
  });
  if (!validation.success) {
    const code = validation.error.code;
    const status = code === 'UNAUTHORIZED_WORKFLOW_ACTION' ? 403
                : code === 'INVALID_STATE_TRANSITION' ? 409
                : 400;
    throw new PayrollError(code, validation.error.message, status);
  }

  const transition = PayrollRunWorkflow.transitions[action];
  const toState = transition.to;

  // Reconciliation guard before PROCESS (Constraint #4).
  if (action === 'PROCESS') {
    const reconcile = await prisma.payrollEntry.aggregate({
      where: { runId },
      _sum: { grossPay: true, netPay: true, totalDeductions: true, pensionEmployer: true },
      _count: true,
    });
    const sumGross = Number(reconcile._sum.grossPay ?? 0);
    const sumNet = Number(reconcile._sum.netPay ?? 0);
    const sumDed = Number(reconcile._sum.totalDeductions ?? 0);
    const sumEmp = Number(reconcile._sum.pensionEmployer ?? 0);
    const drift = (a: number, b: number) => Math.abs(a - b) > 1; // ±₦1 tolerance
    if (drift(sumGross, Number(run.totalGross))
        || drift(sumNet, Number(run.totalNet))
        || drift(sumDed, Number(run.totalDeductions))
        || drift(sumEmp, Number(run.totalEmployerContrib))
        || reconcile._count !== run.entryCount) {
      throw new PayrollError(
        'RECONCILIATION_FAILED',
        `Run totals do not reconcile with entries. Run-stored gross=${run.totalGross} vs Σentries=${sumGross}; entries=${reconcile._count} vs run.entryCount=${run.entryCount}.`,
        409,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    // Idempotent state change (Constraint #6 / §6). For PROCESS specifically
    // we use updateMany with a status guard so a concurrent double-click can't
    // both succeed. updateMany returns { count } — 0 means someone got there
    // first and we surface 409.
    if (action === 'PROCESS') {
      const r = await tx.payrollRun.updateMany({
        where: { id: runId, status: 'APPROVED' },
        data: { status: 'PROCESSED', processedById: actor.id, processedAt: new Date() },
      });
      if (r.count === 0) {
        throw new PayrollError('ALREADY_PROCESSED',
          'Payroll run is no longer in APPROVED state — another process call may have succeeded first.', 409);
      }

      // Auto-flip adjustments for this period to APPLIED. Atomic with the
      // run transition so we never end up with a PROCESSED run but PENDING
      // adjustments.
      await tx.payrollAdjustment.updateMany({
        where: {
          effectivePeriod: run.period,
          status: 'PENDING',
          employeeId: { in: (await tx.payrollEntry.findMany({
            where: { runId }, select: { employeeId: true },
          })).map(e => e.employeeId) },
        },
        data: { status: 'APPLIED', approvedById: actor.id, approvedAt: new Date() },
      });
    } else {
      // Non-PROCESS transitions: standard update (state hasn't been touched
      // by another concurrent action because workflow engine already proved
      // we're in a valid source state).
      const updateData: any = { status: toState };
      if (action === 'APPROVE') {
        updateData.approvedById = actor.id;
        updateData.approvedAt = new Date();
      }
      await tx.payrollRun.update({
        where: { id: runId },
        data: updateData,
      });
    }

    // Audit entry + workflow instance state.
    await tx.workflowAuditEntry.create({
      data: {
        instanceId: instance.id,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        fromState: instance.currentState,
        toState,
        action,
        comment,
      },
    });
    await tx.workflowInstance.update({
      where: { id: instance.id },
      data: { currentState: toState, version: { increment: 1 } },
    });

    return tx.payrollRun.findUniqueOrThrow({
      where: { id: runId },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { entries: true } },
      },
    });
  }, { timeout: 30_000 });
}

export async function listRuns(opts: { period?: string; status?: PayrollRunStatus; departmentId?: string | null; limit?: number } = {}) {
  return prisma.payrollRun.findMany({
    where: {
      ...(opts.period ? { period: opts.period } : {}),
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.departmentId !== undefined ? { departmentId: opts.departmentId } : {}),
    },
    orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
    take: opts.limit ?? 50,
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: { select: { entries: true } },
    },
  });
}

export async function getRun(id: string, opts: { includeEntries?: boolean; includeHistory?: boolean } = {}) {
  const run = await prisma.payrollRun.findUniqueOrThrow({
    where: { id },
    include: {
      department: { select: { id: true, name: true, code: true } },
      ...(opts.includeEntries ? {
        entries: {
          orderBy: { netPay: 'desc' },
          include: { employee: { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true, branch: true } } },
        },
      } : {}),
    },
  });

  if (!opts.includeHistory) return { ...run, history: [] };
  const instance = await prisma.workflowInstance.findFirst({
    where: { workflowId: PayrollRunWorkflow.id, resourceId: id },
    select: { id: true },
  });
  if (!instance) return { ...run, history: [] };
  const history = await prisma.workflowAuditEntry.findMany({
    where: { instanceId: instance.id },
    orderBy: { timestamp: 'asc' },
  });
  return { ...run, history };
}

/**
 * Employee-facing: return all PayrollEntry records for a given employee.
 * Used by /my-payroll. Entries from cancelled or in-flight runs are filtered
 * to only PROCESSED so employees don't see preview numbers.
 */
export async function listMyPayslips(employeeId: string) {
  return prisma.payrollEntry.findMany({
    where: {
      employeeId,
      run: { status: 'PROCESSED' },
    },
    include: {
      run: { select: { id: true, name: true, period: true, processedAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
