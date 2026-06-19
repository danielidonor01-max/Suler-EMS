import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * PATCH /api/attendance/admin/[id]
 *
 * HR correction surface. Lets HR fix a misclock — wrong time, forgot to
 * clock out, or a note that should be edited after a manager review.
 *
 * Restricted to HR_ADMIN / SUPER_ADMIN (not just attendance:view, since
 * this mutates the record). All edits are surfaced in the audit trail
 * via the standard ActivityLog hook the prisma client middleware
 * applies — no extra wiring needed here.
 */

const PatchSchema = z.object({
  checkIn:     z.coerce.date().nullable().optional(),
  checkOut:    z.coerce.date().nullable().optional(),
  status:      z.enum(['PRESENT', 'LATE', 'ABSENT']).optional(),
  checkInNote:  z.string().max(280).nullable().optional(),
  checkOutNote: z.string().max(280).nullable().optional(),
});

function canEdit(session: { user: { role: string } }): boolean {
  return session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN';
}

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!canEdit(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / SUPER_ADMIN required', 403, correlationId);
  }
  const { id } = (await context.params) as { id: string };

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  // checkOut must be ≥ checkIn when both will be present after the patch.
  // We fetch the row first so we can validate against the merged state.
  try {
    const existing = await prisma.attendanceRecord.findUniqueOrThrow({ where: { id } });
    const nextIn  = 'checkIn'  in parsed.data ? parsed.data.checkIn  : existing.checkIn;
    const nextOut = 'checkOut' in parsed.data ? parsed.data.checkOut : existing.checkOut;
    if (nextIn && nextOut && nextOut < nextIn) {
      return errorResponse(
        'INVALID_TIMES',
        'checkOut cannot be before checkIn',
        400,
        correlationId,
      );
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id },
      data:  parsed.data,
      include: {
        checkInSite:  { select: { id: true, name: true } },
        checkOutSite: { select: { id: true, name: true } },
      },
    });

    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update';
    if (msg.includes('No record was found') || msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Attendance record not found', 404, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});
