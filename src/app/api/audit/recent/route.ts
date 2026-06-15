import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/audit/recent?limit=50
 *
 * Unified audit feed combining workflow transitions and security events,
 * mapped to the shape ActivityContext consumes (ActivityItem).
 * Restricted to users with `audit:view` or SUPER_ADMIN — others get
 * their own activity slice (just transitions they initiated).
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200);

  const canSeeAll =
    session.user.role === 'SUPER_ADMIN' ||
    (session.user.permissions ?? []).includes('audit:view');

  try {
    const [workflowEntries, securityEvents] = await Promise.all([
      prisma.workflowAuditEntry.findMany({
        where: canSeeAll ? {} : { actorId: session.user.id },
        orderBy: { timestamp: 'desc' },
        take: limit,
      }),
      canSeeAll
        ? prisma.securityEvent.findMany({
            orderBy: { timestamp: 'desc' },
            take: Math.min(limit, 20),
          })
        : Promise.resolve([]),
    ]);

    const workflowItems = workflowEntries.map(e => ({
      id: e.id,
      type: 'GOVERNANCE' as const,
      actor: e.actorName,
      author: e.actorName,
      action: e.action,
      label: `${e.action} (${e.fromState} → ${e.toState})`,
      message: e.comment ?? undefined,
      status: e.toState === 'REJECTED' ? 'WARNING' : 'SUCCESS',
      timestamp: e.timestamp.toISOString(),
      metadata: { actorRole: e.actorRole, fromState: e.fromState, toState: e.toState, instanceId: e.instanceId },
    }));

    const securityItems = securityEvents.map(e => ({
      id: e.id,
      type: 'SECURITY' as const,
      actor: 'system',
      action: e.type,
      label: e.type,
      message: e.description,
      status: e.type === 'LOGIN_FAILURE' || e.type === 'PERMISSION_DENIED' ? 'WARNING' : 'SUCCESS',
      timestamp: e.timestamp.toISOString(),
      metadata: e.metadata,
    }));

    const merged = [...workflowItems, ...securityItems]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);

    return successResponse(merged, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load audit feed';
    return errorResponse('AUDIT_FETCH_FAILED', msg, 500, correlationId);
  }
});
