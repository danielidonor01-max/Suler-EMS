import { NextRequest } from 'next/server';
import { ReconciliationService } from '@/modules/attendance/services/reconciliation.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('UNAUTHORIZED', 'Auth required', 401);

    const result = await ReconciliationService.approve(params.id, session.user.id);
    return successResponse(result);
  } catch (err: any) {
    return errorResponse('APPROVAL_ERROR', err.message, 500);
  }
}
