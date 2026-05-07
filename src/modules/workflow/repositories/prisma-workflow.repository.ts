import prisma from "@/lib/prisma";
import { IWorkflowRepository } from "@/modules/common/contracts/repository.contract";
import { WorkflowInstance, WorkflowTransitionContext, WorkflowAuditEntry } from "../domain/workflow.types";
import { Result } from "@/types/api";
import { UUID } from "@/types/common";

export class PrismaWorkflowRepository implements IWorkflowRepository {
  async getInstance(id: UUID): Promise<Result<WorkflowInstance>> {
    try {
      const record = await prisma.workflowInstance.findUnique({
        where: { id },
        include: { history: { orderBy: { timestamp: 'desc' } } }
      });

      if (!record) return { success: false, error: { code: 'NOT_FOUND', message: 'Workflow instance not found' } };

      return { 
        success: true, 
        data: record as unknown as WorkflowInstance 
      };
    } catch (error: any) {
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  async executeTransition(
    context: WorkflowTransitionContext,
    resourceUpdate?: { table: string, status: string }
  ): Promise<Result<WorkflowInstance>> {
    const { instance, actor, action, comment, payload } = context;

    try {
      // ATOMIC TRANSACTION: State Update + Audit Entry
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Audit Entry
        const auditEntry = await tx.workflowAuditEntry.create({
          data: {
            instanceId: instance.id,
            actorId: actor.id,
            actorName: actor.name,
            actorRole: actor.role,
            fromState: instance.currentState,
            toState: payload?.toState || 'UNKNOWN', // This logic should be determined by engine
            action: action,
            comment: comment,
            metadata: payload || {},
          }
        });

        // 2. Update Workflow Instance
        const updatedInstance = await tx.workflowInstance.update({
          where: { id: instance.id },
          data: {
            currentState: payload?.toState || instance.currentState,
            version: { increment: 1 }, // Optimistic Concurrency
            updatedAt: new Date()
          },
          include: { history: { orderBy: { timestamp: 'desc' } } }
        });

        // 3. (Optional) Update Domain Resource
        if (resourceUpdate) {
           // Dynamic table update logic (simplified for demo)
           if (resourceUpdate.table === 'LeaveRequest') {
             await tx.leaveRequest.update({
               where: { id: instance.resourceId },
               data: { status: resourceUpdate.status }
             });
           }
        }

        return updatedInstance;
      });

      return { success: true, data: result as unknown as WorkflowInstance };
    } catch (error: any) {
      return { success: false, error: { code: 'TRANSACTION_FAILED', message: error.message } };
    }
  }

  async createInstance(data: Partial<WorkflowInstance>): Promise<Result<WorkflowInstance>> {
    try {
      const record = await prisma.workflowInstance.create({
        data: {
          workflowId: data.workflowId!,
          currentState: data.currentState!,
          resourceId: data.resourceId!,
          assignedToId: data.assignedTo,
          assignedRoleId: data.assignedRole,
        },
        include: { history: true }
      });
      return { success: true, data: record as unknown as WorkflowInstance };
    } catch (error: any) {
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }
}
