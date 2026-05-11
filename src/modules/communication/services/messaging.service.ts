import prisma from "@/lib/prisma";
import { realtimeEmitter } from "@/lib/events/realtime.emitter";
import { 
  ConversationClassification, 
  MessageStatus, 
  MessageType,
  MessageMetadata,
  CommunicationEvent
} from "../domain/communication.types";

export class MessagingService {
  /**
   * Send a message in a conversation
   */
  static async sendMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
    type?: MessageType;
    metadata?: MessageMetadata;
    parentId?: string;
  }) {
    const { conversationId, senderId, content, type = MessageType.TEXT, metadata, parentId } = params;

    // 1. Persist Message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type,
        metadata: metadata as any,
        parentId,
        status: MessageStatus.SENT
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        conversation: {
          include: {
            members: true
          }
        }
      }
    });

    // 2. Update Conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // 3. Emit Realtime Events to all members except sender
    const event: CommunicationEvent = {
      type: 'MESSAGE_RECEIVED',
      payload: message,
      userId: '', // Placeholder
      timestamp: new Date()
    };

    message.conversation.members.forEach(member => {
      if (member.userId !== senderId) {
        realtimeEmitter.emitCommunication(member.userId, {
          ...event,
          userId: member.userId
        });
      }
    });

    return message;
  }

  /**
   * Update message status (DELIVERED, READ)
   */
  static async updateMessageStatus(messageId: string, userId: string, status: MessageStatus) {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { status },
      include: {
        conversation: {
          include: {
            members: true
          }
        }
      }
    });

    // Notify sender of status update
    realtimeEmitter.emitCommunication(message.senderId, {
      type: 'MESSAGE_STATUS_UPDATED',
      payload: { messageId, status, userId },
      userId: message.senderId,
      timestamp: new Date()
    });

    return message;
  }

  /**
   * Get conversation history with audit preservation
   */
  static async getHistory(conversationId: string, limit = 50, cursor?: string) {
    return prisma.message.findMany({
      where: { 
        conversationId,
        deletedAt: null // Preserve audit trail but hide from UI
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        },
        replies: {
          take: 5,
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Mark all messages in a conversation as read for a user
   */
  static async markAsRead(conversationId: string, userId: string) {
    await prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId, userId }
      },
      data: { lastReadAt: new Date() }
    });

    // Update message statuses for messages sent to this user
    // (Simplified: in a real app we might track read status per user per message)
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { not: MessageStatus.READ }
      },
      data: { status: MessageStatus.READ }
    });
  }
}
