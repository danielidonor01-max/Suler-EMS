import prisma from "@/lib/prisma";
import { realtimeEmitter } from "@/lib/events/realtime.emitter";
import { AnnouncementPriority } from "../domain/communication.types";

export class AnnouncementService {
  /**
   * Publish an announcement
   */
  static async publish(params: {
    title: string;
    content: string;
    category: 'GLOBAL' | 'DEPARTMENT' | 'ROLE';
    scopeId?: string;
    authorId: string;
    priority?: AnnouncementPriority;
    audience?: any;
    expiresAt?: Date;
  }) {
    const { title, content, category, scopeId, authorId, priority = AnnouncementPriority.NORMAL, audience, expiresAt } = params;

    // 1. Persist Announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        category,
        scopeId,
        authorId,
        priority,
        audience,
        expiresAt
      },
      include: {
        author: {
          select: { name: true }
        }
      }
    });

    // 2. Identify Target Users for realtime broadcast
    let targetUserIds: string[] = [];

    if (category === 'GLOBAL') {
      const allUsers = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
      targetUserIds = allUsers.map(u => u.id);
    } else if (category === 'DEPARTMENT' && scopeId) {
      const deptEmployees = await prisma.employee.findMany({
        where: { departmentId: scopeId },
        select: { user: { select: { id: true } } }
      });
      targetUserIds = deptEmployees.map(e => e.user?.id).filter((id): id is string => !!id);
    } else if (category === 'ROLE' && scopeId) {
      const roleUsers = await prisma.user.findMany({
        where: { roleId: scopeId, isActive: true },
        select: { id: true }
      });
      targetUserIds = roleUsers.map(u => u.id);
    }

    // 3. Emit Realtime Broadcast
    targetUserIds.forEach(userId => {
      realtimeEmitter.emitCommunication(userId, {
        type: 'ANNOUNCEMENT_PUBLISHED',
        payload: announcement,
        userId,
        timestamp: new Date()
      });
    });

    return announcement;
  }

  /**
   * Acknowledge an announcement
   */
  static async acknowledge(announcementId: string, userId: string) {
    return prisma.announcementAcknowledgment.upsert({
      where: {
        announcementId_userId: { announcementId, userId }
      },
      create: {
        announcementId,
        userId
      },
      update: {
        acknowledgedAt: new Date()
      }
    });
  }

  /**
   * Get active announcements for a user
   */
  static async getActiveForUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true }
    });

    if (!user) return [];

    const now = new Date();

    return prisma.announcement.findMany({
      where: {
        OR: [
          { category: 'GLOBAL' },
          { category: 'DEPARTMENT', scopeId: user.employee?.departmentId },
          { category: 'ROLE', scopeId: user.roleId }
        ],
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
        ]
      },
      include: {
        author: { select: { name: true } },
        acknowledgments: {
          where: { userId }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
