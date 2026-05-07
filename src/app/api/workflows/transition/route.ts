import { WorkflowEngine } from '@/modules/workflow/engine/workflow.engine';
import { PrismaWorkflowRepository } from '@/modules/workflow/repositories/prisma-workflow.repository';
import { LeaveWorkflow } from '@/modules/workflow/definitions/leave.workflow';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { withAuth } from '@/lib/api/with-auth';

const workflowRepo = new PrismaWorkflowRepository();

/**
 * Atomic Workflow Transition Handler
 * POST /api/workflows/transition
 */
export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  
  try {
    const body = await req.json();
    const { instanceId, action, comment, payload } = body;

    // Use session user as actor for audit integrity
    const actor = {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role as any,
      permissions: session.user.permissions
    };

    // 1. Fetch Instance
    const instanceResult = await workflowRepo.getInstance(instanceId);
    if (!instanceResult.success) {
      return errorResponse('NOT_FOUND', instanceResult.error.message, 404, correlationId);
    }

    const instance = instanceResult.data;

    // 2. Validate Transition via Engine
    const validation = WorkflowEngine.evaluateTransition(LeaveWorkflow, {
      instance,
      actor,
      action,
      payload
    });

    if (!validation.success) {
      return errorResponse('FORBIDDEN', validation.error.message, 403, correlationId);
    }

    // 3. Execute Persistent Transition (Atomic DB update)
    const transition = LeaveWorkflow.transitions[action];
    const persistentResult = await workflowRepo.executeTransition({
      instance,
      actor,
      action,
      comment,
      payload: { ...payload, toState: transition.to }
    }, { 
      table: 'LeaveRequest', 
      status: transition.to 
    });

    if (!persistentResult.success) {
      return errorResponse('DB_ERROR', persistentResult.error.message, 500, correlationId);
    }

    return successResponse(persistentResult.data, correlationId);

  } catch (error: any) {
    return errorResponse('INTERNAL_ERROR', error.message, 500, correlationId);
  }
});
