import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { transitionLeave } from '@/modules/leave/domain/leave.service';

const TransitionSchema = z.object({
  action: z.enum(['APPROVE_MANAGER', 'REJECT_MANAGER', 'APPROVE_HR', 'REJECT_HR', 'CANCEL', 'REVOKE']),
  comment: z.string().max(500).optional(),
});

/**
 * PATCH /api/leave/requests/[id]/transition
 * Body: { action, comment? }
 *
 * Authorization is enforced inside the workflow engine (requiredRole +
 * requiredPermission on each transition). The route just hands the actor over.
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
    const result = await transitionLeave({
      leaveRequestId: id,
      action: parsed.data.action,
      comment: parsed.data.comment,
      actor: {
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? 'Unknown',
        role: session.user.role,
        permissions: session.user.permissions ?? [],
      },
    });
    return successResponse(result, correlationId);
  } catch (err) {
    const code = (err as any)?.code ?? 'TRANSITION_FAILED';
    const status = code === 'UNAUTHORIZED_WORKFLOW_ACTION' ? 403
                : code === 'INVALID_STATE_TRANSITION' ? 409
                : code === 'GUARD_VIOLATION' ? 400
                : 400;
    const msg = err instanceof Error ? err.message : 'Transition failed';
    return errorResponse(code, msg, status, correlationId);
  }
});
