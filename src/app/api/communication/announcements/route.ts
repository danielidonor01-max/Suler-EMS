import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { AnnouncementService } from '@/modules/communication/services/announcement.service';
import { AnnouncementPriority } from '@/modules/communication/domain/communication.types';

const PublishSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(2).max(5_000),
  category: z.enum(['GLOBAL', 'DEPARTMENT', 'ROLE']),
  scopeId: z.string().optional(),
  priority: z.enum(['NORMAL', 'URGENT']).optional(),
  expiresAt: z.coerce.date().optional(),
});

/**
 * GET /api/communication/announcements — list active announcements for the
 * authenticated user (gated by their role + department).
 */
export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  try {
    const announcements = await AnnouncementService.getActiveForUser(session.user.id);
    return successResponse(announcements, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fetch failed';
    return errorResponse('FETCH_ERROR', msg, 500, correlationId);
  }
});

/**
 * POST /api/communication/announcements — publish a broadcast.
 *
 * Requires `communication:broadcast` permission (seeded to SUPER_ADMIN,
 * HR_ADMIN, FINANCE_MANAGER by default; can be granted to any custom role
 * via /admin/roles). Previously this endpoint had a TODO comment in place
 * of an actual check, so any authenticated user could publish — a real
 * security gap fixed here.
 *
 * Every publish writes a SecurityEvent so the audit registry shows who
 * broadcast what, when.
 */
export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  const permissions = (session.user.permissions ?? []) as string[];
  const allowed =
    permissions.includes('communication:broadcast')
    || session.user.role === 'SUPER_ADMIN';
  if (!allowed) {
    // Log the denied attempt for audit visibility.
    try {
      await prisma.securityEvent.create({
        data: {
          type: 'PERMISSION_DENIED',
          description: `[BROADCAST] Denied: ${session.user.email ?? session.user.id} attempted to publish without communication:broadcast`,
          userId: session.user.id,
          metadata: { route: '/api/communication/announcements', method: 'POST' },
        },
      });
    } catch { /* best-effort audit */ }
    return errorResponse(
      'BROADCAST_DENIED',
      'communication:broadcast permission required to publish announcements.',
      403,
      correlationId,
    );
  }

  const body = await req.json();
  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const announcement = await AnnouncementService.publish({
      ...parsed.data,
      priority: parsed.data.priority as AnnouncementPriority | undefined,
      authorId: session.user.id,
    });

    // Success audit — visible in /governance.
    try {
      await prisma.securityEvent.create({
        data: {
          type: 'PERMISSION_DENIED', // closest existing type; details in description
          description: `[BROADCAST] ${session.user.name ?? session.user.email} published "${parsed.data.title}" (${parsed.data.category})`,
          userId: session.user.id,
          metadata: {
            event: 'BROADCAST_PUBLISHED',
            announcementId: announcement.id,
            category: parsed.data.category,
            scopeId: parsed.data.scopeId,
          },
        },
      });
    } catch { /* best-effort */ }

    return successResponse(announcement, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Publish failed';
    return errorResponse('PUBLISH_ERROR', msg, 500, correlationId);
  }
});
