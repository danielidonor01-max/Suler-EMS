import { withAuth } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { AnnouncementService } from "@/modules/communication/services/announcement.service";

/**
 * POST /api/communication/announcements/[id]/acknowledge
 * Acknowledge an announcement
 */
export const POST = withAuth(async (req, session, { params }) => {
  try {
    const { id } = params;
    const ack = await AnnouncementService.acknowledge(id, session.user.id);
    return successResponse(ack);
  } catch (err: any) {
    return errorResponse('ACK_ERROR', err.message, 500);
  }
});
