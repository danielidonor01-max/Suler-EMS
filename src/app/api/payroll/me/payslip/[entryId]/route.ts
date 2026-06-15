import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { errorResponse } from '@/lib/api-utils';
import { renderToBuffer } from '@react-pdf/renderer';
import { PayslipDocument } from '@/lib/exports/payslip-pdf';

function ngn(n: number): string {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}
function num(v: { toString: () => string } | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v.toString());
}

/**
 * GET /api/payroll/me/payslip/[entryId]
 *
 * Streams a PDF payslip for a PayrollEntry. Authorization:
 *   - The caller IS the entry's employee, OR
 *   - The caller has `payroll:view` (Finance / HR / SUPER_ADMIN can pull any payslip)
 *
 * Only entries from PROCESSED runs are exposed — draft/review/approved runs
 * are previews, not authoritative payslips.
 */
export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { entryId } = (await context.params) as { entryId: string };

  const entry = await prisma.payrollEntry.findUnique({
    where: { id: entryId },
    include: {
      employee: {
        select: {
          id: true, staffId: true, firstName: true, lastName: true, jobTitle: true, branch: true,
          department: { select: { name: true } },
        },
      },
      run: { select: { id: true, name: true, period: true, status: true, processedAt: true } },
    },
  });
  if (!entry) {
    return errorResponse('NOT_FOUND', 'Payslip not found', 404, correlationId);
  }

  const isOwner = entry.employee.id === session.user.employeeId;
  const canViewAny = (session.user.permissions ?? []).includes('payroll:view')
    || session.user.role === 'SUPER_ADMIN';
  if (!isOwner && !canViewAny) {
    return errorResponse('FORBIDDEN', 'Not authorized to view this payslip', 403, correlationId);
  }
  if (entry.run.status !== 'PROCESSED') {
    return errorResponse('NOT_PROCESSED', 'Payslip only available after the run is PROCESSED', 409, correlationId);
  }

  // Build the document data.
  const otherAllowances = (entry.otherAllowances as Array<{ name: string; amount: number }> | null) ?? [];
  const otherDeductions = (entry.otherDeductions as Array<{ name: string; amount: number }> | null) ?? [];

  const earnings = [
    { label: 'Basic Salary', amount: ngn(num(entry.basicSalary)) },
    { label: 'Housing Allowance', amount: ngn(num(entry.housingAllowance)) },
    { label: 'Transport Allowance', amount: ngn(num(entry.transportAllowance)) },
    ...otherAllowances.map(a => ({ label: a.name, amount: ngn(Number(a.amount)) })),
  ];
  const deductions = [
    { label: 'PAYE', amount: ngn(num(entry.paye)) },
    { label: 'Pension (Employee)', amount: ngn(num(entry.pensionEmployee)) },
    { label: 'NHF', amount: ngn(num(entry.nhf)) },
    { label: 'NHIS', amount: ngn(num(entry.nhis)) },
    ...otherDeductions.map(d => ({ label: d.name, amount: ngn(Number(d.amount)) })),
  ];

  const fullName = `${entry.employee.firstName} ${entry.employee.lastName}`.trim();
  const processedAt = entry.run.processedAt
    ? new Date(entry.run.processedAt).toISOString().slice(0, 10)
    : '—';

  const buffer = await renderToBuffer(PayslipDocument({
    organization: { name: 'Suler EMS', address: 'Lagos · Abuja · Port Harcourt' },
    employee: {
      staffId: entry.employee.staffId,
      fullName,
      jobTitle: entry.employee.jobTitle,
      branch: entry.employee.branch ?? undefined,
      department: entry.employee.department?.name,
    },
    period: { label: entry.run.period, processedAt },
    earnings,
    deductions,
    totals: {
      gross: ngn(num(entry.grossPay)),
      deductions: ngn(num(entry.totalDeductions)),
      net: ngn(num(entry.netPay)),
      employerPension: ngn(num(entry.pensionEmployer)),
    },
    generatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC',
  }));

  const filename = `payslip-${entry.employee.staffId}-${entry.run.period}.pdf`;
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
});
