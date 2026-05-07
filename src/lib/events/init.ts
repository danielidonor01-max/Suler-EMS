import { NotificationDispatcher } from "@/modules/notifications/services/notification.dispatcher";
import { AnalyticsService } from "@/modules/analytics/services/analytics.service";
import { EventPublisher } from "./event.publisher";

/**
 * Initializes all event-driven infrastructure.
 */
export function initEventSystem() {
  if ((global as any)._eventSystemInitialized) return;
  
  NotificationDispatcher.init();
  AnalyticsService.init();

  // Register Analytics for event-driven metric tracking
  EventPublisher.subscribe(AnalyticsService.handleSystemEvent.bind(AnalyticsService));
  
  (global as any)._eventSystemInitialized = true;
  console.log('[EventSystem] Initialized successfully');
}
