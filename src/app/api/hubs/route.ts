import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/hubs — organizational hubs (Lagos, Abuja, Port Harcourt, …).
 *
 *   GET  — list every hub with derived counts (departments + staff).
 *          Read access for any authenticated user. The hub list drives
 *          the global hub switcher in the header, the org chart, and
 *          the filter scope on the workforce / payroll / finance pages.
 *
 *   POST — create a new hub. Requires settings:manage (SUPER_ADMIN +
 *          anyone explicitly granted that permission). The UI surface
 *          for this lives at /admin/organization.
 *
 * Per-id update + delete live in [id]/route.ts.
 */

const CreateSchema = z.object({
  code:       z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/i, 'code must be alphanumeric + dashes'),
  name:       z.string().min(2).max(80),
  geography:  z.string().min(2).max(120),
  category:   z.string().min(2).max(60),
  status:     z.enum(['ACTIVE', 'INITIALIZING', 'INACTIVE']).optional(),
  managerId:  z.string().uuid().optional().nullable(),
});

function requireSettingsManage(perms: string[]): boolean {
  return perms.includes('settings:manage');
}

export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  try {
    const rows = await prisma.hub.findMany({
      orderBy: { code: 'asc' },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
        _count:  { select: { departments: true } },
      },
    });

    // Staff count is derived from Employee.branch (string) since we haven't
    // migrated branch → hubId yet. Roll up once and join in memory.
    const branchCounts = await prisma.employee.groupBy({
      by: ['branch'],
      where: { status: 'ACTIVE' },
      _count: { branch: true },
    });
    const staffByBranch = Object.fromEntries(
      branchCounts.map(b => [b.branch ?? '', b._count.branch]),
    );

    const data = rows.map(h => ({
      id:         h.id,
      code:       h.code,
      name:       h.name,
      geography:  h.geography,
      category:   h.category,
      status:     h.status,
      manager:    h.manager
        ? { id: h.manager.id, name: `${h.manager.firstName} ${h.manager.lastName}`, jobTitle: h.manager.jobTitle }
        : null,
      managerId:    h.managerId,
      departments:  h._count.departments,
      staff:        staffByBranch[h.name] ?? 0,
      createdAt:    h.createdAt,
      updatedAt:    h.updatedAt,
    }));

    return successResponse(data, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list hubs';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to create hubs', 403, correlationId);
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const hub = await prisma.hub.create({
      data: {
        code:      parsed.data.code.toUpperCase(),
        name:      parsed.data.name,
        geography: parsed.data.geography,
        category:  parsed.data.category,
        status:    parsed.data.status ?? 'ACTIVE',
        managerId: parsed.data.managerId ?? null,
      },
    });
    return successResponse(hub, correlationId, 201);
  } catch (err) {
    // Surface unique-constraint violations distinctly so the UI can show
    // "code/name already exists" instead of a generic error.
    const msg = err instanceof Error ? err.message : 'Failed to create hub';
    if (msg.includes('Unique constraint')) {
      return errorResponse('DUPLICATE', 'A hub with that code or name already exists', 409, correlationId);
    }
    return errorResponse('CREATE_FAILED', msg, 500, correlationId);
  }
});
