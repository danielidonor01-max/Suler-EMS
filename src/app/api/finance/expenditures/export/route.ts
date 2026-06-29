import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { errorResponse } from '@/lib/api-utils';
import { toCsv, csvResponse } from '@/lib/exports/csv';

/**
 * GET /api/finance/expenditures/export?from=YYYY-MM-DD&to=YYYY-MM-DD&status=&budgetId=
 *
 * Streams a CSV of expenditures. Gated on finance:view (or
 * FINANCE_MANAGER / SUPER_ADMIN role). Defaults to the trailing 12
 * months when no window is supplied — same convention the leave
 * report uses, so Finance can grab a quick reconciliation file.
 *
 * Columns: requester, description, budget, category, amount, status,
 * vendor, createdAt, approvedAt, disbursedAt, paymentMethod, rejectReason.
 */

const QuerySchema = z.object({
  from:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status:   z.string().optional(),
  budgetId: z.string().uuid().optional(),
  limit:    z.coerce.number().int().min(1).max(50_000).optional(),
});

export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const canExport =
    session.user.role === 'SUPER_ADMIN'
    || session.user.role === 'FINANCE_MANAGER'
    || (session.user.permissions ?? []).includes('finance:view');
  if (!canExport) {
    return errorResponse('FORBIDDEN', 'finance:view required', 403, correlationId);
  }

  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const { from, to, status, budgetId, limit } = parsed.data;
  const fromDate = from ? new Date(from + 'T00:00:00.000Z')
                        : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const toDate   = to   ? new Date(to   + 'T23:59:59.999Z') : new Date();
  const statuses = status ? status.split(',').map(s => s.trim()).filter(Boolean) : undefined;

  const rows = await prisma.expenditure.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      ...(statuses && statuses.length ? { status: { in: statuses } } : {}),
      ...(budgetId ? { budgetId } : {}),
    },
    include: {
      budget:      { select: { name: true, currency: true } },
      category:    { select: { name: true, code: true } },
      requestedBy: { select: { staffId: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take:    limit ?? 10_000,
  });

  // The audit timestamps (approvedAt / disbursedAt) aren't separately
  // stored on the Expenditure row — they live on WorkflowAuditEntry. We
  // do one bulk lookup keyed by workflowInstanceId so per-row history
  // joins don't N+1.
  const instanceIds = rows.map(r => r.workflowInstanceId).filter((x): x is string => !!x);
  const audits = instanceIds.length
    ? await prisma.workflowAuditEntry.findMany({
        where:  { instanceId: { in: instanceIds }, action: { in: ['APPROVE_FINANCE', 'DISBURSE'] } },
        select: { instanceId: true, action: true, timestamp: true },
      })
    : [];
  const approvedAtById = new Map<string, Date>();
  const disbursedAtById = new Map<string, Date>();
  for (const a of audits) {
    if (a.action === 'APPROVE_FINANCE') approvedAtById.set(a.instanceId, a.timestamp);
    if (a.action === 'DISBURSE')        disbursedAtById.set(a.instanceId, a.timestamp);
  }

  const csv = toCsv(rows, [
    { key: 'createdAt',      header: 'Created (UTC)',   get: r => r.createdAt.toISOString() },
    { key: 'staffId',        header: 'Staff ID',        get: r => r.requestedBy.staffId },
    { key: 'firstName',      header: 'First Name',      get: r => r.requestedBy.firstName },
    { key: 'lastName',       header: 'Last Name',       get: r => r.requestedBy.lastName },
    { key: 'email',          header: 'Email',           get: r => r.requestedBy.email },
    { key: 'budget',         header: 'Budget',          get: r => r.budget.name },
    { key: 'category',       header: 'Category',        get: r => r.category?.name ?? '' },
    { key: 'description',    header: 'Description',     get: r => r.description },
    { key: 'vendor',         header: 'Vendor',          get: r => r.vendor ?? '' },
    { key: 'amount',         header: 'Amount',          get: r => Number(r.amount).toFixed(2) },
    { key: 'currency',       header: 'Currency',        get: r => r.budget.currency },
    { key: 'status',         header: 'Status',          get: r => r.status },
    { key: 'approvedAt',     header: 'Approved (UTC)',  get: r => r.workflowInstanceId ? approvedAtById.get(r.workflowInstanceId)?.toISOString() ?? '' : '' },
    { key: 'disbursedAt',    header: 'Disbursed (UTC)', get: r => r.workflowInstanceId ? disbursedAtById.get(r.workflowInstanceId)?.toISOString() ?? '' : '' },
    { key: 'paymentMethod',  header: 'Payment Method',  get: r => r.paymentMethod ?? '' },
    { key: 'rejectReason',   header: 'Reject Reason',   get: r => r.rejectReason ?? '' },
  ]);

  const fromStr = fromDate.toISOString().slice(0, 10);
  const toStr   = toDate.toISOString().slice(0, 10);
  const filename = `expenditures-${fromStr}_to_${toStr}.csv`;
  return csvResponse(csv, filename);
});
