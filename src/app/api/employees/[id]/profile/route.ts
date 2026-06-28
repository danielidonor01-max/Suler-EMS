import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import {
  canEditOthers,
  canViewCompliance,
  canViewBanking,
  canEditBanking,
  canViewCompensation,
  maskField,
} from '@/lib/profile/permissions';

/**
 * /api/employees/[id]/profile — core profile read + gated edit.
 *
 *   GET   — identity + employment + teams + banking + active comp +
 *           pending change requests + org chart + capabilities. The
 *           heavy below-the-fold panels (leave balances, attendance,
 *           performance, payslips, comp history, activity timeline) now
 *           live at /api/employees/[id]/profile/extras so the modal
 *           can render core sections first while extras streams in.
 *   PATCH — name + employment + compliance + banking updates. Requires
 *           hr:edit OR settings:manage OR SUPER_ADMIN. Owners can edit
 *           a small self-service subset (phone + bank fields) — for
 *           everything else they must file a change request via
 *           /api/profile/change-requests.
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

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  try {
    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id },
      include: {
        department: {
          select: {
            id: true, code: true, name: true,
            manager: {
              select: {
                id: true, staffId: true, firstName: true, lastName: true, jobTitle: true,
              },
            },
            hub: {
              select: {
                id: true, code: true, name: true,
                manager: {
                  select: {
                    id: true, staffId: true, firstName: true, lastName: true, jobTitle: true,
                  },
                },
              },
            },
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
            team: {
              select: {
                id: true, code: true, name: true,
                manager: {
                  select: {
                    id: true, staffId: true, firstName: true, lastName: true, jobTitle: true,
                  },
                },
              },
            },
          },
        },
        // Org-chart side: things this employee manages. Each list capped
        // at 20 so a 200-person department doesn't bloat the payload.
        hubsManaged: {
          select: {
            id: true,
            departments: {
              select: {
                id: true,
                employees: {
                  where:   { status: 'ACTIVE', id: { not: id } },
                  take:    20,
                  select:  { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true },
                },
              },
            },
          },
        },
        deptsManaged: {
          select: {
            id: true,
            employees: {
              where:   { status: 'ACTIVE', id: { not: id } },
              take:    20,
              select:  { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true },
            },
          },
        },
        teamsLed: {
          select: {
            id: true,
            members: {
              where:   { employee: { status: 'ACTIVE', id: { not: id } } },
              take:    20,
              select: {
                employee: { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true } },
              },
            },
          },
        },
        // Active salary structure only — history moved to the extras
        // endpoint where it's lazy-loaded under the expandable list.
        salaryStructures: {
          where:   { isActive: true },
          take:    1,
          select: {
            id: true,
            isActive: true,
            effectiveDate: true,
            basicSalary: true,
            housingAllowance: true,
            transportAllowance: true,
            otherAllowances: true,
            currency: true,
            reason: true,
          },
        },
      },
    });

    const showCompliance   = canViewCompliance(session as any, employee.id);
    const showBanking      = canViewBanking(session as any, employee.id);
    const showCompensation = canViewCompensation(session as any, employee.id);
    const canEditBank      = canEditBanking(session as any);

    // Pending change requests for this employee — used by the alert
    // strip at the top of the modal, so it stays in core. Cheap query.
    const pendingChangeRequests = await prisma.profileChangeRequest.findMany({
      where:   { employeeId: id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take:    10,
      select: {
        id: true, field: true, currentValue: true, proposedValue: true,
        reason: true, createdAt: true,
        requestedBy: { select: { id: true, name: true } },
      },
    });

    // ── Org chart ──────────────────────────────────────────────────
    // Reports-to is the union of department manager + every team manager
    // for teams this employee is in. Hub manager only surfaces as a
    // fallback. Dedupe by id and tag each chip with the relationship.
    interface OrgChip {
      id:           string;
      staffId:      string;
      firstName:    string;
      lastName:     string;
      jobTitle:     string;
      relationship: string;
    }
    const reportsToMap = new Map<string, OrgChip>();
    const deptManager = employee.department?.manager;
    if (deptManager && deptManager.id !== id) {
      reportsToMap.set(deptManager.id, {
        ...deptManager,
        relationship: `Department · ${employee.department!.name}`,
      });
    }
    for (const tm of employee.teamMemberships) {
      const teamMgr = tm.team.manager;
      if (teamMgr && teamMgr.id !== id && !reportsToMap.has(teamMgr.id)) {
        reportsToMap.set(teamMgr.id, {
          ...teamMgr,
          relationship: `Team · ${tm.team.name}`,
        });
      }
    }
    const hubMgr = employee.department?.hub?.manager;
    if (reportsToMap.size === 0 && hubMgr && hubMgr.id !== id) {
      reportsToMap.set(hubMgr.id, {
        ...hubMgr,
        relationship: `Hub · ${employee.department!.hub!.name}`,
      });
    }

    const directReportsMap = new Map<string, OrgChip>();
    const addReport = (
      emp: { id: string; staffId: string; firstName: string; lastName: string; jobTitle: string },
      relationship: string,
    ) => {
      if (directReportsMap.has(emp.id)) return;
      directReportsMap.set(emp.id, { ...emp, relationship });
    };
    for (const d of employee.deptsManaged) {
      for (const e of d.employees) addReport(e, 'Department report');
    }
    for (const t of employee.teamsLed) {
      for (const m of t.members) addReport(m.employee, 'Team member');
    }
    for (const h of employee.hubsManaged) {
      for (const d of h.departments) {
        for (const e of d.employees) addReport(e, 'Hub report');
      }
    }

    const orgChart = {
      reportsTo:          Array.from(reportsToMap.values()).slice(0, 6),
      directReports:      Array.from(directReportsMap.values()).slice(0, 12),
      directReportsTotal: directReportsMap.size,
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
            bankAccountNumber: maskField(employee.bankAccountNumber),
          },

      // Active compensation summary. The history list moved to the
      // extras endpoint — modal renders the history toggle once that
      // request resolves.
      compensation: (() => {
        if (!showCompensation) return null;
        const active = employee.salaryStructures[0];
        if (!active) return null;
        const others = ((active.otherAllowances as Array<{ amount: number }> | null) ?? [])
          .reduce((sum, a) => sum + Number(a.amount), 0);
        const basic     = Number(active.basicSalary);
        const housing   = Number(active.housingAllowance);
        const transport = Number(active.transportAllowance);
        return {
          id:                 active.id,
          isActive:           active.isActive,
          effectiveDate:      active.effectiveDate,
          basicSalary:        basic,
          housingAllowance:   housing,
          transportAllowance: transport,
          otherAllowances:    others,
          grossMonthly:       basic + housing + transport + others,
          currency:           active.currency,
          reason:             active.reason,
        };
      })(),

      pendingChangeRequests,
      orgChart,

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
