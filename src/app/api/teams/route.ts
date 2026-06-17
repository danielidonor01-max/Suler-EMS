import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/teams — operational units (Lagos Ops, Treasury & Disbursement, …).
 *
 *   GET  — list with nested manager + hub + department + member count.
 *          Any authenticated user.
 *   POST — settings:manage. Create a team with optional initial members
 *          payload — the join-table rows are inserted in the same
 *          transaction so a half-created team can't exist.
 */

const MemberInputSchema = z.object({
  employeeId: z.string().uuid(),
  role:       z.string().max(40).optional().nullable(),
});

const CreateSchema = z.object({
  code:         z.string().min(2).max(40).regex(/^[A-Z0-9-]+$/i),
  name:         z.string().min(2).max(120),
  description:  z.string().max(500).optional().nullable(),
  hubId:        z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  managerId:    z.string().uuid().optional().nullable(),
  members:      z.array(MemberInputSchema).optional(),
});

function requireSettingsManage(perms: string[]): boolean {
  return perms.includes('settings:manage');
}

export const GET = withAuth(async (_req, _session) => {
  const correlationId = crypto.randomUUID();
  try {
    const rows = await prisma.team.findMany({
      orderBy: { code: 'asc' },
      include: {
        manager:    { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
        hub:        { select: { id: true, code: true, name: true } },
        department: { select: { id: true, code: true, name: true } },
        members: {
          select: {
            id: true, role: true, joinedAt: true,
            employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, staffId: true } },
          },
        },
      },
    });

    const data = rows.map(t => ({
      id:          t.id,
      code:        t.code,
      name:        t.name,
      description: t.description,
      status:      t.status,
      hub:         t.hub,
      hubId:       t.hubId,
      department:  t.department,
      departmentId: t.departmentId,
      manager:     t.manager
        ? { id: t.manager.id, name: `${t.manager.firstName} ${t.manager.lastName}`, jobTitle: t.manager.jobTitle }
        : null,
      managerId:   t.managerId,
      members:     t.members.map(m => ({
        membershipId: m.id,
        role:         m.role,
        joinedAt:     m.joinedAt,
        employee: {
          id:       m.employee.id,
          name:     `${m.employee.firstName} ${m.employee.lastName}`,
          staffId:  m.employee.staffId,
          jobTitle: m.employee.jobTitle,
        },
      })),
      memberCount: t.members.length,
      createdAt:   t.createdAt,
      updatedAt:   t.updatedAt,
    }));

    return successResponse(data, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list teams';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to create teams', 403, correlationId);
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  const { members = [], ...teamData } = parsed.data;

  try {
    // Single transaction so a team without its memberships never exists.
    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          code:         teamData.code.toUpperCase(),
          name:         teamData.name,
          description:  teamData.description ?? null,
          hubId:        teamData.hubId ?? null,
          departmentId: teamData.departmentId ?? null,
          managerId:    teamData.managerId ?? null,
          status:       'ACTIVE',
        },
      });
      if (members.length > 0) {
        await tx.teamMembership.createMany({
          data: members.map(m => ({
            teamId:     created.id,
            employeeId: m.employeeId,
            role:       m.role ?? null,
          })),
          skipDuplicates: true,
        });
      }
      return created;
    });
    return successResponse(team, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create team';
    if (msg.includes('Unique constraint')) {
      return errorResponse('DUPLICATE', 'A team with that code already exists', 409, correlationId);
    }
    return errorResponse('CREATE_FAILED', msg, 500, correlationId);
  }
});
