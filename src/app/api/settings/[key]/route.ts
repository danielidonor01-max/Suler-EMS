import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { DEFAULTS, clampValue, invalidate } from '@/lib/settings/service';

/**
 * PATCH /api/settings/[key]
 *
 * Updates a single setting's value. Validates against the declared
 * DEFAULTS catalogue so unknown keys are rejected with 400. Clamps
 * numeric ranges before persisting so a misbehaving client can't
 * stash minLength=9999 or idleTimeoutMinutes=0.
 *
 * Cache invalidation runs inline so the enforcement points pick up
 * the new value on the next request without waiting for the 30s TTL.
 *
 * Permission: SUPER_ADMIN or settings:manage.
 */

function canManageSettings(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('settings:manage');
}

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!canManageSettings(session as any)) {
    return errorResponse('FORBIDDEN', 'settings:manage required', 403, correlationId);
  }

  const { key } = (await context.params) as { key: string };
  const descriptor = DEFAULTS.find(d => d.key === key);
  if (!descriptor) {
    return errorResponse('UNKNOWN_KEY', `Setting "${key}" is not declared`, 400, correlationId);
  }

  let body: { value?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Expected JSON body { value: … }', 400, correlationId);
  }
  if (body.value === undefined) {
    return errorResponse('VALIDATION_ERROR', 'Missing `value` in body', 400, correlationId);
  }

  // Light typing — the JSON column accepts anything, but we cross-check
  // the value shape against the descriptor's defaultValue type so a
  // boolean toggle can't be set to a string and a number can't become
  // an object. Clamp numeric ranges via the service helper.
  const expected = typeof descriptor.defaultValue;
  const actual   = typeof body.value;
  if (expected !== actual) {
    return errorResponse(
      'TYPE_MISMATCH',
      `Setting "${key}" expects ${expected}; got ${actual}`,
      400,
      correlationId,
    );
  }

  const cleanValue = clampValue(key, body.value);

  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value:       cleanValue as any,
        updatedById: session.user.id,
      },
      create: {
        key,
        category:    descriptor.category,
        description: descriptor.description,
        value:       cleanValue as any,
        updatedById: session.user.id,
      },
      include: {
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    invalidate(key);

    return successResponse({
      key:       updated.key,
      category:  updated.category,
      description: updated.description,
      value:     updated.value,
      isDefault: false,
      updatedAt: updated.updatedAt,
      updatedBy: updated.updatedBy,
    }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update setting';
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});
