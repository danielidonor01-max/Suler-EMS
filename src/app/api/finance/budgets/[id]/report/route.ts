import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { errorResponse } from '@/lib/api-utils';
import { renderToBuffer } from '@react-pdf/renderer';
import { BudgetReportDocument } from '@/lib/exports/budget-pdf';

function ngn(n: number): string {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}
function num(v: { toString: () => string } | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v.toString());
}

/**
 * GET /api/finance/budgets/[id]/report
 *
 * Streams a PDF budget report (allocation, utilization, categories,
 * recent expenditures). Requires `finance:view`.
 */
export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('finance:view') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'finance:view required', 403, correlationId);
  }
  const { id } = (await context.params) as { id: string };

  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      department: { select: { name: true, code: true } },
      categories: { orderBy: { name: 'asc' } },
      expenditures: {
        where: { status: { in: ['APPROVED', 'DISBURSED'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { category: { select: { name: true } } },
      },
    },
  });
  if (!budget) {
    return errorResponse('NOT_FOUND', 'Budget not found', 404, correlationId);
  }

  const total = num(budget.totalAmount);
  const allocated = num(budget.allocatedAmount);
  const spent = num(budget.spentAmount);
  const remaining = total - spent;
  const utilizationPercent = total === 0 ? 0 : Math.round((spent / total) * 100);

  const buffer = await renderToBuffer(BudgetReportDocument({
    organization: { name: 'Suler EMS', address: 'Lagos · Abuja · Port Harcourt' },
    budget: {
      name: budget.name,
      fiscalYear: budget.fiscalYear,
      period: budget.period,
      department: budget.department?.name,
      status: budget.status,
      description: budget.description ?? undefined,
    },
    totals: {
      total: ngn(total),
      allocated: ngn(allocated),
      spent: ngn(spent),
      remaining: ngn(Math.max(0, remaining)),
      utilizationPercent,
    },
    categories: budget.categories.map(c => {
      const cAlloc = num(c.allocatedAmount);
      const cSpent = num(c.spentAmount);
      const cRemaining = cAlloc - cSpent;
      const pct = cAlloc === 0 ? 0 : Math.round((cSpent / cAlloc) * 100);
      return {
        name: c.name,
        code: c.code ?? undefined,
        allocated: ngn(cAlloc),
        spent: ngn(cSpent),
        remaining: ngn(Math.max(0, cRemaining)),
        pct,
      };
    }),
    recentExpenditures: budget.expenditures.map(e => ({
      date: e.createdAt.toISOString().slice(0, 10),
      description: e.description,
      vendor: e.vendor ?? '',
      category: e.category?.name ?? '',
      amount: ngn(num(e.amount)),
      status: e.status,
    })),
    generatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC',
  }));

  const safeName = budget.name.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 60);
  const filename = `budget-report-${safeName}-${budget.fiscalYear}.pdf`;
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
});
