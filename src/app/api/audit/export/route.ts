import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { errorResponse } from '@/lib/api-utils';
import { toCsv, csvResponse } from '@/lib/exports/csv';

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD').optional(),
  actorId: z.string().optional(),
  workflowId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50_000).optional(),
});

/**
 * GET /api/audit/export?from=YYYY-MM-DD&to=YYYY-MM-DD&actorId=&workflowId=&limit=
 *
 * Streams workflow audit entries as CSV for compliance / governance review.
 * Requires `audit:view`. Default scope = last 90 days, capped at 10k rows
 * (raise via `limit` up to 50k).
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('audit:view') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'audit:view required', 403, correlationId);
  }
  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const { from, to, actorId, workflowId, limit } = parsed.data;
  const fromDate = from ? new Date(from + 'T00:00:00.000Z')
                       : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to + 'T23:59:59.999Z') : new Date();

  const entries = await prisma.workflowAuditEntry.findMany({
    where: {
      timestamp: { gte: fromDate, lte: toDate },
      ...(actorId ? { actorId } : {}),
      ...(workflowId ? { instance: { workflowId } } : {}),
    },
    include: {
      instance: { select: { workflowId: true, resourceId: true } },
    },
    orderBy: { timestamp: 'asc' },
    take: limit ?? 10_000,
  });

  const csv = toCsv(entries, [
    { key: 'timestamp',  header: 'Timestamp (UTC)', get: r => r.timestamp.toISOString() },
    { key: 'workflowId', header: 'Workflow',        get: r => r.instance.workflowId },
    { key: 'resourceId', header: 'Resource ID',     get: r => r.instance.resourceId },
    { key: 'action',     header: 'Action',          get: r => r.action },
    { key: 'fromState',  header: 'From State',      get: r => r.fromState ?? '' },
    { key: 'toState',    header: 'To State',        get: r => r.toState },
    { key: 'actorId',    header: 'Actor ID',        get: r => r.actorId },
    { key: 'actorName',  header: 'Actor Name',      get: r => r.actorName },
    { key: 'actorRole',  header: 'Actor Role',      get: r => r.actorRole },
    { key: 'comment',    header: 'Comment',         get: r => r.comment ?? '' },
  ]);

  const fromStr = fromDate.toISOString().slice(0, 10);
  const toStr = toDate.toISOString().slice(0, 10);
  const filename = `audit-export-${fromStr}_to_${toStr}.csv`;
  return csvResponse(csv, filename);
});
