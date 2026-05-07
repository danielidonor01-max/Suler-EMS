import prisma from "@/lib/prisma";
import { AggregationService } from "./aggregation.service";
import { AnalyticsSnapshotModel, AnalyticsGranularity } from "../domain/analytics.model";
import { SystemEventContract } from "@/modules/notifications/domain/notification.model";
import { UUID } from "@/types/common";
import { Result } from "@/types/api";

/**
 * Analytics Service
 * Orchestrates snapshots, read-models, and event-driven intelligence.
 */
export class AnalyticsService {
  private static CALCULATION_VERSION = "1.0";

  static init() {
    // Subscribe to events that should trigger a metric refresh
    // We don't recompute everything on every event, but we can mark things as stale
    console.log('[AnalyticsService] Initialized');
  }

  /**
   * Get Dashboard Analytics (Read-Optimized)
   */
  static async getDashboardSnapshot(userId: string): Promise<Result<any>> {
    try {
      // 1. Try to get the latest Daily snapshot
      const latestSnapshot = await prisma.analyticsSnapshot.findFirst({
        where: { granularity: 'DAILY' },
        orderBy: { timestamp: 'desc' }
      });

      // 2. If no snapshot or it's old (> 1 hour), compute on the fly (or return stale + trigger refresh)
      if (latestSnapshot) {
        return { success: true, data: latestSnapshot.data };
      }

      // 3. Fallback: Compute and return (initial setup)
      const data = await this.generateFullSnapshot('DAILY');
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: { code: 'ANALYTICS_ERROR', message: err.message } };
    }
  }

  /**
   * Generate and persist a new snapshot
   */
  static async generateFullSnapshot(granularity: AnalyticsGranularity = 'DAILY'): Promise<any> {
    const workforce = await AggregationService.computeWorkforceKPIs();
    const compliance = await AggregationService.computeAttendanceCompliance(new Date());
    const bottlenecks = await AggregationService.getWorkflowBottlenecks();
    const insights = await AggregationService.generateInsights();

    const snapshotData = {
      workforce,
      attendance: { compliance },
      bottlenecks,
      insights,
      computedAt: new Date().toISOString()
    };

    const snapshot = await prisma.analyticsSnapshot.create({
      data: {
        type: 'DASHBOARD_OVERVIEW',
        granularity,
        calculationVersion: this.CALCULATION_VERSION,
        data: snapshotData as any,
        timestamp: new Date()
      }
    });

    // --- Intelligence Evolution (Phase 11) ---
    // Trigger forecasting and anomaly pipelines after snapshot persistence
    try {
      const { ForecastingService } = await import("@/modules/forecasting/services/forecasting.service");
      const { AnomalyService } = await import("@/modules/forecasting/services/anomaly.service");
      const { RecommendationService } = await import("@/modules/forecasting/services/recommendation.service");

      await Promise.all([
        ForecastingService.createSnapshot('WORKFORCE_PROJECTION', snapshotData.workforce),
        AnomalyService.scanForAnomalies(),
        RecommendationService.generateRecommendations()
      ]);
      console.log('[AnalyticsService] Intelligence pipelines triggered');
    } catch (err) {
      console.error('[AnalyticsService] Intelligence trigger failed', err);
    }

    return snapshotData;
  }

  /**
   * Handle incoming system events to update immutable metrics
   */
  static async handleSystemEvent(event: SystemEventContract) {
    if (event.type === 'LEAVE_APPROVED_EVENT' || event.type === 'LEAVE_REJECTED_EVENT') {
      // Record immutable workflow fact
      const requestDate = new Date(event.payload.createdAt || event.timestamp);
      const completionDate = new Date();
      const diffMs = completionDate.getTime() - requestDate.getTime();
      const turnaroundMinutes = Math.floor(diffMs / (1000 * 60));

      await prisma.workflowMetric.create({
        data: {
          workflowId: event.correlationId || crypto.randomUUID(),
          resourceId: event.resourceId!,
          type: 'LEAVE',
          requestDate,
          completionDate,
          turnaroundMinutes,
          status: event.type === 'LEAVE_APPROVED_EVENT' ? 'COMPLETED' : 'REJECTED',
          actorId: event.actorId
        }
      });
    }
  }
}
