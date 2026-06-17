import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/leave/types — admin-managed catalogue of leave categories.
 *
 *   GET  — list every type. Any authenticated user (the leave-submission
 *          form reads from here to populate its type dropdown).
 *   POST — settings:manage. Create a new leave type with quota.
 *
 * Per-id update/delete in [id]/route.ts.
 */

const CreateSchema = z.object({
  code:        z.string().min(2).max(40).regex(/^[A-Z0-9_]+$/i, 'code must be alphanumeric + underscores'),
  name:        z.string().min(2).max(80),
  quotaDays:   z.coerce.number().int().min(0).max(365),
  description: z.string().max(500).optional().nullable(),
  color:       z.string().max(20).optional().nullable(),
  isActive:    z.boolean().optional(),
});

function requireSettingsManage(perms: string[]): boolean {
  return perms.includes('settings:manage');
}

// Canonical defaults — seeded on first GET if the catalogue is empty.
// HR can rename / re-quota / delete any of these afterwards; reaching an
// empty catalogue (everyone deleted) is the only way to trigger re-seed,
// so deliberate emptiness is rare and acceptable to recover from.
const DEFAULT_LEAVE_TYPES = [
  { code: 'ANNUAL',        name: 'Annual Leave',        quotaDays: 21, color: 'indigo', description: 'Annual recreational leave entitlement per employee.' },
  { code: 'SICK',          name: 'Sick Leave',          quotaDays: 14, color: 'rose',   description: 'Medical / illness-related absence days.' },
  { code: 'COMPASSIONATE', name: 'Compassionate Leave', quotaDays: 5,  color: 'amber',  description: 'Granted for bereavement or family emergencies.' },
  { code: 'MATERNITY',     name: 'Maternity Leave',     quotaDays: 90, color: 'pink',   description: '90-day maternity leave per Nigerian labour law.' },
  { code: 'PATERNITY',     name: 'Paternity Leave',     quotaDays: 14, color: 'sky',    description: '14-day paternity leave entitlement.' },
];

export const GET = withAuth(async (_req, _session) => {
  const correlationId = crypto.randomUUID();
  try {
    let types = await prisma.leaveType.findMany({
      orderBy: { code: 'asc' },
    });
    // Bootstrap the catalogue on first read so a fresh deploy doesn't
    // show an empty Leave Types tab. Skip if the table has been touched
    // (any row, even soft-deleted via isActive=false, prevents re-seed).
    if (types.length === 0) {
      await prisma.leaveType.createMany({
        data: DEFAULT_LEAVE_TYPES.map(t => ({ ...t, isActive: true })),
        skipDuplicates: true,
      });
      types = await prisma.leaveType.findMany({ orderBy: { code: 'asc' } });
    }
    return successResponse(types, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list leave types';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to create leave types', 403, correlationId);
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const created = await prisma.leaveType.create({
      data: {
        code:        parsed.data.code.toUpperCase(),
        name:        parsed.data.name,
        quotaDays:   parsed.data.quotaDays,
        description: parsed.data.description ?? null,
        color:       parsed.data.color ?? null,
        isActive:    parsed.data.isActive ?? true,
      },
    });
    return successResponse(created, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create leave type';
    if (msg.includes('Unique constraint')) {
      return errorResponse('DUPLICATE', 'A leave type with that code or name already exists', 409, correlationId);
    }
    return errorResponse('CREATE_FAILED', msg, 500, correlationId);
  }
});
