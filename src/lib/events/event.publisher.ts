import prisma from "@/lib/prisma";
import { SystemEventContract } from "@/modules/notifications/domain/notification.model";

type EventSubscriber = (event: SystemEventContract) => Promise<void>;

/**
 * Enterprise Event Publisher
 * Decouples domain logic from notification/audit side-effects.
 */
export class EventPublisher {
  private static subscribers: EventSubscriber[] = [];

  /**
   * Register a subscriber (e.g. NotificationDispatcher)
   */
  static subscribe(subscriber: EventSubscriber) {
    this.subscribers.push(subscriber);
  }

  /**
   * Publish a system event
   * - Records to SystemEvent table for audit trail
   * - Notifies all subscribers
   */
  static async publish(event: SystemEventContract) {
    const correlationId = event.correlationId || crypto.randomUUID();

    try {
      // 1. Persist Event (Audit-aware)
      await prisma.systemEvent.create({
        data: {
          type: event.type,
          source: event.source,
          actorId: event.actorId,
          resourceId: event.resourceId,
          resourceType: event.resourceType,
          payload: event.payload as any,
          correlationId: correlationId
        }
      });

      // 2. Notify Subscribers (Async)
      // We don't await this to keep the source transaction fast
      this.subscribers.forEach(sub => {
        sub({ ...event, correlationId }).catch(err => {
          console.error(`[EventPublisher] Subscriber failed:`, err);
        });
      });

    } catch (err) {
      console.error(`[EventPublisher] Failed to publish event:`, err);
    }
  }
}
