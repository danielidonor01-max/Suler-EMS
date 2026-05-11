import prisma from "@/lib/prisma";
import { RecommendationModel } from "../domain/forecasting.model";
import { ForecastingService } from "./forecasting.service";
import { AnomalyService } from "./anomaly.service";

/**
 * Recommendation Service
 * Aggregates intelligence into explainable governance suggestions.
 */
export class RecommendationService {
  /**
   * Generate Operational Recommendations
   * Uses forecasts and anomalies to provide explainable advice.
   */
  static async generateRecommendations(): Promise<RecommendationModel[]> {
    const recommendations: RecommendationModel[] = [];

    // 1. Staffing Recommendations
    const projections = await ForecastingService.getWorkforceProjections();
    const highGapDepts = projections.filter(p => p.gap > 2);

    for (const dept of highGapDepts) {
      recommendations.push({
        id: crypto.randomUUID() as any,
        category: 'STAFFING',
        title: `Staffing Gap in ${dept.departmentName}`,
        message: `Current headcount (${dept.currentHeadcount}) is insufficient for projected operational needs (${dept.projectedNeed}).`,
        reasoning: `Explainability: Historical attendance compliance for this department indicates a ${dept.gap}-person coverage deficit during upcoming peak cycles.`,
        suggestedAction: 'Consider temporary site reassignment or seasonal hiring.',
        impactScore: 0.8,
        status: 'ACTIVE'
      });
    }

    // 2. Efficiency Recommendations (Workflow)
    const congestion = await ForecastingService.predictWorkflowCongestion();
    if (congestion.risk === 'CRITICAL') {
      recommendations.push({
        id: crypto.randomUUID() as any,
        category: 'EFFICIENCY',
        title: 'Workflow Congestion Alert',
        message: `Approval wait times are projected to exceed ${congestion.estimatedWaitHours} hours.`,
        reasoning: `Explainability: Queue volume (${congestion.pendingCount} items) has exceeded the 30-day average throughput capacity.`,
        suggestedAction: 'Escalate pending approvals to secondary approvers or HR.',
        impactScore: 0.9,
        status: 'ACTIVE'
      });
    }

    // 3. Persist Recommendations
    for (const rec of recommendations) {
      await prisma.operationalRecommendation.create({
        data: {
          category: rec.category,
          title: rec.title,
          message: rec.message,
          reasoning: rec.reasoning,
          suggestedAction: rec.suggestedAction,
          impactScore: rec.impactScore,
          status: 'ACTIVE'
        }
      });
    }

    return recommendations;
  }

  /**
   * Get Active Recommendations
   */
  static async getActiveRecommendations(): Promise<RecommendationModel[]> {
    const recs = await prisma.operationalRecommendation.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { impactScore: 'desc' },
      take: 5
    });
    return recs as unknown as RecommendationModel[];
  }
}
