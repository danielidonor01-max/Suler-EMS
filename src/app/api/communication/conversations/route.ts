import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { ChannelService } from "@/modules/communication/services/channel.service";

/**
 * GET /api/communication/conversations
 *
 * Returns the calling user's conversations in the UI-ready shape consumed by
 * CommunicationContext. The transform is route-local so services stay raw.
 *
 *   {
 *     id, type ('DM' | 'GROUP' | 'BROADCAST'),
 *     title (resolved against current user for DMs),
 *     participants: [userIds],
 *     lastMessage, lastMessageAt,
 *     unreadCount, scope
 *   }
 */
export const GET = withAuth(async (req, session) => {
  try {
    const raw = await ChannelService.getUserConversations(session.user.id);

    // Bulk-fetch unread counts so we don't N+1 the inbox list.
    const memberRows = raw.length
      ? await prisma.conversationMember.findMany({
          where: { userId: session.user.id, conversationId: { in: raw.map(c => c.id) } },
          select: { conversationId: true, lastReadAt: true },
        })
      : [];
    const lastReadByConv = new Map(memberRows.map(m => [m.conversationId, m.lastReadAt]));

    const unreadCounts = await Promise.all(
      raw.map(async (c) => {
        const lastRead = lastReadByConv.get(c.id);
        const count = await prisma.message.count({
          where: {
            conversationId: c.id,
            deletedAt: null,
            senderId: { not: session.user.id },
            ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
          },
        });
        return [c.id, count] as const;
      }),
    );
    const unreadById = new Map(unreadCounts);

    const items = raw.map((c: any) => {
      const otherMember = c.classification === 'DIRECT'
        ? c.members.find((m: any) => m.userId !== session.user.id)
        : null;

      const uiType: 'DM' | 'GROUP' | 'BROADCAST' =
        c.classification === 'DIRECT' ? 'DM' : 'GROUP';

      const title =
        uiType === 'DM'
          ? (otherMember?.user?.name ?? 'Direct Message')
          : (c.name ?? 'Group Channel');

      const lastMsg = c.messages?.[0];

      return {
        id: c.id,
        type: uiType,
        title,
        participants: c.members.map((m: any) => m.userId),
        lastMessage: lastMsg?.content,
        lastMessageAt: c.lastMessageAt?.toISOString() ?? lastMsg?.createdAt?.toISOString(),
        unreadCount: unreadById.get(c.id) ?? 0,
        scope: c.classification === 'DEPARTMENT' ? 'DEPARTMENT' : c.classification === 'WORKFLOW' ? 'TEAM' : undefined,
        classification: c.classification, // pass-through for advanced UI
      };
    });

    return successResponse(items);
  } catch (err: any) {
    return errorResponse('FETCH_ERROR', err.message, 500);
  }
});

/**
 * POST /api/communication/conversations
 * Body: { type: 'DM' | 'DEPARTMENT' | 'WORKFLOW', targetId?, name?, participantIds? }
 */
export const POST = withAuth(async (req, session) => {
  try {
    const body = await req.json();
    const { type, targetId } = body;

    if (type === 'DM') {
      if (!targetId) return errorResponse('INVALID_INPUT', 'targetId is required for DM', 400);
      const conversation = await ChannelService.getOrCreateDM(session.user.id, targetId);
      return successResponse(conversation);
    }

    if (type === 'DEPARTMENT') {
      const conversation = await ChannelService.syncDepartmentChannel(targetId);
      return successResponse(conversation);
    }

    if (type === 'WORKFLOW') {
      const { resourceId, resourceType, name, participantIds } = body;
      const conversation = await ChannelService.createWorkflowDiscussion({
        resourceId,
        resourceType,
        name,
        participantIds: participantIds || [session.user.id],
      });
      return successResponse(conversation);
    }

    return errorResponse('INVALID_TYPE', 'Invalid conversation type', 400);
  } catch (err: any) {
    return errorResponse('CREATE_ERROR', err.message, 500);
  }
});
