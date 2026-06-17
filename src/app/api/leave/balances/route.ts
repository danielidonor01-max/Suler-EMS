import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/leave/balances?year=YYYY
 *
 * Per-employee, per-leave-type entitlement vs. utilization for a fiscal
 * year. Drives the Balance Tracker tab.
 *
 *   quota     — from LeaveType.quotaDays (the catalogue value)
 *   used      — sum of approved (HR_APPROVED) leave days falling within
 *               the requested year. Days are inclusive of both endpoints
 *               and clipped to the year's window so a request straddling
 *               year-end attributes the right amount to each year.
 *   remaining — max(0, quota - used)
 *
 * Permission: any authenticated user. Employees can see the org's roll-up
 * (this matches existing transparency norms — payroll register is also
 * org-wide readable). To restrict, layer on a permission check here.
 */

const QuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

interface Balance {
  typeCode:  string;
  typeName:  string;
  color:     string | null;
  quota:     number;
  used:      number;
  remaining: number;
}

interface EmployeeBalances {
  employeeId:   string;
  employeeName: string;
  jobTitle:     string;
  branch:       string | null;
  balances:     Balance[];
}

/** Inclusive days of `req` that fall inside [yearStart, yearEnd]. */
function clippedDays(reqStart: Date, reqEnd: Date, yearStart: Date, yearEnd: Date): number {
  const s = reqStart > yearStart ? reqStart : yearStart;
  const e = reqEnd   < yearEnd   ? reqEnd   : yearEnd;
  if (e < s) return 0;
  return Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

export const GET = withAuth(async (req, _session) => {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  const year = parsed.data.year ?? new Date().getFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd   = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

  try {
    // Three queries in parallel: active employees, active leave types,
    // approved leave that touches this year.
    const [employees, leaveTypes, approvedLeaves] = await Promise.all([
      prisma.employee.findMany({
        where:  { status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, jobTitle: true, branch: true },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      prisma.leaveType.findMany({
        where:  { isActive: true },
        orderBy: { code: 'asc' },
      }),
      prisma.leaveRequest.findMany({
        where: {
          status:    'HR_APPROVED',
          startDate: { lte: yearEnd },
          endDate:   { gte: yearStart },
        },
        select: {
          employeeId: true,
          type:       true,
          startDate:  true,
          endDate:    true,
        },
      }),
    ]);

    // Bucket used-days by (employeeId, typeCode).
    const usedKey = (eid: string, type: string) => `${eid}::${type}`;
    const usedByKey = new Map<string, number>();
    for (const lr of approvedLeaves) {
      const days = clippedDays(lr.startDate, lr.endDate, yearStart, yearEnd);
      if (days <= 0) continue;
      const k = usedKey(lr.employeeId, lr.type);
      usedByKey.set(k, (usedByKey.get(k) ?? 0) + days);
    }

    const data: EmployeeBalances[] = employees.map(emp => ({
      employeeId:   emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      jobTitle:     emp.jobTitle,
      branch:       emp.branch,
      balances: leaveTypes.map(lt => {
        const used = usedByKey.get(usedKey(emp.id, lt.code)) ?? 0;
        return {
          typeCode:  lt.code,
          typeName:  lt.name,
          color:     lt.color,
          quota:     lt.quotaDays,
          used,
          remaining: Math.max(0, lt.quotaDays - used),
        };
      }),
    }));

    return successResponse({ year, employees: data }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to compute balances';
    return errorResponse('BALANCES_FAILED', msg, 500, correlationId);
  }
});
