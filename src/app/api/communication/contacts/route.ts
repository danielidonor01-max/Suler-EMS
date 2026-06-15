import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/communication/contacts
 *
 * Returns the directory of message-able users for the calling account: every
 * active User except themselves, with the minimum data the DM picker needs
 * (id, name, email, role, optional employee summary).
 *
 * Permission: any authenticated user. Direct-messaging is a universal
 * employee capability — gating it would defeat the point.
 *
 * NOT to be used for governance / admin listings; those go through
 * /api/admin/users which requires role:manage and returns sensitive fields.
 */
export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        NOT: { id: session.user.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
        employee: {
          select: {
            staffId: true,
            jobTitle: true,
            branch: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 500,
    });
    return successResponse(users, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not load contacts';
    return errorResponse('CONTACTS_ERROR', msg, 500, correlationId);
  }
});
