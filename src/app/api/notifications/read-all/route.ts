import { withAuth } from "@/lib/api/with-auth";
import { NotificationService } from "@/modules/notifications/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-utils";

/**
 * Mark all notifications as read
 * POST /api/notifications/read-all
 */
export const POST = withAuth(async (req, session) => {
  const result = await NotificationService.markAllAsRead(session.user.id);
  
  if (!result.success) {
    return errorResponse('UPDATE_ERROR', result.error.message, 500);
  }

  return successResponse(true);
});
