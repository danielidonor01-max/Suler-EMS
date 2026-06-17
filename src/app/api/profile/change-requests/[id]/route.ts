import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/profile/change-requests/[id]
 *
 *   GET    — return a single request. Owner OR HR / SUPER_ADMIN.
 *   PATCH  — review the request. HR / SUPER_ADMIN approve or reject;
 *            the owner can CANCEL their own pending request. On APPROVE
 *            the system applies the proposedValue to the employee row
 *            atomically with marking the request reviewed, so partial-
 *            apply states are impossible.
 */

const ReviewSchema = z.object({
  action:        z.enum(['APPROVE', 'REJECT', 'CANCEL']),
  reviewComment: z.string().max(1000).optional().nullable(),
});

// Mirror of REQUESTABLE_FIELDS in the route's parent file — the approve
// path needs to validate the same set so an admin can't approve a
// request that was somehow snuck in for an out-of-scope field.
const APPLIABLE_FIELDS = new Set([
  'firstName', 'lastName', 'phone',
  'jobTitle', 'grade', 'branch',
  'nin', 'bvn', 'tin',
  'pensionPFA', 'pensionNumber', 'nhfNumber',
]);

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  try {
    const request = await prisma.profileChangeRequest.findUniqueOrThrow({
      where: { id },
      include: {
        employee: {
          select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true },
        },
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy:  { select: { id: true, name: true, email: true } },
      },
    });

    const isOwner = request.employee.id === session.user.employeeId;
    if (!isOwner && !isHR(session as any)) {
      return errorResponse('FORBIDDEN', 'Not authorized to view this request', 403, correlationId);
    }

    return successResponse(request, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Request not found';
    return errorResponse('NOT_FOUND', msg, 404, correlationId);
  }
});

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  let existing;
  try {
    existing = await prisma.profileChangeRequest.findUniqueOrThrow({
      where: { id },
      include: { employee: { select: { id: true } } },
    });
  } catch {
    return errorResponse('NOT_FOUND', 'Request not found', 404, correlationId);
  }

  if (existing.status !== 'PENDING') {
    return errorResponse(
      'ALREADY_REVIEWED',
      `Request is already ${existing.status.toLowerCase()}`,
      409,
      correlationId,
    );
  }

  // Authorization: HR / SUPER_ADMIN approve or reject; owner cancels.
  const isOwner = existing.employee.id === session.user.employeeId;
  const hr = isHR(session as any);
  if (parsed.data.action === 'CANCEL') {
    if (!isOwner) {
      return errorResponse('FORBIDDEN', 'Only the requester can cancel their own request', 403, correlationId);
    }
  } else {
    if (!hr) {
      return errorResponse('FORBIDDEN', 'Only HR / admin can approve or reject requests', 403, correlationId);
    }
  }

  const nextStatus =
    parsed.data.action === 'APPROVE' ? 'APPROVED'
    : parsed.data.action === 'REJECT' ? 'REJECTED'
    : 'CANCELLED';

  try {
    // APPROVE auto-applies the field change atomically with the status
    // update — either both succeed or both fail. APPLIABLE_FIELDS gate
    // protects against approving a stale request whose field is no
    // longer in the allowed set.
    const result = await prisma.$transaction(async (tx) => {
      if (parsed.data.action === 'APPROVE') {
        if (!APPLIABLE_FIELDS.has(existing.field)) {
          throw new Error(`Field "${existing.field}" is no longer applicable for auto-apply`);
        }
        await tx.employee.update({
          where: { id: existing.employee.id },
          data:  { [existing.field]: existing.proposedValue ?? null },
        });
        // If the change is a name field, mirror to the linked User row
        // so the header / audit attributions update too.
        if (existing.field === 'firstName' || existing.field === 'lastName') {
          const fresh = await tx.employee.findUniqueOrThrow({
            where:  { id: existing.employee.id },
            select: { firstName: true, lastName: true },
          });
          await tx.user.updateMany({
            where: { employeeId: existing.employee.id },
            data:  { name: `${fresh.firstName} ${fresh.lastName}`.trim() },
          });
        }
      }

      return tx.profileChangeRequest.update({
        where: { id },
        data: {
          status:        nextStatus,
          reviewedById:  session.user.id,
          reviewedAt:    new Date(),
          reviewComment: parsed.data.reviewComment ?? null,
        },
        include: {
          employee: {
            select: { id: true, staffId: true, firstName: true, lastName: true },
          },
          requestedBy: { select: { id: true, name: true, email: true } },
          reviewedBy:  { select: { id: true, name: true, email: true } },
        },
      });
    });

    // Best-effort: notify the requester of the outcome so they don't
    // have to come check the modal. Failure here doesn't roll back —
    // the review has already landed.
    const employeeName = `${result.employee.firstName} ${result.employee.lastName}`;
    const title =
      parsed.data.action === 'APPROVE' ? 'Profile change approved'
      : parsed.data.action === 'REJECT' ? 'Profile change rejected'
      : 'Profile change cancelled';
    const message =
      parsed.data.action === 'APPROVE'
        ? `Your request to change ${existing.field} was approved by ${result.reviewedBy?.name ?? 'HR'}.`
        : parsed.data.action === 'REJECT'
        ? `Your request to change ${existing.field} was rejected by ${result.reviewedBy?.name ?? 'HR'}.${parsed.data.reviewComment ? ` Reason: ${parsed.data.reviewComment}` : ''}`
        : 'Your profile change request was cancelled.';

    await prisma.notification.create({
      data: {
        userId:       result.requestedBy.id,
        title,
        message,
        type:         parsed.data.action === 'APPROVE' ? 'SUCCESS' : parsed.data.action === 'REJECT' ? 'WARNING' : 'INFO',
        category:     'WORKFLOW',
        priority:     'NORMAL',
        status:       'PENDING',
        resourceId:   result.id,
        resourceType: 'ProfileChangeRequest',
        metadata: {
          kind:        'profile-change-review',
          employeeId:  result.employee.id,
          employeeName,
          field:       existing.field,
          outcome:     nextStatus,
        } as any,
      },
    }).catch(() => { /* swallow — review already persisted */ });

    return successResponse(result, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Review failed';
    return errorResponse('REVIEW_FAILED', msg, 500, correlationId);
  }
});
