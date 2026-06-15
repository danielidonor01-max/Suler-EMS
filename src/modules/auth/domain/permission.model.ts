import { UUID } from '@/types/common';
export type { UUID };

// Granular Domain Actions
export const Actions = {
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ARCHIVE: 'archive',
  EXPORT: 'export',
  APPROVE: 'approve',
  REJECT: 'reject',
  MANAGE: 'manage',
  EXECUTE: 'execute',
} as const;

export type ActionType = typeof Actions[keyof typeof Actions];

// Resource Scopes
export type AccessScope = 'global' | 'department' | 'team' | 'self';

// Policy Evaluation Result
export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

// Full Policy Context for evaluation
export interface PolicyContext<TResource = any> {
  user: {
    id: UUID;
    role: string;
    permissions: string[];
    departmentId?: UUID;
  };
  resource?: TResource;
  scope?: AccessScope;
}

// Expanded Permissions Map
export const Permissions = {
  // Workforce Management
  WORKFORCE_VIEW: 'workforce:view',
  WORKFORCE_CREATE: 'workforce:create',
  WORKFORCE_EDIT: 'workforce:edit',
  WORKFORCE_DELETE: 'workforce:delete',
  WORKFORCE_PROMOTE: 'workforce:promote',

  // Organization & Hubs
  HUB_MANAGE: 'hub:manage',
  DEPARTMENT_MANAGE: 'dept:manage',
  ORG_CHART_EDIT: 'org:edit',

  // Leave Management
  LEAVE_VIEW: 'leave:view',
  LEAVE_SUBMIT: 'leave:submit',
  LEAVE_APPROVE: 'leave:approve',
  
  // Attendance
  ATTENDANCE_VIEW: 'attendance:view',
  ATTENDANCE_MANAGE: 'attendance:manage',
  
  // Payroll
  PAYROLL_VIEW: 'payroll:view',
  PAYROLL_EDIT: 'payroll:edit',
  PAYROLL_APPROVE: 'payroll:approve',
  PAYROLL_PROCESS: 'payroll:process',
  
  // Finance
  FINANCE_VIEW: 'finance:view',
  FINANCE_ALLOCATE: 'finance:allocate',
  FINANCE_APPROVE: 'finance:approve',
  FINANCE_DISBURSE: 'finance:disburse',
  
  // Governance
  AUDIT_VIEW: 'audit:view',
  ROLE_MANAGE: 'role:manage',
  COMMAND_CENTER_VIEW: 'command:view',
  
  // Security
  SECURITY_MANAGE: 'security:manage',
  
  // Data Management
  DATA_EXPORT: 'data:export',
  DATA_MANAGE: 'data:manage',
  DATA_BACKUP: 'data:backup',
  DATA_RESTORE: 'data:restore',
  
  // Settings
  SETTINGS_MANAGE: 'settings:manage',

  // Communication
  COMMUNICATION_BROADCAST: 'communication:broadcast',

  // Intelligence
  REPORTS_GENERATE: 'reports:generate',
  ANALYTICS_VIEW: 'analytics:view',
  STRATEGY_SIMULATE: 'strategy:simulate',
} as const;

export type PermissionType = typeof Permissions[keyof typeof Permissions];
