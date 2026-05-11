import { withAuth } from "@/lib/api/with-auth";
import { NotificationService } from "@/modules/notifications/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-utils";

/**
 * Fetch notifications for current user
 * GET /api/notifications
 */
export const GET = withAuth(async (req, session) => {
  const result = await NotificationService.getForUser(session.user.id);
  
  if (!result.success) {
    return errorResponse('FETCH_ERROR', result.error.message, 500);
  }

  return successResponse(result.data);
});
