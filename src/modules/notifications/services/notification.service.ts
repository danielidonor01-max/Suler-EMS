import prisma from "@/lib/prisma";
import { UUID } from "@/types/common";
import { Result } from "@/types/api";
import { NotificationModel } from "../domain/notification.model";

export class NotificationService {
  /**
   * Fetch notifications for a specific user (Read Model Preparation)
   */
  static async getForUser(
    userId: UUID, 
    options: { limit?: number; offset?: number; status?: string } = {}
  ): Promise<Result<NotificationModel[]>> {
    try {
      const { limit = 20, offset = 0, status } = options;

      const notifications = await prisma.notification.findMany({
        where: { 
          userId,
          ...(status ? { status } : {})
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return { success: true, data: notifications as unknown as NotificationModel[] };
    } catch (err: any) {
      return { success: false, error: { code: 'FETCH_ERROR', message: err.message } };
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: UUID): Promise<number> {
    return prisma.notification.count({
      where: { 
        userId, 
        status: { not: 'READ' } 
      }
    });
  }

  /**
   * Mark a notification as read (Lifecycle Transition)
   */
  static async markAsRead(notificationId: UUID): Promise<Result<boolean>> {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          status: 'READ',
          readAt: new Date()
        }
      });
      return { success: true, data: true };
    } catch (err: any) {
      return { success: false, error: { code: 'UPDATE_ERROR', message: err.message } };
    }
  }

  /**
   * Mark all as read for a user
   */
  static async markAllAsRead(userId: UUID): Promise<Result<boolean>> {
    try {
      await prisma.notification.updateMany({
        where: { 
          userId, 
          status: { in: ['PENDING', 'DELIVERED'] } 
        },
        data: { 
          status: 'READ',
          readAt: new Date()
        }
      });
      return { success: true, data: true };
    } catch (err: any) {
      return { success: false, error: { code: 'UPDATE_ERROR', message: err.message } };
    }
  }

  /**
   * Record Delivery (Lifecycle Transition)
   */
  static async markAsDelivered(notificationId: UUID): Promise<Result<boolean>> {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          status: 'DELIVERED',
          deliveredAt: new Date()
        }
      });
      return { success: true, data: true };
    } catch (err: any) {
      return { success: false, error: { code: 'UPDATE_ERROR', message: err.message } };
    }
  }
}

