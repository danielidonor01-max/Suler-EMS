import { PermissionType, Permissions } from './permission.model';

export type RoleName = 'SUPER_ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE';

export interface RoleModel {
  name: RoleName;
  label: string;
  permissions: PermissionType[];
}

export const ROLES: Record<RoleName, RoleModel> = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    label: 'Super Admin',
    permissions: Object.values(Permissions) as PermissionType[],
  },
  HR: {
    name: 'HR',
    label: 'Human Resources',
    permissions: [
      Permissions.WORKFORCE_VIEW,
      Permissions.WORKFORCE_CREATE,
      Permissions.WORKFORCE_EDIT,
      Permissions.WORKFORCE_DELETE,
      Permissions.DATA_EXPORT,
      Permissions.LEAVE_VIEW,
      Permissions.LEAVE_APPROVE,
      Permissions.ATTENDANCE_VIEW,
      Permissions.ATTENDANCE_MANAGE,
    ],
  },
  MANAGER: {
    name: 'MANAGER',
    label: 'Department Manager',
    permissions: [
      Permissions.WORKFORCE_VIEW,
      Permissions.LEAVE_VIEW,
      Permissions.LEAVE_APPROVE,
      Permissions.ATTENDANCE_VIEW,
    ],
  },
  EMPLOYEE: {
    name: 'EMPLOYEE',
    label: 'Employee',
    permissions: [
      Permissions.LEAVE_VIEW,
      Permissions.LEAVE_SUBMIT,
      Permissions.ATTENDANCE_VIEW,
    ],
  },
  FINANCE: {
    name: 'FINANCE',
    label: 'Finance & Payroll',
    permissions: [
      Permissions.WORKFORCE_VIEW,
      Permissions.PAYROLL_VIEW,
      Permissions.PAYROLL_EDIT,
    ],
  },
};
