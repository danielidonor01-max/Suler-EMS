import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { listLeaveRequests, submitLeave, LeaveType, LeaveStatus } from '@/modules/leave/domain/leave.service';

const SubmitLeaveSchema = z.object({
  type: z.enum(['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'COMPASSIONATE']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(3, 'reason must be at least 3 characters').max(500),
}).refine(d => d.endDate >= d.startDate, {
  message: 'endDate must be on or after startDate',
  path: ['endDate'],
}).refine(d => {
  // Reject leave > 365 days — guards against UI bug or hostile input.
  const days = Math.round((d.endDate.getTime() - d.startDate.getTime()) / 86_400_000) + 1;
  return days <= 365;
}, {
  message: 'leave duration cannot exceed 365 days',
  path: ['endDate'],
});

const ListQuerySchema = z.object({
  /** "mine" → only the calling user's requests. "team" → managers see their queue. "all" → SUPER_ADMIN/HR. */
  scope: z.enum(['mine', 'team', 'all']).optional().default('mine'),
  status: z.string().optional(), // comma-separated list of states
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

/**
 * GET /api/leave/requests?scope=mine|team|all&status=SUBMITTED,APPROVED&limit=50
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const { scope, status, limit } = parsed.data;
  const states = status ? (status.split(',') as LeaveStatus[]) : undefined;

  let employeeId: string | undefined;
  if (scope === 'mine') {
    employeeId = session.user.employeeId;
    if (!employeeId) {
      return errorResponse('NO_EMPLOYEE', 'Calling user is not linked to an employee record', 400, correlationId);
    }
  } else if (scope === 'team') {
    // Managers + HR + SUPER_ADMIN can view the team queue.
    if (!['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return errorResponse('FORBIDDEN', 'Team scope requires manager/HR role', 403, correlationId);
    }
  } else {
    if (!['HR_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return errorResponse('FORBIDDEN', 'Full scope requires HR/admin role', 403, correlationId);
    }
  }

  const requests = await listLeaveRequests({ employeeId, states, limit });
  return successResponse(requests, correlationId);
});

/**
 * POST /api/leave/requests
 * Body: { type, startDate, endDate, reason }
 * Always submits on behalf of the calling user — actor is bound to session.
 */
export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const body = await req.json();
  const parsed = SubmitLeaveSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return errorResponse('NO_EMPLOYEE', 'Calling user is not linked to an employee record', 400, correlationId);
  }

  try {
    const request = await submitLeave({
      employeeId,
      type: parsed.data.type as LeaveType,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      reason: parsed.data.reason,
      actor: {
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? 'Unknown',
        role: session.user.role,
        permissions: session.user.permissions ?? [],
      },
    });
    return successResponse(request, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to submit leave';
    return errorResponse('SUBMIT_FAILED', msg, 400, correlationId);
  }
});
