import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/teams/[id]/members — manage team membership.
 *
 *   POST — settings:manage. Add a member. Idempotent — adding a member
 *          twice is a no-op thanks to the (teamId, employeeId) uniqueness
 *          constraint.
 *
 * Per-membership delete in [employeeId]/route.ts.
 */

const AddSchema = z.object({
  employeeId: z.string().uuid(),
  role:       z.string().max(40).optional().nullable(),
});

function requireSettingsManage(perms: string[]): boolean {
  return perms.includes('settings:manage');
}

export const POST = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to manage team members', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    // upsert keyed on the composite unique gives idempotent add — second
    // call updates the role string and leaves joinedAt as the original.
    const membership = await prisma.teamMembership.upsert({
      where:  { teamId_employeeId: { teamId: id, employeeId: parsed.data.employeeId } },
      update: { role: parsed.data.role ?? null },
      create: {
        teamId:     id,
        employeeId: parsed.data.employeeId,
        role:       parsed.data.role ?? null,
      },
    });
    return successResponse(membership, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to add member';
    if (msg.includes('Foreign key')) {
      return errorResponse('BAD_REF', 'Team or employee does not exist', 400, correlationId);
    }
    return errorResponse('ADD_FAILED', msg, 500, correlationId);
  }
});
