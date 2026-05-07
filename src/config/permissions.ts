// Domain-Level Permissions Mapping
// This abstraction prevents hardcoded role checks (e.g. `role === 'admin'`) in the UI.

export const Permissions = {
  // Staff Management
  EMPLOYEE_VIEW: 'employee:view',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_EDIT: 'employee:edit',
  EMPLOYEE_DELETE: 'employee:delete', // soft delete

  // Leave Management
  LEAVE_VIEW_ALL: 'leave:view_all',
  LEAVE_VIEW_OWN: 'leave:view_own',
  LEAVE_SUBMIT: 'leave:submit',
  LEAVE_APPROVE_MANAGER: 'leave:approve_manager',
  LEAVE_APPROVE_HR: 'leave:approve_hr',

  // Attendance
  ATTENDANCE_VIEW_ALL: 'attendance:view_all',
  ATTENDANCE_VIEW_OWN: 'attendance:view_own',
  ATTENDANCE_LOG: 'attendance:log',
  ATTENDANCE_CORRECT: 'attendance:correct',

  // Payroll
  PAYROLL_VIEW_ALL: 'payroll:view_all',
  PAYROLL_VIEW_OWN: 'payroll:view_own',
  PAYROLL_PROCESS: 'payroll:process',
} as const;

export type PermissionType = typeof Permissions[keyof typeof Permissions];
