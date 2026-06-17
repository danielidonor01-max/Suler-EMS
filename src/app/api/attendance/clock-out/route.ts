import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { lagosToday } from '@/lib/attendance/time';

/**
 * POST /api/attendance/clock-out
 *
 * Records the calling user's clock-out for today's attendance row.
 * Rejects if there's no clock-in yet (NO_RECORD) or if checkOut is
 * already set (ALREADY_CLOCKED_OUT).
 *
 * No status change on clock-out — PRESENT/LATE classification is
 * fixed by the morning arrival time.
 */
export const POST = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();

  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return errorResponse(
      'NO_EMPLOYEE',
      'Your account is not linked to an employee record',
      400,
      correlationId,
    );
  }

  const date = lagosToday();

  try {
    const existing = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (!existing || !existing.checkIn) {
      return errorResponse(
        'NO_RECORD',
        'You have not clocked in today',
        409,
        correlationId,
      );
    }
    if (existing.checkOut) {
      return errorResponse(
        'ALREADY_CLOCKED_OUT',
        `You already clocked out at ${existing.checkOut.toISOString()}`,
        409,
        correlationId,
      );
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data:  { checkOut: new Date() },
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to clock out';
    return errorResponse('CLOCK_OUT_FAILED', msg, 500, correlationId);
  }
});
