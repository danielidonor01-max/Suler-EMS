import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { classifyClockIn, lagosToday } from '@/lib/attendance/time';

/**
 * POST /api/attendance/clock-in
 *
 * Records the calling user's clock-in for the current Lagos calendar day.
 * Idempotent failure path: if the user has already clocked in today,
 * returns 409 with the existing record so the UI can display the time
 * without rewriting it.
 *
 * Status is PRESENT before 09:00 Lagos, LATE after — see
 * lib/attendance/time.ts. The threshold is hardcoded for now; promote
 * to a SystemSetting when HR wants to tweak it.
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
  const now = new Date();
  const status = classifyClockIn(now);

  try {
    // Try to insert; if the (employeeId, date) row already exists, the
    // unique constraint catches it and we surface the existing record.
    const created = await prisma.attendanceRecord.create({
      data: { employeeId, date, checkIn: now, status },
    });
    return successResponse(created, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to clock in';
    if (msg.includes('Unique constraint')) {
      const existing = await prisma.attendanceRecord.findUnique({
        where: { employeeId_date: { employeeId, date } },
      });
      return errorResponse(
        'ALREADY_CLOCKED_IN',
        `You already clocked in today at ${existing?.checkIn?.toISOString() ?? '—'}`,
        409,
        correlationId,
      );
    }
    return errorResponse('CLOCK_IN_FAILED', msg, 500, correlationId);
  }
});
