import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/performance/feedback
 *
 *   GET  — list peer-feedback requests.
 *            scope=pending  — assigned to me, awaiting my response.
 *            scope=given    — I submitted these.
 *            scope=received — I'm the subject; these are about me.
 *            scope=all      — HR-only: every row.
 *   POST — create one or more requests. Subject can self-request from
 *          peers; HR can fan out on someone's behalf via subjectId.
 *
 * Subject is an Employee (the person being given feedback about);
 * reviewer is a User (the peer asked to give it). The two are
 * intentionally different model types — not every reviewer is in
 * the employee registry.
 */

const StatusEnum = z.enum(['PENDING', 'SUBMITTED', 'DECLINED']);
const ScopeEnum  = z.enum(['pending', 'given', 'received', 'all']);

const ListQuerySchema = z.object({
  scope:     ScopeEnum.optional(),
  status:    StatusEnum.optional(),
  subjectId: z.string().uuid().optional(),
  cycleId:   z.string().uuid().optional(),
});

const CreateSchema = z.object({
  subjectId:   z.string().uuid().optional(),  // HR may target someone else
  reviewerIds: z.array(z.string().uuid()).min(1).max(20),
  prompt:      z.string().max(500).optional().nullable(),
  cycleId:     z.string().uuid().optional().nullable(),
});

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const hr = isHR(session as any);
  const employeeId = session.user.employeeId;
  const scope = parsed.data.scope ?? 'pending';

  if (scope === 'all' && !hr) {
    return errorResponse('FORBIDDEN', 'Only HR can list all peer feedback', 403, correlationId);
  }

  const where: any = {};
  if (parsed.data.status) where.status = parsed.data.status;
  if (parsed.data.cycleId) where.cycleId = parsed.data.cycleId;

  if (scope === 'pending') {
    where.reviewerId = session.user.id;
    where.status     = where.status ?? 'PENDING';
  } else if (scope === 'given') {
    where.reviewerId = session.user.id;
  } else if (scope === 'received') {
    if (!employeeId) return successResponse([], correlationId);
    where.subjectId = employeeId;
  } else if (scope === 'all' && parsed.data.subjectId) {
    where.subjectId = parsed.data.subjectId;
  }

  try {
    const rows = await prisma.peerFeedbackRequest.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        subject:     { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true } },
        reviewer:    { select: { id: true, name: true, email: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        cycle:       { select: { id: true, name: true, status: true } },
      },
    });

    // Subject can see the response on their own received feedback;
    // peers can see their own draft/submission. Anyone else outside
    // HR shouldn't see the body — but since `scope` already filters
    // to (reviewer=me) or (subject=me), the where clause already
    // restricts visibility. HR sees everything.
    return successResponse(rows, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list peer feedback';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const hr = isHR(session as any);
  const subjectId = parsed.data.subjectId ?? session.user.employeeId;
  if (!subjectId) {
    return errorResponse('NO_EMPLOYEE', 'No employee record linked to your account', 400, correlationId);
  }
  if (subjectId !== session.user.employeeId && !hr) {
    return errorResponse('FORBIDDEN', 'Only HR can request feedback on someone else\'s behalf', 403, correlationId);
  }

  // De-dup reviewerIds + reject the subject's own User id (you can't
  // be your own peer reviewer). We need the subject's userId for that;
  // pull it via the employee link.
  const subject = await prisma.employee.findUnique({
    where: { id: subjectId }, select: { id: true, user: { select: { id: true } } },
  });
  if (!subject) {
    return errorResponse('NOT_FOUND', 'Subject employee not found', 404, correlationId);
  }
  const subjectUserId = subject.user?.id ?? null;
  const reviewerIds = Array.from(new Set(parsed.data.reviewerIds))
    .filter(id => id !== subjectUserId);
  if (reviewerIds.length === 0) {
    return errorResponse('VALIDATION_ERROR', 'No valid reviewers (you can\'t request feedback from yourself)', 400, correlationId);
  }

  try {
    // createMany + skipDuplicates so re-asking the same peer in the
    // same cycle is a no-op — same idempotency story as the bulk
    // review-assign endpoint.
    const result = await prisma.peerFeedbackRequest.createMany({
      data: reviewerIds.map(rid => ({
        subjectId,
        reviewerId:    rid,
        requestedById: session.user.id,
        cycleId:       parsed.data.cycleId ?? null,
        prompt:        parsed.data.prompt ?? null,
        status:        'PENDING',
      })),
      skipDuplicates: true,
    });

    return successResponse({
      createdCount:  result.count,
      requestedCount: reviewerIds.length,
    }, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create feedback requests';
    return errorResponse('CREATE_FAILED', msg, 500, correlationId);
  }
});
