import { withAuth } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { ChannelService } from "@/modules/communication/services/channel.service";

/**
 * GET /api/communication/conversations
 * List all conversations for the authenticated user
 */
export const GET = withAuth(async (req, session) => {
  try {
    const conversations = await ChannelService.getUserConversations(session.user.id);
    return successResponse(conversations);
  } catch (err: any) {
    return errorResponse('FETCH_ERROR', err.message, 500);
  }
});

/**
 * POST /api/communication/conversations
 * Create a new DM or sync department channel
 */
export const POST = withAuth(async (req, session) => {
  try {
    const body = await req.json();
    const { type, targetId } = body;

    if (type === 'DM') {
      const conversation = await ChannelService.getOrCreateDM(session.user.id, targetId);
      return successResponse(conversation);
    }

    if (type === 'DEPARTMENT') {
      const conversation = await ChannelService.syncDepartmentChannel(targetId);
      return successResponse(conversation);
    }

    if (type === 'WORKFLOW') {
      const { resourceId, resourceType, name, participantIds } = body;
      // If participantIds not provided, default to current user
      const conversation = await ChannelService.createWorkflowDiscussion({
        resourceId,
        resourceType,
        name,
        participantIds: participantIds || [session.user.id]
      });
      return successResponse(conversation);
    }

    return errorResponse('INVALID_TYPE', 'Invalid conversation type', 400);
  } catch (err: any) {
    return errorResponse('CREATE_ERROR', err.message, 500);
  }
});
