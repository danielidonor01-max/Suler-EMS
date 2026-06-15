import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getRun } from '@/modules/payroll/domain/payroll.service';

/**
 * GET /api/payroll/runs/[id]?includeEntries=true&includeHistory=true
 */
export const GET = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('payroll:view') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'payroll:view required', 403, correlationId);
  }
  const { id } = (await context.params) as { id: string };
  const sp = new URL(req.url).searchParams;
  try {
    const run = await getRun(id, {
      includeEntries: sp.get('includeEntries') === 'true',
      includeHistory: sp.get('includeHistory') === 'true',
    });
    return successResponse(run, correlationId);
  } catch (err) {
    return errorResponse('NOT_FOUND', err instanceof Error ? err.message : 'Run not found', 404, correlationId);
  }
});
