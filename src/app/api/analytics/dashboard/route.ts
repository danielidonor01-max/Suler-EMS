import { withAuth } from "@/lib/api/with-auth";
import { AnalyticsService } from "@/modules/analytics/services/analytics.service";
import { successResponse, errorResponse } from "@/lib/api-utils";

/**
 * Fetch Analytics Dashboard Snapshot
 * GET /api/analytics/dashboard
 */
export const GET = withAuth(async (req, session) => {
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === 'true';
  const result = await AnalyticsService.getDashboardSnapshot(session.user.id, { forceRefresh });

  if (!result.success) {
    return errorResponse('ANALYTICS_ERROR', result.error.message, 500);
  }

  // In a real app, we'd apply role-based data masking here if needed
  return successResponse({
    ...result.data,
    userId: session.user.id
  });
});
