import { SystemEventContract } from "@/modules/notifications/domain/notification.model";
import { EventPublisher } from "@/lib/events/event.publisher";
import { realtimeEmitter } from "@/lib/events/realtime.emitter";
import { NotificationTemplates } from "../templates/notification.templates";

/**
 * Notification Dispatcher
 * Business logic for converting SystemEvents into User Notifications.
 */
export class NotificationDispatcher {
  static init() {
    EventPublisher.subscribe(this.dispatch.bind(this));
    console.log('[NotificationDispatcher] Initialized and subscribed to events');
  }

  private static async dispatch(event: SystemEventContract) {
    switch (event.type) {
      case 'LEAVE_REQUESTED_EVENT':
        await this.handleLeaveRequested(event);
        break;
      case 'LEAVE_APPROVED_EVENT':
      case 'LEAVE_REJECTED_EVENT':
        await this.handleWorkflowUpdate(event);
        break;
      case 'SECURITY_AUTH_FAILURE_EVENT':
        await this.handleSecurityAlert(event);
        break;
    }
  }

  private static async handleLeaveRequested(event: SystemEventContract) {
    const { default: prisma } = await import("@/lib/prisma");
    const template = NotificationTemplates[event.type];
    
    const requester = await prisma.employee.findUnique({
      where: { id: event.actorId },
      include: { department: true }
    });

    if (!requester?.department.managerId) return;

    const managerUser = await prisma.user.findUnique({
      where: { employeeId: requester.department.managerId }
    });

    if (!managerUser) return;

    const notification = await prisma.notification.create({
      data: {
        userId: managerUser.id,
        title: template.title(event.payload),
        message: template.message(event.payload),
        type: 'ACTION',
        category: 'WORKFLOW',
        priority: 'HIGH',
        status: 'PENDING',
        resourceId: event.resourceId,
        resourceType: event.resourceType,
        metadata: { eventId: event.eventId, correlationId: event.correlationId }
      }
    });

    realtimeEmitter.emitNotification(managerUser.id, notification);
  }

  private static async handleWorkflowUpdate(event: SystemEventContract) {
    const { default: prisma } = await import("@/lib/prisma");
    const template = NotificationTemplates[event.type];
    const { requesterId } = event.payload;

    const requesterUser = await prisma.user.findUnique({
      where: { employeeId: requesterId }
    });

    if (!requesterUser) return;

    const notification = await prisma.notification.create({
      data: {
        userId: requesterUser.id,
        title: template.title(event.payload),
        message: template.message(event.payload),
        type: event.type === 'LEAVE_APPROVED_EVENT' ? 'SUCCESS' : 'WARNING',
        category: 'WORKFLOW',
        priority: 'NORMAL',
        status: 'PENDING',
        resourceId: event.resourceId,
        resourceType: event.resourceType,
        metadata: { eventId: event.eventId, correlationId: event.correlationId }
      }
    });

    realtimeEmitter.emitNotification(requesterUser.id, notification);
  }

  private static async handleSecurityAlert(event: SystemEventContract) {
    const { default: prisma } = await import("@/lib/prisma");
    const template = NotificationTemplates[event.type];
    const admins = await prisma.user.findMany({
      where: { role: { name: 'SUPER_ADMIN' } }
    });

    for (const admin of admins) {
      const notification = await prisma.notification.create({
        data: {
          userId: admin.id,
          title: template.title(event.payload),
          message: template.message(event.payload),
          type: 'WARNING',
          category: 'SECURITY',
          priority: 'URGENT',
          status: 'PENDING',
          metadata: { eventId: event.eventId, correlationId: event.correlationId }
        }
      });

      realtimeEmitter.emitNotification(admin.id, notification);
    }
  }
}

