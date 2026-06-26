import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { errorResponse } from '@/lib/api-utils';
import { toCsv, csvResponse } from '@/lib/exports/csv';

/**
 * GET /api/employees/export
 *
 * Streams the workforce registry as a CSV. Gated on workforce:view —
 * HR / SUPER_ADMIN / anyone with the permission. Compliance fields
 * (NIN/BVN/TIN/pension/NHF) and bank account numbers are intentionally
 * omitted; this is the operational headcount export, not the
 * payroll-disbursement file (that lives at
 * /api/payroll/runs/[id]/disbursement).
 *
 * Optional ?status=ACTIVE filter; default is everyone.
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const canView = (session.user.permissions ?? []).includes('workforce:view')
    || session.user.role === 'SUPER_ADMIN'
    || session.user.role === 'HR_ADMIN';
  if (!canView) {
    return errorResponse('FORBIDDEN', 'workforce:view required', 403, correlationId);
  }

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status');

  const employees = await prisma.employee.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    orderBy: [{ status: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      department: { select: { name: true, code: true } },
      user:       { select: { role: { select: { name: true } } } },
    },
  });

  const csv = toCsv(employees, [
    { key: 'staffId',     header: 'Staff ID',    get: e => e.staffId },
    { key: 'firstName',   header: 'First Name',  get: e => e.firstName },
    { key: 'lastName',    header: 'Last Name',   get: e => e.lastName },
    { key: 'email',       header: 'Email',       get: e => e.email },
    { key: 'phone',       header: 'Phone',       get: e => e.phone ?? '' },
    { key: 'jobTitle',    header: 'Job Title',   get: e => e.jobTitle },
    { key: 'grade',       header: 'Grade',       get: e => e.grade ?? '' },
    { key: 'department',  header: 'Department',  get: e => e.department?.name ?? '' },
    { key: 'branch',      header: 'Branch',      get: e => e.branch ?? '' },
    { key: 'role',        header: 'Role',        get: e => e.user?.role?.name ?? '' },
    { key: 'status',      header: 'Status',      get: e => e.status },
    { key: 'joinedAt',    header: 'Joined',      get: e => e.createdAt.toISOString().slice(0, 10) },
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const filename = `workforce-registry-${today}.csv`;
  return csvResponse(csv, filename);
});
