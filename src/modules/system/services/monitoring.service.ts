import { log } from "@/lib/observability/logger";

export class MonitoringService {
  /**
   * Track the latency of an operation (SLA monitoring)
   */
  static async trackLatency<T>(
    metricName: string, 
    operation: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const end = performance.now();
      const duration = end - start;
      
      log.sla(metricName, duration, { ...metadata, success: true });
      
      return result;
    } catch (err: any) {
      const end = performance.now();
      const duration = end - start;
      
      log.sla(metricName, duration, { ...metadata, success: false, error: err.message });
      throw err;
    }
  }

  /**
   * Report health of a background sync process
   */
  static async reportSyncHealth(processName: string, stats: { 
    processed: number; 
    failed: number; 
    latencyMs: number 
  }) {
    log.info(`[SYNC_HEALTH] ${processName}`, { stats });
  }

  /**
   * Track SSE Connection Storms / Governance
   */
  static trackSSEConnection(userId: string, action: 'CONNECTED' | 'DISCONNECTED') {
    log.info(`[SSE_GOVERNANCE] ${userId} ${action}`, { userId, action });
  }
}
