import { withAuth } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { MessagingService } from "@/modules/communication/services/messaging.service";

/**
 * GET /api/communication/conversations/[id]/messages?limit=50&cursor=...
 *
 * Returns messages in UI-ready shape (senderId + senderName flattened off the
 * nested sender relation). Auto-marks the conversation as read for the caller.
 * Messages are returned newest-first by the service — the client reverses for
 * display order.
 */
export const GET = withAuth(async (req, session, context) => {
  try {
    const { id } = (await context.params) as { id: string };
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const raw = await MessagingService.getHistory(id, limit, cursor);
    await MessagingService.markAsRead(id, session.user.id);

    const items = raw.map((m: any) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.sender?.name ?? 'Unknown',
      content: m.content,
      type: m.type,
      status: m.status,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
      readBy: [], // Per-user read tracking not wired yet; preserve field for context compat.
      parentId: m.parentId,
    }));

    return successResponse(items);
  } catch (err: any) {
    return errorResponse('FETCH_ERROR', err.message, 500);
  }
});

/**
 * POST /api/communication/conversations/[id]/messages
 * Body: { content, type?, metadata?, parentId? }
 */
export const POST = withAuth(async (req, session, context) => {
  try {
    const { id } = (await context.params) as { id: string };
    const body = await req.json();
    const { content, type, metadata, parentId } = body;

    if (typeof content !== 'string' || content.trim().length === 0) {
      return errorResponse('INVALID_INPUT', 'content is required', 400);
    }

    const message = await MessagingService.sendMessage({
      conversationId: id,
      senderId: session.user.id,
      content: content.trim(),
      type,
      metadata,
      parentId,
    });

    // Return the UI-shaped message so the caller can append optimistically.
    return successResponse({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender?.name ?? session.user.name ?? 'Unknown',
      content: message.content,
      type: message.type,
      status: message.status,
      createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
      readBy: [],
      parentId: message.parentId,
    });
  } catch (err: any) {
    return errorResponse('SEND_ERROR', err.message, 500);
  }
});
