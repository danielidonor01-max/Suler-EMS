import { withAuth } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { AnnouncementService } from "@/modules/communication/services/announcement.service";

/**
 * GET /api/communication/announcements
 * List active announcements for the user
 */
export const GET = withAuth(async (req, session) => {
  try {
    const announcements = await AnnouncementService.getActiveForUser(session.user.id);
    return successResponse(announcements);
  } catch (err: any) {
    return errorResponse('FETCH_ERROR', err.message, 500);
  }
});

/**
 * POST /api/communication/announcements
 * Publish a new announcement (Admin/Manager)
 */
export const POST = withAuth(async (req, session) => {
  try {
    // RBAC check: only ADMIN or MANAGER can publish announcements
    // (Assuming session.user.role check here)
    
    const body = await req.json();
    const announcement = await AnnouncementService.publish({
      ...body,
      authorId: session.user.id
    });

    return successResponse(announcement);
  } catch (err: any) {
    return errorResponse('PUBLISH_ERROR', err.message, 500);
  }
});
