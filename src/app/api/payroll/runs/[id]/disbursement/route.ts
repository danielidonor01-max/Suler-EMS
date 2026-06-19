import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { errorResponse } from '@/lib/api-utils';

/**
 * GET /api/payroll/runs/[id]/disbursement
 *
 * Returns a NIBSS-style CSV of net-pay disbursements for a PROCESSED
 * payroll run. The CSV is the file Finance uploads to the bank portal
 * for bulk salary credit.
 *
 * Columns: BankCode, AccountNumber, AccountName, Amount, Narration
 * Amounts are NGN with two decimal places per NIBSS spec.
 *
 * Rows for employees missing bank details are SKIPPED in the export
 * but listed in the X-Disbursement-Skipped response header so HR can
 * fix them up. Returning 200 with a partial list rather than 400 is
 * the right call — partial disbursement is normal in practice; HR
 * still needs the file to begin paying everyone they can.
 *
 * Authorization: payroll:view + the run must be PROCESSED. Draft /
 * review / approved runs are previews — exporting them risks
 * accidental disbursement.
 */
export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('payroll:view')
    && session.user.role !== 'SUPER_ADMIN'
    && session.user.role !== 'FINANCE_MANAGER') {
    return errorResponse('FORBIDDEN', 'payroll:view required', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };

  const run = await prisma.payrollRun.findUnique({
    where: { id },
    include: {
      entries: {
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true, staffId: true,
              bankName: true, bankCode: true, bankAccountNumber: true,
            },
          },
        },
        orderBy: { employee: { lastName: 'asc' } },
      },
    },
  });

  if (!run) return errorResponse('NOT_FOUND', 'Payroll run not found', 404, correlationId);
  if (run.status !== 'PROCESSED') {
    return errorResponse(
      'NOT_PROCESSED',
      `Run is ${run.status} — disbursement is only available after PROCESS.`,
      409,
      correlationId,
    );
  }

  // Build CSV
  const includedRows: string[] = [];
  const skipped:      Array<{ staffId: string; name: string; reason: string }> = [];

  const escape = (v: string): string => {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const narration = `SALARY ${run.period}`;

  for (const entry of run.entries) {
    const emp = entry.employee;
    const name = `${emp.firstName} ${emp.lastName}`;
    if (!emp.bankAccountNumber || !emp.bankCode) {
      skipped.push({
        staffId: emp.staffId,
        name,
        reason: !emp.bankAccountNumber ? 'Missing account number' : 'Missing bank code',
      });
      continue;
    }
    const amount = Number(entry.netPay).toFixed(2);
    includedRows.push([
      escape(emp.bankCode),
      escape(emp.bankAccountNumber),
      escape(name.toUpperCase()),
      amount,
      escape(narration),
    ].join(','));
  }

  const header = 'BankCode,AccountNumber,AccountName,Amount,Narration';
  const csv = [header, ...includedRows].join('\n') + '\n';
  const filename = `disbursement-${run.period}-${id.slice(0, 8)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
      'X-Disbursement-Count': String(includedRows.length),
      'X-Disbursement-Skipped': String(skipped.length),
      // Encode the first 20 skipped employees in a header so the UI can
      // surface them inline without a second round-trip. Keep small —
      // headers are bandwidth-bounded.
      'X-Disbursement-Skipped-Sample':
        skipped.slice(0, 20).map(s => `${s.staffId}:${s.reason}`).join('|'),
    },
  });
});
