import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/attendance/me?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns the calling user's attendance records in the window. Used by
 * the personal /attendance page to render the month calendar + stats.
 *
 * The endpoint is read-only on the session user — managers should hit
 * /api/attendance/admin to see team members (separate route, not
 * implemented yet).
 */

const QuerySchema = z.object({
  from: z.coerce.date(),
  to:   z.coerce.date(),
}).refine(d => d.to >= d.from, {
  message: '`to` must be on or after `from`',
  path: ['to'],
}).refine(d => (d.to.getTime() - d.from.getTime()) / 86_400_000 <= 366, {
  message: 'window cannot exceed one year',
  path: ['to'],
});

export const GET = withAuth(async (req, session) => {
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

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: parsed.data.from, lte: parsed.data.to },
      },
      orderBy: { date: 'asc' },
    });
    return successResponse(records, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load attendance';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});
