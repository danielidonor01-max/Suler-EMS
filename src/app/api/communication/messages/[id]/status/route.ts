import { withAuth } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { MessagingService } from "@/modules/communication/services/messaging.service";
import { MessageStatus } from "@/modules/communication/domain/communication.types";

/**
 * PATCH /api/communication/messages/[id]/status
 * Update message delivery/read status
 */
export const PATCH = withAuth(async (req, session, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const { status } = body;

    if (!Object.values(MessageStatus).includes(status)) {
      return errorResponse('INVALID_STATUS', 'Invalid message status', 400);
    }

    const message = await MessagingService.updateMessageStatus(id, session.user.id, status as MessageStatus);
    return successResponse(message);
  } catch (err: any) {
    return errorResponse('UPDATE_ERROR', err.message, 500);
  }
});
