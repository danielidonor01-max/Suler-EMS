import { 
  WorkflowDefinition, 
  WorkflowTransitionContext, 
  WorkflowInstance, 
  WorkflowAuditEntry 
} from '../domain/workflow.types';
import { Result } from '@/types/api';
import { EventPublisher } from '@/lib/events/event.publisher';

/**
 * Pure orchestration engine for business processes.
 */
export class WorkflowEngine {
  /**
   * Validates if a transition is allowed based on current state, guards, and permissions.
   */
  static evaluateTransition(
    definition: WorkflowDefinition,
    context: WorkflowTransitionContext
  ): Result<boolean> {
    const { instance, actor, action } = context;
    const transition = definition.transitions[action];

    // 1. Check if action exists in definition
    if (!transition) {
      return { success: false, error: { code: 'INVALID_ACTION', message: `Action ${action} is not defined.` } };
    }

    // 2. Check if action is allowed in current state
    const allowedActions = definition.states[instance.currentState].allowedActions;
    if (!allowedActions.includes(action)) {
      return { 
        success: false, 
        error: { 
          code: 'INVALID_STATE_TRANSITION', 
          message: `Action ${action} is not allowed from state ${instance.currentState}.` 
        } 
      };
    }

    // 3. Check role/permission requirements
    if (transition.requiredRole && actor.role !== transition.requiredRole && actor.role !== 'SUPER_ADMIN') {
      return { 
        success: false, 
        error: { 
          code: 'UNAUTHORIZED_WORKFLOW_ACTION', 
          message: `Role ${transition.requiredRole} is required for this action.` 
        } 
      };
    }

    if (transition.requiredPermission && !actor.permissions.includes(transition.requiredPermission) && actor.role !== 'SUPER_ADMIN') {
      return { 
        success: false, 
        error: { 
          code: 'UNAUTHORIZED_WORKFLOW_ACTION', 
          message: `Permission ${transition.requiredPermission} is required.` 
        } 
      };
    }

    // 4. Evaluate Guards
    if (transition.guards) {
      for (const guard of transition.guards) {
        const guardResult = guard({ instance, actor, payload: context.payload });
        if (!guardResult.valid) {
          return { 
            success: false, 
            error: { 
              code: 'GUARD_VIOLATION', 
              message: guardResult.reason || 'Transition guard failed.' 
            } 
          };
        }
      }
    }

    return { success: true, data: true };
  }

  /**
   * Executes a transition, updates the instance, and creates an audit entry.
   */
  static executeTransition(
    definition: WorkflowDefinition,
    context: WorkflowTransitionContext
  ): Result<WorkflowInstance> {
    const validation = this.evaluateTransition(definition, context);
    if (!validation.success) return validation as any;

    const { instance, actor, action, comment } = context;
    const transition = definition.transitions[action];
    
    // Create Audit Entry Snapshot
    const auditEntry: WorkflowAuditEntry = {
      id: crypto.randomUUID() as any,
      instanceId: instance.id,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      fromState: instance.currentState,
      toState: transition.to,
      action: action,
      comment: comment,
    };

    // Update Instance
    const updatedInstance: WorkflowInstance = {
      ...instance,
      currentState: transition.to,
      history: [...instance.history, auditEntry],
      updatedAt: new Date().toISOString(),
    };

    // 4. Publish Event (Async)
    const isInitial = auditEntry.fromState === definition.initialState;
    let eventType: any = isInitial ? 'LEAVE_REQUESTED_EVENT' : 'LEAVE_TRANSITIONED_EVENT';
    
    // Explicit domain events
    if (auditEntry.toState === 'APPROVED') eventType = 'LEAVE_APPROVED_EVENT';
    if (auditEntry.toState === 'REJECTED') eventType = 'LEAVE_REJECTED_EVENT';

    EventPublisher.publish({
      eventId: crypto.randomUUID() as any,
      type: eventType,
      version: '1.0',
      source: 'workflow-engine',
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      resourceId: instance.resourceId,
      resourceType: definition.id, 
      payload: {
        requesterId: instance.resourceId,
        requesterName: actor.name,
        workflowType: definition.name,
        leaveType: (context.payload as any)?.type,
        days: (context.payload as any)?.days,
        startDate: (context.payload as any)?.startDate,
        fromState: auditEntry.fromState,
        toState: auditEntry.toState,
        action: action,
        reason: comment
      }
    });

    return { success: true, data: updatedInstance };
  }
}
