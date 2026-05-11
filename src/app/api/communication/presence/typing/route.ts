import { withAuth } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { PresenceService } from "@/modules/communication/services/presence.service";

/**
 * POST /api/communication/presence/typing
 * Set typing indicator status
 */
export const POST = withAuth(async (req, session) => {
  try {
    const body = await req.json();
    const { conversationId, isTyping } = body;

    await PresenceService.setTyping({
      userId: session.user.id,
      userName: session.user.name,
      conversationId,
      isTyping
    });

    return successResponse({ success: true });
  } catch (err: any) {
    return errorResponse('PRESENCE_ERROR', err.message, 500);
  }
});
