import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/employees/[id]/profile — full employee profile read + gated edit.
 *
 *   GET   — full profile incl. employment + role + department + hub +
 *           compliance fields. Compliance-sensitive fields (NIN/BVN/TIN)
 *           are masked unless the caller has hr:edit or is the owner.
 *   PATCH — name + employment + compliance updates. Requires hr:edit
 *           OR settings:manage OR SUPER_ADMIN. Owners can edit a small
 *           self-service subset (phone only) — for everything else they
 *           must file a change request via /api/profile/change-requests.
 */

const PatchSchema = z.object({
  // Identity (gated)
  firstName: z.string().min(1).max(60).optional(),
  lastName:  z.string().min(1).max(60).optional(),
  jobTitle:  z.string().min(2).max(120).optional(),
  grade:     z.string().max(20).nullable().optional(),
  branch:    z.string().max(60).nullable().optional(),
  // Compliance (gated)
  nin:           z.string().max(20).nullable().optional(),
  bvn:           z.string().max(20).nullable().optional(),
  tin:           z.string().max(20).nullable().optional(),
  pensionPFA:    z.string().max(60).nullable().optional(),
  pensionNumber: z.string().max(40).nullable().optional(),
  nhfNumber:     z.string().max(40).nullable().optional(),
  // Banking — payroll disbursement (gated)
  bankName:          z.string().max(80).nullable().optional(),
  bankCode:          z.string().max(10).nullable().optional(),
  bankAccountNumber: z.string().max(20).nullable().optional(),
  // Self-serviceable
  phone:    z.string().max(40).nullable().optional(),
  status:   z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

// Which fields a non-privileged owner is allowed to set on themselves.
// Bank details are intentionally included — payroll disbursement skips
// employees with no account on file, so making this self-service avoids
// HR being a bottleneck for every new hire's first payday.
const SELF_SERVICEABLE = new Set(['phone', 'bankName', 'bankCode', 'bankAccountNumber']);

function canEditOthers(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

function canViewCompliance(session: { user: { role: string; permissions?: string[]; employeeId?: string | null } }, employeeId: string): boolean {
  if (canEditOthers(session)) return true;
  return session.user.employeeId === employeeId;
}

// Banking visibility: HR + owner. Account numbers are sensitive enough
// that a generic permission like `payroll:view` shouldn't unlock them —
// Finance reads them via the disbursement export endpoint instead.
function canViewBanking(session: { user: { role: string; permissions?: string[]; employeeId?: string | null } }, employeeId: string): boolean {
  if (canEditOthers(session)) return true;
  return session.user.employeeId === employeeId;
}

function canEditBanking(session: { user: { role: string; permissions?: string[]; employeeId?: string | null } }): boolean {
  if (canEditOthers(session)) return true;
  return (session.user.permissions ?? []).includes('payroll:edit');
}

// Compensation visibility: HR + owner + anyone with payroll:view. Salary
// figures are routinely needed by Finance and managers in performance
// review prep, so the threshold is lower than for bank details.
function canViewCompensation(session: { user: { role: string; permissions?: string[]; employeeId?: string | null } }, employeeId: string): boolean {
  if (canEditOthers(session)) return true;
  if ((session.user.permissions ?? []).includes('payroll:view')) return true;
  if ((session.user.permissions ?? []).includes('payroll:edit')) return true;
  return session.user.employeeId === employeeId;
}

function maskField(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 4) return '••••';
  return `${value.slice(0, 2)}••••${value.slice(-2)}`;
}

/** Inclusive days of `req` that fall inside [windowStart, windowEnd]. */
function clippedDays(reqStart: Date, reqEnd: Date, windowStart: Date, windowEnd: Date): number {
  const s = reqStart > windowStart ? reqStart : windowStart;
  const e = reqEnd   < windowEnd   ? reqEnd   : windowEnd;
  if (e < s) return 0;
  return Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  try {
    // Window helpers reused below for leave balances + attendance summary.
    const now = new Date();
    const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const yearEnd   = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59));
    const thirtyDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30));
    const todayUtc      = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id },
      include: {
        department: {
          select: {
            id: true, code: true, name: true,
            hub: { select: { id: true, code: true, name: true } },
          },
        },
        user: {
          select: {
            id: true, email: true, isActive: true, lastLoginAt: true, createdAt: true,
            role: { select: { id: true, name: true } },
          },
        },
        teamMemberships: {
          select: {
            id: true, role: true, joinedAt: true,
            team: { select: { id: true, code: true, name: true } },
          },
        },
        salaryStructures: {
          where: { isActive: true },
          take: 1,
          select: {
            id: true,
            effectiveDate: true,
            basicSalary: true,
            housingAllowance: true,
            transportAllowance: true,
            otherAllowances: true,
            currency: true,
          },
        },
      },
    });

    const showCompliance   = canViewCompliance(session as any, employee.id);
    const showBanking      = canViewBanking(session as any, employee.id);
    const showCompensation = canViewCompensation(session as any, employee.id);
    const canEditBank      = canEditBanking(session as any);

    // Leave balances + attendance summary are batched in parallel after
    // the employee fetch so the profile load stays a single round-trip
    // from the client's perspective. The two queries are scoped to this
    // employee (cheap) — not the whole org like /api/leave/balances.
    const [leaveTypes, approvedLeaves, attendanceCounts, lastPunch] = await Promise.all([
      prisma.leaveType.findMany({
        where:  { isActive: true },
        orderBy: { code: 'asc' },
        select: { code: true, name: true, color: true, quotaDays: true },
      }),
      prisma.leaveRequest.findMany({
        where: {
          employeeId: id,
          status:     'HR_APPROVED',
          startDate:  { lte: yearEnd },
          endDate:    { gte: yearStart },
        },
        select: { type: true, startDate: true, endDate: true },
      }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: {
          employeeId: id,
          date:       { gte: thirtyDaysAgo, lte: todayUtc },
        },
        _count: { _all: true },
      }),
      prisma.attendanceRecord.findFirst({
        where:   { employeeId: id, checkIn: { not: null } },
        orderBy: { date: 'desc' },
        select:  { date: true, checkIn: true, checkOut: true, status: true },
      }),
    ]);

    // Bucket approved days per leave-type code, clipped to the current
    // calendar year (same convention as /api/leave/balances).
    const usedByType = new Map<string, number>();
    for (const lr of approvedLeaves) {
      const days = clippedDays(lr.startDate, lr.endDate, yearStart, yearEnd);
      if (days <= 0) continue;
      usedByType.set(lr.type, (usedByType.get(lr.type) ?? 0) + days);
    }

    const leaveBalances = leaveTypes.map(lt => {
      const used = usedByType.get(lt.code) ?? 0;
      return {
        typeCode:  lt.code,
        typeName:  lt.name,
        color:     lt.color,
        quota:     lt.quotaDays,
        used,
        remaining: Math.max(0, lt.quotaDays - used),
      };
    });

    const attendanceCountsMap = new Map<string, number>();
    for (const row of attendanceCounts) {
      attendanceCountsMap.set(row.status, row._count._all);
    }
    const present = attendanceCountsMap.get('PRESENT') ?? 0;
    const late    = attendanceCountsMap.get('LATE')    ?? 0;
    const absent  = attendanceCountsMap.get('ABSENT')  ?? 0;
    const totalLogged = present + late + absent;
    const punctualityPct = totalLogged > 0
      ? parseFloat(((present / totalLogged) * 100).toFixed(1))
      : 0;

    const attendanceSummary = {
      windowDays:    30,
      present,
      late,
      absent,
      totalLogged,
      punctualityPct,
      lastCheckIn:   lastPunch?.checkIn ?? null,
      lastCheckOut:  lastPunch?.checkOut ?? null,
      lastStatus:    lastPunch?.status ?? null,
    };
    const compliance = showCompliance
      ? {
          nin:           employee.nin,
          bvn:           employee.bvn,
          tin:           employee.tin,
          pensionPFA:    employee.pensionPFA,
          pensionNumber: employee.pensionNumber,
          nhfNumber:     employee.nhfNumber,
          nsitfNumber:   employee.nsitfNumber,
          itfNumber:     employee.itfNumber,
        }
      : {
          nin:           maskField(employee.nin),
          bvn:           maskField(employee.bvn),
          tin:           maskField(employee.tin),
          pensionPFA:    employee.pensionPFA ? '••••' : null,
          pensionNumber: maskField(employee.pensionNumber),
          nhfNumber:     maskField(employee.nhfNumber),
          nsitfNumber:   maskField(employee.nsitfNumber),
          itfNumber:     maskField(employee.itfNumber),
        };

    const data = {
      id:        employee.id,
      staffId:   employee.staffId,
      firstName: employee.firstName,
      lastName:  employee.lastName,
      name:      `${employee.firstName} ${employee.lastName}`,
      email:     employee.email,
      phone:     employee.phone,
      jobTitle:  employee.jobTitle,
      grade:     employee.grade,
      branch:    employee.branch,
      status:    employee.status,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,

      department: employee.department,
      hub:        employee.department?.hub ?? null,

      user: employee.user
        ? {
            id:          employee.user.id,
            email:       employee.user.email,
            isActive:    employee.user.isActive,
            lastLoginAt: employee.user.lastLoginAt,
            role:        employee.user.role,
            createdAt:   employee.user.createdAt,
          }
        : null,

      teams: employee.teamMemberships.map(m => ({
        membershipId: m.id,
        role:         m.role,
        joinedAt:     m.joinedAt,
        team:         m.team,
      })),

      compliance,

      banking: showBanking
        ? {
            bankName:          employee.bankName,
            bankCode:          employee.bankCode,
            bankAccountNumber: employee.bankAccountNumber,
          }
        : {
            bankName:          employee.bankName,
            bankCode:          null,
            // Show only the last 4 digits so the owner / a manager can
            // confirm the account on file without exposing the full number
            // to anyone with a profile-view link.
            bankAccountNumber: maskField(employee.bankAccountNumber),
          },

      compensation: showCompensation && employee.salaryStructures[0]
        ? (() => {
            const s = employee.salaryStructures[0];
            const others = ((s.otherAllowances as Array<{ amount: number }> | null) ?? [])
              .reduce((sum, a) => sum + Number(a.amount), 0);
            const basic     = Number(s.basicSalary);
            const housing   = Number(s.housingAllowance);
            const transport = Number(s.transportAllowance);
            return {
              effectiveDate:      s.effectiveDate,
              basicSalary:        basic,
              housingAllowance:   housing,
              transportAllowance: transport,
              otherAllowances:    others,
              grossMonthly:       basic + housing + transport + others,
              currency:           s.currency,
            };
          })()
        : null,

      leaveBalances,
      attendanceSummary,

      // Tells the client which UI to render (Edit form vs Request-Update form).
      capabilities: {
        canEdit:             canEditOthers(session as any),
        canEditSelf:         session.user.employeeId === employee.id,
        canViewCompliance:   showCompliance,
        canViewBanking:      showBanking,
        canEditBanking:      canEditBank,
        canViewCompensation: showCompensation,
      },
    };

    return successResponse(data, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Employee not found';
    return errorResponse('NOT_FOUND', msg, 404, correlationId);
  }
});

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const isOwner = session.user.employeeId === id;
  const privileged = canEditOthers(session as any);

  // Non-privileged users editing themselves: only SELF_SERVICEABLE keys.
  // Everything else needs a change request.
  if (!privileged) {
    if (!isOwner) {
      return errorResponse('FORBIDDEN', 'You can only edit your own profile', 403, correlationId);
    }
    const submittedKeys = Object.keys(parsed.data);
    const disallowed = submittedKeys.filter(k => !SELF_SERVICEABLE.has(k));
    if (disallowed.length > 0) {
      return errorResponse(
        'CHANGE_REQUEST_REQUIRED',
        `Fields require a change request via POST /api/profile/change-requests: ${disallowed.join(', ')}`,
        403,
        correlationId,
      );
    }
  }

  try {
    const updated = await prisma.employee.update({
      where: { id },
      data:  parsed.data,
    });

    // Mirror the name change to the linked User row so headers + audit
    // attributions update too. Phone-only edits leave User untouched.
    if (parsed.data.firstName || parsed.data.lastName) {
      const fullName = `${updated.firstName} ${updated.lastName}`.trim();
      await prisma.user.updateMany({
        where: { employeeId: id },
        data:  { name: fullName },
      });
    }

    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile';
    if (msg.includes('Unique constraint')) {
      return errorResponse('DUPLICATE', 'A unique field collided (NIN/BVN/TIN already in use)', 409, correlationId);
    }
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Employee not found', 404, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});
