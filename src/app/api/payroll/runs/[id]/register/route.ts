import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { errorResponse } from '@/lib/api-utils';
import { toCsv, csvResponse } from '@/lib/exports/csv';

function num(v: { toString: () => string } | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v.toString());
}

/**
 * GET /api/payroll/runs/[id]/register
 *
 * Streams the full payroll register for a run as CSV. Requires
 * `payroll:view` (Finance / HR / SUPER_ADMIN). Run must be at least
 * APPROVED (DRAFT and REVIEW are previews).
 */
export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('payroll:view') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'payroll:view required', 403, correlationId);
  }
  const { id } = (await context.params) as { id: string };

  const run = await prisma.payrollRun.findUnique({
    where: { id },
    include: {
      department: { select: { name: true, code: true } },
      entries: {
        orderBy: { netPay: 'desc' },
        include: {
          employee: {
            select: {
              staffId: true, firstName: true, lastName: true,
              email: true, jobTitle: true, branch: true,
              department: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!run) {
    return errorResponse('NOT_FOUND', 'Run not found', 404, correlationId);
  }
  if (!['APPROVED', 'PROCESSED'].includes(run.status)) {
    return errorResponse('NOT_APPROVED',
      `Register only available after the run is APPROVED or PROCESSED (currently ${run.status})`, 409, correlationId);
  }

  const csv = toCsv(run.entries, [
    { key: 'staffId',      header: 'Staff ID',         get: r => r.employee.staffId },
    { key: 'firstName',    header: 'First Name',       get: r => r.employee.firstName },
    { key: 'lastName',     header: 'Last Name',        get: r => r.employee.lastName },
    { key: 'email',        header: 'Email',            get: r => r.employee.email },
    { key: 'jobTitle',     header: 'Job Title',        get: r => r.employee.jobTitle ?? '' },
    { key: 'department',   header: 'Department',       get: r => r.employee.department?.name ?? '' },
    { key: 'branch',       header: 'Branch',           get: r => r.employee.branch ?? '' },
    { key: 'basic',        header: 'Basic Salary',     get: r => num(r.basicSalary) },
    { key: 'housing',      header: 'Housing',          get: r => num(r.housingAllowance) },
    { key: 'transport',    header: 'Transport',        get: r => num(r.transportAllowance) },
    { key: 'gross',        header: 'Gross Pay',        get: r => num(r.grossPay) },
    { key: 'paye',         header: 'PAYE',             get: r => num(r.paye) },
    { key: 'pension',      header: 'Pension (Employee)', get: r => num(r.pensionEmployee) },
    { key: 'pensionEmp',   header: 'Pension (Employer)', get: r => num(r.pensionEmployer) },
    { key: 'nhf',          header: 'NHF',              get: r => num(r.nhf) },
    { key: 'nhis',         header: 'NHIS',             get: r => num(r.nhis) },
    { key: 'deductions',   header: 'Total Deductions', get: r => num(r.totalDeductions) },
    { key: 'net',          header: 'Net Pay',          get: r => num(r.netPay) },
  ]);

  const scope = run.department?.code ?? 'ORG';
  const filename = `payroll-register-${run.period}-${scope}.csv`;
  return csvResponse(csv, filename);
});
