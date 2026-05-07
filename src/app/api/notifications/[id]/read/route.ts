import { withAuth } from "@/lib/api/with-auth";
import { NotificationService } from "@/modules/notifications/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-utils";

/**
 * Mark notification as read
 * POST /api/notifications/[id]/read
 */
export const POST = withAuth(async (req, session) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 2]; // Extract [id] from /api/notifications/[id]/read

  if (!id) return errorResponse('MISSING_ID', 'Notification ID is required', 400);

  const result = await NotificationService.markAsRead(id);
  
  if (!result.success) {
    return errorResponse('UPDATE_ERROR', result.error.message, 500);
  }

  return successResponse(true);
});
