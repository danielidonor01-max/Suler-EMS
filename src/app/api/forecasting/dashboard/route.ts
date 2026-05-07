import { withAuth } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { ForecastingService } from "@/modules/forecasting/services/forecasting.service";
import { AnomalyService } from "@/modules/forecasting/services/anomaly.service";
import { RecommendationService } from "@/modules/forecasting/services/recommendation.service";

/**
 * Fetch Forecasting Dashboard Intelligence
 * GET /api/forecasting/dashboard
 */
export const GET = withAuth(async (req, session) => {
  try {
    // 1. Run Intelligence Pipelines
    const [projections, congestion, anomalies, recommendations] = await Promise.all([
      ForecastingService.getWorkforceProjections(),
      ForecastingService.predictWorkflowCongestion(),
      AnomalyService.scanForAnomalies(),
      RecommendationService.getActiveRecommendations()
    ]);

    // 2. Generate Departmental Risks (Simulated based on projections and anomalies)
    const risks = projections.map(p => ({
      department: p.departmentName,
      score: p.gap > 2 ? 0.85 : p.gap > 0 ? 0.45 : 0.15,
      trend: p.gap > 0 ? 'UP' : 'STABLE',
      risks: p.gap > 2 ? ['UNDERSTAFFED', 'SLA_RISK'] : p.gap > 0 ? ['STAFFING_GAP'] : ['STABLE']
    }));

    // 3. Construct Composite Response
    return successResponse({
      projections,
      congestion,
      anomalies,
      recommendations,
      risks,
      userId: session.user.id,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error(`[Forecasting API Error] ${err.message}`);
    return errorResponse('FORECASTING_ERROR', err.message, 500);
  }
});
