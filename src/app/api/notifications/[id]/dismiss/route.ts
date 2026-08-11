import { withAuth } from "@/lib/api/with-auth";
import { NotificationService } from "@/modules/notifications/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-utils";

/**
 * POST /api/notifications/[id]/dismiss
 *
 * Archive a notification so it stops appearing in the active feed. The
 * row stays in the DB for audit but drops out of the read-model unread
 * queries. Scoped to the calling user — updateMany with userId guard.
 */
export const POST = withAuth(async (_req, session, context) => {
  const { id } = (await context.params) as { id: string };
  if (!id) return errorResponse('MISSING_ID', 'Notification ID is required', 400);

  const result = await NotificationService.dismiss(id, session.user.id);
  if (!result.success) {
    const status = result.error.code === 'NOT_FOUND' ? 404 : 500;
    return errorResponse(result.error.code, result.error.message, status);
  }
  return successResponse(true);
});
