import { PermissionType, Permissions } from '@/modules/auth/domain/permission.model';

export interface RouteRule {
  path: string;
  requiredPermission: PermissionType;
}

/**
 * Centralized Route Security Configuration.
 * Maps application paths to required domain permissions.
 */
export const RouteRules: RouteRule[] = [
  {
    path: '/employees',
    requiredPermission: Permissions.EMPLOYEE_VIEW,
  },
  {
    path: '/attendance',
    requiredPermission: Permissions.ATTENDANCE_VIEW,
  },
  {
    path: '/leave',
    requiredPermission: Permissions.LEAVE_VIEW,
  },
  {
    path: '/payroll',
    requiredPermission: Permissions.PAYROLL_VIEW,
  },
  {
    path: '/settings',
    requiredPermission: Permissions.SETTINGS_MANAGE,
  },
];

/**
 * Finds the required permission for a given path.
 */
export function getRequiredPermissionForPath(path: string): PermissionType | undefined {
  // Simple prefix matching for domain-based routes
  const rule = RouteRules.find(r => path.startsWith(r.path));
  return rule?.requiredPermission;
}
