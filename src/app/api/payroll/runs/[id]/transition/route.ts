import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { transitionRun, PayrollError } from '@/modules/payroll/domain/payroll.service';
import { inngest } from '@/lib/inngest/client';

const TransitionSchema = z.object({
  action: z.enum(['SUBMIT_FOR_REVIEW', 'RETURN_TO_DRAFT', 'APPROVE', 'REJECT', 'PROCESS', 'CANCEL']),
  comment: z.string().max(500).optional(),
});

/** Runs at or above this size dispatch PROCESS asynchronously via Inngest. */
const ASYNC_PROCESS_THRESHOLD = 100;

/**
 * PATCH /api/payroll/runs/[id]/transition
 *
 *   Constraints enforced:
 *     - Workflow definition (PayrollRunWorkflow) — state + role + permission
 *     - Reconciliation: PayrollRun totals ≡ Σ(entries) before PROCESS (409 RECONCILIATION_FAILED)
 *     - Idempotent PROCESS — `updateMany` guard returns 409 ALREADY_PROCESSED on race
 *     - PROCESSED is terminal — workflow definition rejects further actions
 *
 *   Phase 8c: PROCESS for large runs is dispatched to Inngest. The worker
 *   calls the same transitionRun service, so all guards above still apply.
 *   The response is 202 Accepted with the queued run; clients should poll
 *   /api/payroll/runs/[id] for status changes.
 */
export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = TransitionSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const actor = {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? 'Unknown',
    role: session.user.role,
    permissions: session.user.permissions ?? [],
    employeeId: session.user.employeeId,
  };

  // For PROCESS on a large run, dispatch async. Everything else stays sync.
  if (parsed.data.action === 'PROCESS') {
    const run = await prisma.payrollRun.findUnique({
      where: { id }, select: { entryCount: true, status: true },
    });
    if (run && run.entryCount >= ASYNC_PROCESS_THRESHOLD) {
      try {
        await inngest.send({
          name: 'payroll/run.process.requested',
          data: {
            runId: id,
            actorId: actor.id,
            actorName: actor.name,
            actorRole: actor.role,
            actorPermissions: actor.permissions,
          },
        });
      } catch (err) {
        return errorResponse('QUEUE_FAILED',
          err instanceof Error ? err.message : 'Could not enqueue PROCESS', 500, correlationId);
      }
      return successResponse(
        { id, status: run.status, queued: true, message: `PROCESS dispatched for ${run.entryCount} entries; poll /api/payroll/runs/${id} for status` },
        correlationId,
        202,
      );
    }
  }

  try {
    const result = await transitionRun(id, parsed.data.action, actor, parsed.data.comment);
    return successResponse(result, correlationId);
  } catch (err) {
    if (err instanceof PayrollError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('TRANSITION_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
