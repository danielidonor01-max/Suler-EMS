import prisma from "@/lib/prisma";
import { realtimeEmitter } from "@/lib/events/realtime.emitter";

/**
 * PresenceService
 * Handles lightweight user presence and typing indicators.
 */
export class PresenceService {
  /**
   * Update user presence and emit event
   */
  static async updatePresence(userId: string, status: 'ONLINE' | 'AWAY' | 'OFFLINE') {
    // 1. Update lastActive in DB (Audit & Analytics)
    if (status === 'ONLINE') {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() } // Using lastLoginAt as a proxy for lastActive for now
      });
    }

    // 2. Emit Realtime Event (Broadcast to relevant peers might be heavy, 
    // so we typically emit to people who have active conversations with this user)
    // For now, we'll emit to the user themselves (to sync tabs) and potentially 
    // we'd have a list of 'watchers' in a more advanced system.
    
    // Simplification: We'll emit a global presence event if needed, 
    // but for EMS, we mainly care about presence within active chats.
  }

  /**
   * Notify that a user is typing in a conversation
   */
  static async setTyping(params: {
    userId: string;
    userName: string;
    conversationId: string;
    isTyping: boolean;
  }) {
    const { userId, userName, conversationId, isTyping } = params;

    // 1. Get conversation members to notify
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: { select: { userId: true } } }
    });

    if (!conversation) return;

    // 2. Emit event to all other members
    conversation.members.forEach(member => {
      if (member.userId !== userId) {
        realtimeEmitter.emitCommunication(member.userId, {
          type: isTyping ? 'TYPING_STARTED' : 'TYPING_STOPPED',
          payload: { userId, userName, conversationId },
          userId: member.userId,
          timestamp: new Date()
        });
      }
    });
  }
}
