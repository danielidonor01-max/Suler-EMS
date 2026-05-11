import { withAuth } from "@/lib/api/with-auth";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";

/**
 * Fetch recent system events (Activity Feed)
 * GET /api/events
 */
export const GET = withAuth(async (req, session) => {
  try {
    const events = await prisma.systemEvent.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    return successResponse(events);
  } catch (err: any) {
    return errorResponse('FETCH_ERROR', err.message, 500);
  }
});
