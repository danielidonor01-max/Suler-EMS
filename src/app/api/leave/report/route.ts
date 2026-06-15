import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { errorResponse } from '@/lib/api-utils';
import { toCsv, csvResponse } from '@/lib/exports/csv';

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.string().optional(), // CSV of states
  departmentId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50_000).optional(),
});

/**
 * GET /api/leave/report?from=&to=&status=&departmentId=&limit=
 *
 * Streams a CSV of leave requests for HR/Managers. Requires `leave:view`.
 * Default window: last 12 months. Cap: 10k rows.
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('leave:view') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'leave:view required', 403, correlationId);
  }
  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const { from, to, status, departmentId, limit } = parsed.data;
  const fromDate = from ? new Date(from + 'T00:00:00.000Z')
                       : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to + 'T23:59:59.999Z') : new Date();
  const statuses = status ? status.split(',').map(s => s.trim()).filter(Boolean) : undefined;

  const rows = await prisma.leaveRequest.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      ...(statuses && statuses.length ? { status: { in: statuses } } : {}),
      ...(departmentId ? { employee: { departmentId } } : {}),
    },
    include: {
      employee: {
        select: {
          staffId: true, firstName: true, lastName: true, email: true,
          jobTitle: true, branch: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit ?? 10_000,
  });

  function durationDays(start: Date, end: Date): number {
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  }

  const csv = toCsv(rows, [
    { key: 'createdAt',   header: 'Submitted (UTC)', get: r => r.createdAt.toISOString() },
    { key: 'staffId',     header: 'Staff ID',        get: r => r.employee.staffId },
    { key: 'firstName',   header: 'First Name',      get: r => r.employee.firstName },
    { key: 'lastName',    header: 'Last Name',       get: r => r.employee.lastName },
    { key: 'email',       header: 'Email',           get: r => r.employee.email },
    { key: 'jobTitle',    header: 'Job Title',       get: r => r.employee.jobTitle ?? '' },
    { key: 'department',  header: 'Department',      get: r => r.employee.department?.name ?? '' },
    { key: 'branch',      header: 'Branch',          get: r => r.employee.branch ?? '' },
    { key: 'type',        header: 'Leave Type',      get: r => r.type },
    { key: 'startDate',   header: 'Start Date',      get: r => r.startDate.toISOString().slice(0, 10) },
    { key: 'endDate',     header: 'End Date',        get: r => r.endDate.toISOString().slice(0, 10) },
    { key: 'days',        header: 'Days',            get: r => durationDays(r.startDate, r.endDate) },
    { key: 'status',      header: 'Status',          get: r => r.status },
    { key: 'reason',      header: 'Reason',          get: r => r.reason },
  ]);

  const fromStr = fromDate.toISOString().slice(0, 10);
  const toStr = toDate.toISOString().slice(0, 10);
  const filename = `leave-report-${fromStr}_to_${toStr}.csv`;
  return csvResponse(csv, filename);
});
