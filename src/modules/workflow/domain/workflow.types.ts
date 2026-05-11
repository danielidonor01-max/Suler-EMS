import { UUID } from '@/types/common';
import { RoleName } from '@/modules/auth/domain/role.model';

// Workflow States & Actions (Domain Agnostic)
export type WorkflowState = string;
export type WorkflowAction = string;

// Transition Guard for business logic validation
export interface TransitionGuardContext {
  instance: WorkflowInstance;
  actor: { id: UUID; role: RoleName };
  payload?: any;
}

export type TransitionGuard = (context: TransitionGuardContext) => { 
  valid: boolean; 
  reason?: string; 
};

// Workflow Definition (The "Blueprint")
export interface WorkflowDefinition {
  id: string;
  name: string;
  version: number;
  initialState: WorkflowState;
  states: Record<WorkflowState, {
    label: string;
    allowedActions: WorkflowAction[];
  }>;
  transitions: Record<WorkflowAction, {
    from: WorkflowState | WorkflowState[];
    to: WorkflowState;
    label: string;
    requiredPermission?: string;
    requiredRole?: RoleName;
    guards?: TransitionGuard[];
  }>;
}

// Immutable Audit Entry Snapshot
export interface WorkflowAuditEntry {
  id: UUID;
  instanceId: UUID;
  timestamp: string;
  actorId: UUID;
  actorName: string;
  actorRole: RoleName;
  fromState: WorkflowState;
  toState: WorkflowState;
  action: WorkflowAction;
  comment?: string;
  metadata?: Record<string, any>;
}

// Active Workflow Instance
export interface WorkflowInstance {
  id: UUID;
  workflowId: string;
  version: number;
  currentState: WorkflowState;
  resourceId: UUID; // The ID of the leave request, attendance correction, etc.
  assignedTo?: UUID;
  assignedRole?: RoleName;
  pendingApprovers?: UUID[];
  history: WorkflowAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

// Execution Context for Transitions
export interface WorkflowTransitionContext {
  instance: WorkflowInstance;
  actor: { id: UUID; name: string; role: RoleName; permissions: string[] };
  action: WorkflowAction;
  comment?: string;
  payload?: any;
}
