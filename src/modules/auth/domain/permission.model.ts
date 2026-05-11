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
  // Staff Management
  EMPLOYEE_VIEW: 'employee:view',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_ARCHIVE: 'employee:archive',
  EMPLOYEE_EXPORT: 'employee:export',

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
  
  // Settings
  SETTINGS_MANAGE: 'settings:manage',
} as const;

export type PermissionType = typeof Permissions[keyof typeof Permissions];
