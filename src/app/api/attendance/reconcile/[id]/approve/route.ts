import { NextRequest } from 'next/server';
import { ReconciliationService } from '@/modules/attendance/services/reconciliation.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { auth } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return errorResponse('Auth required', 401);

    const result = await ReconciliationService.approve(id, session.user.id);
    return successResponse(result);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
