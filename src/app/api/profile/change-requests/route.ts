import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/profile/change-requests
 *
 *   GET  — list requests scoped to the caller. HR / SUPER_ADMIN see
 *          every request (default pending-first); employees see only
 *          their own across all states. Query: `?status=PENDING` (etc)
 *          optional filter.
 *   POST — employee files a change request for a protected field on
 *          their own profile. Writes a ProfileChangeRequest row and
 *          emits a WORKFLOW Notification to every active HR_ADMIN +
 *          SUPER_ADMIN so the bell badge surfaces it without polling.
 */

// Whitelist of fields an employee may request to change. Compliance
// fields (NIN/BVN/TIN) are HR-edit-only via the profile PATCH, so they
// route through here just like name changes do.
const REQUESTABLE_FIELDS = new Set([
  'firstName', 'lastName', 'phone',
  'jobTitle', 'grade', 'branch',
  'nin', 'bvn', 'tin',
  'pensionPFA', 'pensionNumber', 'nhfNumber',
]);

const CreateSchema = z.object({
  field:         z.string().min(2).max(60),
  proposedValue: z.string().max(500).optional().nullable(),
  reason:        z.string().min(5, 'Please briefly explain what you want changed').max(1000),
});

const ListQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  scope:  z.enum(['mine', 'all']).optional(),
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

  const employeeId = session.user.employeeId;
  const hr = isHR(session as any);
  const scope = parsed.data.scope ?? (hr ? 'all' : 'mine');

  if (scope === 'mine' && !employeeId) {
    // Account exists but not linked to an employee — nothing to show.
    return successResponse([], correlationId);
  }
  if (scope === 'all' && !hr) {
    return errorResponse('FORBIDDEN', 'Only HR / admin can list all requests', 403, correlationId);
  }

  try {
    const requests = await prisma.profileChangeRequest.findMany({
      where: {
        ...(scope === 'mine' ? { employeeId: employeeId as string } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
      },
      // PENDING-first so the queue lands at the top of HR's inbox.
      orderBy: [
        { status:    'asc' }, // alphabetic: APPROVED, CANCELLED, PENDING, REJECTED
        { createdAt: 'desc' },
      ],
      take: 100,
      select: {
        id: true, field: true, currentValue: true, proposedValue: true,
        reason: true, status: true, reviewComment: true,
        createdAt: true, reviewedAt: true, updatedAt: true,
        employee: {
          select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true, branch: true },
        },
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy:  { select: { id: true, name: true, email: true } },
      },
    });
    return successResponse(requests, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list change requests';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  if (!session.user.employeeId) {
    return errorResponse(
      'NO_EMPLOYEE',
      'Your account is not linked to an employee record',
      400,
      correlationId,
    );
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  if (!REQUESTABLE_FIELDS.has(parsed.data.field)) {
    return errorResponse(
      'UNKNOWN_FIELD',
      `Field "${parsed.data.field}" is not requestable. Use one of: ${[...REQUESTABLE_FIELDS].join(', ')}`,
      400,
      correlationId,
    );
  }

  try {
    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id: session.user.employeeId },
    });

    // Block stacking: refuse a new request for the same field while an
    // existing one is PENDING. Keeps the HR queue tidy and surfaces a
    // clear error in the UI rather than silently piling up dupes.
    const existing = await prisma.profileChangeRequest.findFirst({
      where: {
        employeeId: employee.id,
        field:      parsed.data.field,
        status:     'PENDING',
      },
      select: { id: true },
    });
    if (existing) {
      return errorResponse(
        'DUPLICATE_PENDING',
        `You already have a pending request to change ${parsed.data.field}. Cancel it or wait for HR review.`,
        409,
        correlationId,
      );
    }

    const currentValue = (employee as any)[parsed.data.field] ?? null;

    const created = await prisma.profileChangeRequest.create({
      data: {
        employeeId:    employee.id,
        requestedById: session.user.id,
        field:         parsed.data.field,
        currentValue:  currentValue == null ? null : String(currentValue),
        proposedValue: parsed.data.proposedValue ?? null,
        reason:        parsed.data.reason,
        status:        'PENDING',
      },
      select: {
        id: true, field: true, currentValue: true, proposedValue: true,
        reason: true, status: true, createdAt: true,
      },
    });

    // Notify every active HR_ADMIN + SUPER_ADMIN so the bell badge
    // surfaces it without polling. The notification persists alongside
    // the request — if HR ignores it, the queue at /admin/profile-
    // requests still shows the row.
    const recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: { in: ['HR_ADMIN', 'SUPER_ADMIN'] } },
      },
      select: { id: true },
    });
    if (recipients.length > 0) {
      const employeeName = `${employee.firstName} ${employee.lastName}`;
      const fromName = session.user.name ?? session.user.email ?? employeeName;
      await prisma.notification.createMany({
        data: recipients.map(u => ({
          userId:       u.id,
          title:        `Profile change request — ${employeeName}`,
          message:      `${fromName} (${employee.staffId}) is requesting a change to their ${parsed.data.field}. Reason: ${parsed.data.reason}`,
          type:         'ACTION',
          category:     'WORKFLOW',
          priority:     'NORMAL',
          status:       'PENDING',
          resourceId:   created.id,
          resourceType: 'ProfileChangeRequest',
          metadata: {
            kind:           'profile-change-request',
            employeeId:     employee.id,
            employeeName,
            requestedBy:    session.user.id,
            requestedByName: fromName,
            field:          parsed.data.field,
            proposedValue:  parsed.data.proposedValue ?? null,
            reason:         parsed.data.reason,
          } as any,
        })),
      });
    }

    return successResponse(
      {
        ...created,
        ok: true,
        recipientCount: recipients.length,
        message: 'Your request has been sent to HR for review.',
      },
      correlationId,
      201,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to submit change request';
    return errorResponse('REQUEST_FAILED', msg, 500, correlationId);
  }
});
