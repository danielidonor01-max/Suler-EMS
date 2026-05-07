import { withAuth } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { MessagingService } from "@/modules/communication/services/messaging.service";

/**
 * GET /api/communication/conversations/[id]/messages
 * Get message history for a conversation
 */
export const GET = withAuth(async (req, session, { params }) => {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    const messages = await MessagingService.getHistory(id, limit, cursor);
    
    // Auto-mark as read when fetching history
    await MessagingService.markAsRead(id, session.user.id);

    return successResponse(messages);
  } catch (err: any) {
    return errorResponse('FETCH_ERROR', err.message, 500);
  }
});

/**
 * POST /api/communication/conversations/[id]/messages
 * Send a message to a conversation
 */
export const POST = withAuth(async (req, session, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const { content, type, metadata, parentId } = body;

    const message = await MessagingService.sendMessage({
      conversationId: id,
      senderId: session.user.id,
      content,
      type,
      metadata,
      parentId
    });

    return successResponse(message);
  } catch (err: any) {
    return errorResponse('SEND_ERROR', err.message, 500);
  }
});
