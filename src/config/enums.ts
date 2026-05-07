// Global Domain Enums

export const EmployeeStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave',
  TERMINATED: 'Terminated',
} as const;

export type EmployeeStatusType = typeof EmployeeStatus[keyof typeof EmployeeStatus];

export const LeaveStatus = {
  PENDING: 'Pending',
  MANAGER_REVIEW: 'Manager Review',
  HR_REVIEW: 'HR Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
} as const;

export type LeaveStatusType = typeof LeaveStatus[keyof typeof LeaveStatus];

export const AttendanceStatus = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  HALF_DAY: 'Half Day',
  ON_LEAVE: 'On Leave',
} as const;

export type AttendanceStatusType = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export const TaskStatus = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'In Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];
