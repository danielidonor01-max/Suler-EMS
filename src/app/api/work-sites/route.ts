import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/work-sites
 *
 *   GET  — list active sites (+inactive when ?includeInactive=true).
 *          Open to all authenticated users — the employee app needs
 *          the lat/lng for client-side distance estimates ("you are
 *          ~80m from Lagos HQ"). Sites are not sensitive data.
 *   POST — create. HR_ADMIN / SUPER_ADMIN or settings:manage only.
 */

const CreateSchema = z.object({
  name:         z.string().min(2).max(120),
  address:      z.string().max(300).optional().nullable(),
  lat:          z.number().min(-90).max(90),
  lng:          z.number().min(-180).max(180),
  radiusMeters: z.number().int().positive().max(10_000).default(150),
  hubId:        z.string().uuid().optional().nullable(),
});

function canManage(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  return (session.user.permissions ?? []).includes('settings:manage');
}

export const GET = withAuth(async (req) => {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const includeInactive = url.searchParams.get('includeInactive') === 'true';

  try {
    const sites = await prisma.workSite.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: {
        hub: { select: { id: true, name: true, code: true } },
      },
    });
    return successResponse(sites, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list sites';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!canManage(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / SUPER_ADMIN required', 403, correlationId);
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const created = await prisma.workSite.create({
      data: {
        name:         parsed.data.name,
        address:      parsed.data.address ?? null,
        lat:          parsed.data.lat,
        lng:          parsed.data.lng,
        radiusMeters: parsed.data.radiusMeters,
        hubId:        parsed.data.hubId ?? null,
      },
      include: {
        hub: { select: { id: true, name: true, code: true } },
      },
    });
    return successResponse(created, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create site';
    if (msg.includes('Unique constraint')) {
      return errorResponse('DUPLICATE_NAME', 'A site with that name already exists', 409, correlationId);
    }
    return errorResponse('CREATE_FAILED', msg, 500, correlationId);
  }
});
