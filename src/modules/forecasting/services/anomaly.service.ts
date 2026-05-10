import prisma from "@/lib/prisma";
import { AnomalyModel, AnomalySeverity } from "../domain/forecasting.model";

/**
 * Anomaly Service
 * Implements pattern-based detection for operational risks.
 */
export class AnomalyService {
  /**
   * Scan for Operational Anomalies
   */
  static async scanForAnomalies(): Promise<AnomalyModel[]> {
    const anomalies: AnomalyModel[] = [];

    // 1. Detect Workflow Stagnation
    const stagnantWorkflows = await prisma.workflowInstance.findMany({
      where: {
        currentState: { not: 'COMPLETED' },
        updatedAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) } // Older than 48 hours
      }
    });

    if (stagnantWorkflows.length > 5) {
      anomalies.push({
        id: crypto.randomUUID() as any,
        type: 'WORKFLOW_STAGNATION',
        severity: 'WARNING',
        description: `${stagnantWorkflows.length} workflow instances have not moved in over 48 hours.`,
        evidence: { count: stagnantWorkflows.length, ids: stagnantWorkflows.map(w => w.id) },
        timestamp: new Date(),
        isResolved: false
      });
    }

    // 2. Detect Abnormal Attendance Spikes (Simple Variance Check)
    const recentMetrics = await prisma.attendanceMetric.findMany({
      take: 7,
      orderBy: { date: 'desc' }
    });

    if (recentMetrics.length >= 2) {
      const latest = recentMetrics[0].complianceRate;
      const previous = recentMetrics[1].complianceRate;
      const drop = previous - latest;

      if (drop > 20) { // 20% sudden drop
        anomalies.push({
          id: crypto.randomUUID() as any,
          type: 'ABNORMAL_SPIKE',
          severity: 'CRITICAL',
          description: `Sudden 20% drop in attendance compliance detected since yesterday.`,
          evidence: { drop, current: latest, previous },
          timestamp: new Date(),
          isResolved: false
        });
      }
    }

    // 3. Persist new anomalies if they don't exist yet (or update)
    for (const anomaly of anomalies) {
      await prisma.operationalAnomaly.upsert({
        where: { id: anomaly.id },
        update: {},
        create: {
          id: anomaly.id,
          type: anomaly.type,
          severity: anomaly.severity,
          description: anomaly.description,
          metadata: anomaly.evidence as any,
          timestamp: anomaly.timestamp
        }
      });
    }

    return anomalies;
  }

  /**
   * Resolve Anomaly
   */
  static async resolveAnomaly(id: string) {
    return prisma.operationalAnomaly.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date() }
    });
  }
}
