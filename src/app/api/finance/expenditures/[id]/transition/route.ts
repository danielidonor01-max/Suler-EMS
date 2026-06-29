import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import {
  transitionExpenditure,
  ExpenditureError,
} from '@/modules/finance/domain/expenditure.service';

const TransitionSchema = z.object({
  action: z.enum(['SUBMIT', 'APPROVE_FINANCE', 'REJECT_FINANCE', 'DISBURSE', 'CANCEL']),
  comment: z.string().max(500).optional(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CHEQUE', 'CASH', 'CARD']).optional(),
});

function fmtNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/**
 * PATCH /api/finance/expenditures/[id]/transition
 *
 * Single transition entry point. The workflow engine enforces state + role +
 * permission. The service enforces:
 *   - Budget balance before DISBURSE (409 BUDGET_EXCEEDED)
 *   - CANCEL only by requester or Finance
 *   - DISBURSED is terminal (defined in workflow — has no exits)
 *
 * Notification fan-out happens AFTER the service returns successfully:
 *   - SUBMIT           → every active Finance Manager + SUPER_ADMIN
 *   - APPROVE_FINANCE  → the requester
 *   - REJECT_FINANCE   → the requester (carries the reason)
 *   - DISBURSE         → the requester (carries payment method)
 *   - CANCEL           → no notification (requester cancelled their own)
 *
 * Best-effort: a notification failure does NOT roll back the transition.
 * The state is authoritative; the notification is informational.
 */
export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = TransitionSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const result = await transitionExpenditure({
      expenditureId: id,
      action: parsed.data.action,
      comment: parsed.data.comment,
      paymentMethod: parsed.data.paymentMethod,
      actor: {
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? 'Unknown',
        role: session.user.role,
        permissions: session.user.permissions ?? [],
        employeeId: session.user.employeeId,
      },
    });

    // Notification dispatch — best-effort, never roll back the transition.
    try {
      await dispatchNotifications({
        action:      parsed.data.action,
        comment:     parsed.data.comment,
        result,
        actorName:   session.user.name ?? session.user.email ?? 'Unknown',
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[expenditure-transition] notification fan-out failed', err);
    }

    return successResponse(result, correlationId);
  } catch (err) {
    if (err instanceof ExpenditureError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('TRANSITION_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});

type TransitionAction = z.infer<typeof TransitionSchema>['action'];

async function dispatchNotifications(args: {
  action:    TransitionAction;
  comment:   string | undefined;
  result:    Awaited<ReturnType<typeof transitionExpenditure>>;
  actorName: string;
}): Promise<void> {
  const { action, comment, result, actorName } = args;
  const exp = result;
  const amount = Number(exp.amount);
  const desc   = exp.description ?? 'expenditure';
  const requesterEmployeeId = exp.requestedById;

  // Resolve requester's User row (Notification.userId is a User id; the
  // expenditure carries the Employee id).
  const requesterUser = requesterEmployeeId
    ? await prisma.user.findFirst({
        where:  { employeeId: requesterEmployeeId, isActive: true },
        select: { id: true },
      })
    : null;

  if (action === 'SUBMIT') {
    // Fan-out to every active Finance Manager + SUPER_ADMIN so the
    // approvers see the queue update without waiting for the poll.
    const approvers = await prisma.user.findMany({
      where:  { isActive: true, role: { name: { in: ['FINANCE_MANAGER', 'SUPER_ADMIN'] } } },
      select: { id: true },
    });
    if (approvers.length === 0) return;
    await prisma.notification.createMany({
      data: approvers.map(u => ({
        userId:       u.id,
        title:        'New expenditure awaiting approval',
        message:      `${actorName} submitted ${fmtNGN(amount)} — ${desc}`,
        type:         'ACTION' as const,
        category:     'WORKFLOW' as const,
        priority:     'NORMAL' as const,
        status:       'PENDING' as const,
        resourceId:   exp.id,
        resourceType: 'Expenditure',
        metadata: {
          kind:        'expenditure-submitted',
          amount,
          budgetName:  exp.budget?.name ?? null,
          requesterId: requesterEmployeeId,
        } as any,
      })),
    });
    return;
  }

  if (!requesterUser) return; // Nothing to notify if the requester has no user row

  if (action === 'APPROVE_FINANCE') {
    await prisma.notification.create({
      data: {
        userId:       requesterUser.id,
        title:        'Expenditure approved',
        message:      `${actorName} approved your request for ${fmtNGN(amount)} — ${desc}`,
        type:         'INFO' as const,
        category:     'WORKFLOW' as const,
        priority:     'NORMAL' as const,
        status:       'PENDING' as const,
        resourceId:   exp.id,
        resourceType: 'Expenditure',
        metadata: { kind: 'expenditure-approved', amount, approverName: actorName } as any,
      },
    });
    return;
  }

  if (action === 'REJECT_FINANCE') {
    await prisma.notification.create({
      data: {
        userId:       requesterUser.id,
        title:        'Expenditure rejected',
        message:      comment
                        ? `${actorName} rejected your request: ${comment}`
                        : `${actorName} rejected your request for ${fmtNGN(amount)}.`,
        type:         'WARNING' as const,
        category:     'WORKFLOW' as const,
        priority:     'HIGH' as const,
        status:       'PENDING' as const,
        resourceId:   exp.id,
        resourceType: 'Expenditure',
        metadata: { kind: 'expenditure-rejected', amount, reason: comment ?? null } as any,
      },
    });
    return;
  }

  if (action === 'DISBURSE') {
    await prisma.notification.create({
      data: {
        userId:       requesterUser.id,
        title:        'Funds disbursed',
        message:      `Your ${fmtNGN(amount)} for ${desc} has been disbursed.`,
        type:         'INFO' as const,
        category:     'WORKFLOW' as const,
        priority:     'NORMAL' as const,
        status:       'PENDING' as const,
        resourceId:   exp.id,
        resourceType: 'Expenditure',
        metadata: {
          kind:          'expenditure-disbursed',
          amount,
          paymentMethod: exp.paymentMethod ?? 'BANK_TRANSFER',
          paymentDate:   exp.paymentDate?.toISOString() ?? null,
        } as any,
      },
    });
    return;
  }
}
