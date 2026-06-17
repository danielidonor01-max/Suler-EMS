import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/leave/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns every leave request whose date range OVERLAPS the [from, to]
 * window AND is in an actionable state (HR_APPROVED or MANAGER_APPROVED).
 * Drives the team availability calendar — the UI renders one row per
 * overlapping day, with the leave type colour resolved client-side.
 *
 * Any authenticated user can read. Team availability is org-wide info.
 *
 * Overlap rule (inclusive both ends):
 *   request.startDate <= to  AND  request.endDate >= from
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

// MANAGER_APPROVED is "scheduled, awaiting HR confirmation" — including it
// gives ops a useful preview of likely-coming absences. HR_APPROVED is the
// confirmed leg. SUBMITTED is omitted so unreviewed requests don't pollute
// the team-availability view.
const VISIBLE_STATES = ['HR_APPROVED', 'MANAGER_APPROVED'] as const;

export const GET = withAuth(async (req, _session) => {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  const { from, to } = parsed.data;

  try {
    const rows = await prisma.leaveRequest.findMany({
      where: {
        status:    { in: [...VISIBLE_STATES] },
        startDate: { lte: to },
        endDate:   { gte: from },
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, branch: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    const data = rows.map(r => ({
      id:           r.id,
      type:         r.type,
      startDate:    r.startDate,
      endDate:      r.endDate,
      status:       r.status,
      isConfirmed:  r.status === 'HR_APPROVED',
      employeeId:   r.employee.id,
      employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
      jobTitle:     r.employee.jobTitle,
      branch:       r.employee.branch,
    }));

    return successResponse(data, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load calendar';
    return errorResponse('CALENDAR_FAILED', msg, 500, correlationId);
  }
});
