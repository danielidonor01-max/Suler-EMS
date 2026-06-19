import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/attendance/admin
 *
 * HR / managers see all attendance records in a date window with the
 * geo-fence joins resolved (site name + override note inline). Used by
 * the /attendance/admin page; ATTENDANCE_VIEW (or SUPER_ADMIN) gated.
 *
 * Filters:
 *   from, to       (required, ISO date)
 *   status         PRESENT | LATE | ABSENT
 *   employeeId     pin to one employee
 *   siteId         only punches matched to this site
 *   offSiteOnly    true → only rows with a checkInNote OR checkOutNote
 *                  (i.e. flagged out-of-bounds punches HR may want to review)
 */

const QuerySchema = z.object({
  from: z.coerce.date(),
  to:   z.coerce.date(),
  status:     z.enum(['PRESENT', 'LATE', 'ABSENT']).optional(),
  employeeId: z.string().uuid().optional(),
  siteId:     z.string().uuid().optional(),
  offSiteOnly: z.coerce.boolean().optional(),
}).refine(d => d.to >= d.from, {
  message: '`to` must be on or after `from`', path: ['to'],
}).refine(d => (d.to.getTime() - d.from.getTime()) / 86_400_000 <= 92, {
  message: 'window cannot exceed 92 days', path: ['to'],
});

function canViewAdmin(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  return (session.user.permissions ?? []).includes('attendance:view');
}

export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!canViewAdmin(session as any)) {
    return errorResponse('FORBIDDEN', 'attendance:view required', 403, correlationId);
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const where: any = {
    date: { gte: parsed.data.from, lte: parsed.data.to },
  };
  if (parsed.data.status)     where.status     = parsed.data.status;
  if (parsed.data.employeeId) where.employeeId = parsed.data.employeeId;
  if (parsed.data.siteId) {
    // A row "belongs to" a site if EITHER side of the punch matched it.
    where.OR = [{ checkInSiteId: parsed.data.siteId }, { checkOutSiteId: parsed.data.siteId }];
  }
  if (parsed.data.offSiteOnly) {
    where.OR = [
      ...(where.OR ?? []),
      { checkInNote:  { not: null } },
      { checkOutNote: { not: null } },
    ];
  }

  try {
    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
      take: 1000,
      include: {
        checkInSite:  { select: { id: true, name: true } },
        checkOutSite: { select: { id: true, name: true } },
      },
    });

    // Stitch employee names — cheaper as a single lookup than a per-row
    // join given the typical 30-day window across a small headcount.
    const employeeIds = Array.from(new Set(records.map(r => r.employeeId)));
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true, staffId: true, firstName: true, lastName: true,
        jobTitle: true,
        department: { select: { id: true, name: true } },
      },
    });
    const byEmpId = new Map(employees.map(e => [e.id, e]));

    return successResponse(
      records.map(r => ({ ...r, employee: byEmpId.get(r.employeeId) ?? null })),
      correlationId,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list attendance';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});
