import { NextRequest } from 'next/server';
import { ReconciliationService } from '@/modules/attendance/services/reconciliation.service';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { auth } from '@/lib/auth/auth.config';

export async function GET(req: NextRequest) {
  try {
    const queue = await ReconciliationService.getPendingQueue();
    return successResponse(queue);
  } catch (err: any) {
    return errorResponse('FETCH_ERROR', err.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse('UNAUTHORIZED', 'Auth required', 401);

    const body = await req.json();
    const reconciliation = await ReconciliationService.requestCorrection({
      ...body,
      actorId: session.user.id
    });
    return successResponse(reconciliation);
  } catch (err: any) {
    return errorResponse('REQUEST_ERROR', err.message, 500);
  }
}
