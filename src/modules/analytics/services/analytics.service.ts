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
  // Bump when the snapshot shape changes — older snapshots are skipped so
  // the cache can't serve a payload the consumer can't render. 2.0 adds
  // `trends` + `kpiAchievement` and removes Math.random() inputs.
  private static CALCULATION_VERSION = "2.0";
  // How long a cached snapshot is reused before we recompute. One hour
  // matches the daily-snapshot model — fresh enough for an exec view,
  // long enough to avoid hammering the DB on every page hit.
  private static SNAPSHOT_TTL_MS = 60 * 60 * 1000;

  static init() {
    // Subscribe to events that should trigger a metric refresh
    // We don't recompute everything on every event, but we can mark things as stale
    console.log('[AnalyticsService] Initialized');
  }

  /**
   * Get Dashboard Analytics (Read-Optimized)
   */
  static async getDashboardSnapshot(_userId: string, opts: { forceRefresh?: boolean } = {}): Promise<Result<any>> {
    const { default: prisma } = await import("@/lib/prisma");
    try {
      // 1. Latest DAILY snapshot, *of the current calculation version*. A
      //    snapshot produced before a shape change is intentionally
      //    skipped — the consumer would otherwise see undefined fields
      //    and render dead UI.
      const latestSnapshot = opts.forceRefresh ? null : await prisma.analyticsSnapshot.findFirst({
        where:   { granularity: 'DAILY', calculationVersion: this.CALCULATION_VERSION },
        orderBy: { timestamp: 'desc' },
      });

      // 2. If we have a fresh snapshot (< TTL), serve it.
      if (latestSnapshot) {
        const age = Date.now() - latestSnapshot.timestamp.getTime();
        if (age < this.SNAPSHOT_TTL_MS) {
          return { success: true, data: latestSnapshot.data };
        }
      }

      // 3. Otherwise regenerate + persist + return.
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
    const { default: prisma } = await import("@/lib/prisma");
    const [workforce, compliance, bottlenecks, trends, kpiAchievement, insights] = await Promise.all([
      AggregationService.computeWorkforceKPIs(),
      AggregationService.computeAttendanceCompliance(new Date()),
      AggregationService.getWorkflowBottlenecks(),
      AggregationService.getOperationalTrends(7),
      AggregationService.getKPIAchievement(),
      AggregationService.generateInsights(),
    ]);

    const snapshotData = {
      workforce,
      attendance: { compliance },
      bottlenecks,
      trends,
      kpiAchievement,
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
    const { default: prisma } = await import("@/lib/prisma");
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
