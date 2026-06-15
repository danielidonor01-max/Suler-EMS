import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { listMyPayslips } from '@/modules/payroll/domain/payroll.service';

/**
 * GET /api/payroll/me
 *
 * Returns PROCESSED payroll entries for the calling user. Drafts and in-flight
 * runs are excluded so employees never see preview numbers that might change.
 */
export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  if (!session.user.employeeId) {
    return errorResponse('NO_EMPLOYEE', 'Calling user is not linked to an employee', 400, correlationId);
  }
  const payslips = await listMyPayslips(session.user.employeeId);
  return successResponse(payslips, correlationId);
});
