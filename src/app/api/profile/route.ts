import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/profile — current user's profile data + safe editable fields.
 *
 *   GET    — read identity + employee record + role + permission list
 *   PATCH  — update phone (only editable field for the user themselves).
 *            Name / role / staffId / department changes go through admin
 *            flows so they require role:manage.
 */

const PatchSchema = z.object({
  phone: z.string().max(40).optional().nullable(),
});

export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  try {
    const me = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        version: true,
        lastLoginAt: true,
        role: { select: { id: true, name: true, permissions: { select: { code: true, name: true } } } },
        employee: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            branch: true,
            phone: true,
            grade: true,
            createdAt: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    return successResponse(me, correlationId);
  } catch (err) {
    return errorResponse('NOT_FOUND', err instanceof Error ? err.message : 'Profile not found', 404, correlationId);
  }
});

export const PATCH = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  if (!me?.employeeId) {
    return errorResponse('NO_EMPLOYEE', 'Profile is not linked to an employee record', 400, correlationId);
  }

  if (parsed.data.phone !== undefined) {
    await prisma.employee.update({
      where: { id: me.employeeId },
      data: { phone: parsed.data.phone ?? null },
    });
  }

  // Return the refreshed profile so the client can update in place.
  const refreshed = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true,
      role: { select: { name: true } },
      employee: {
        select: {
          staffId: true, firstName: true, lastName: true, jobTitle: true,
          branch: true, phone: true,
          department: { select: { name: true } },
        },
      },
    },
  });
  return successResponse(refreshed, correlationId);
});
