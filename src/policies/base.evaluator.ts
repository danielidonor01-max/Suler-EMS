import { PermissionType, PolicyContext, PolicyResult } from '@/modules/auth/domain/permission.model';

/**
 * Base evaluator for pure authorization checks.
 * This layer does not know about the UI or side effects.
 */
export const BaseEvaluator = {
  /**
   * Simple check if the user has a specific permission.
   */
  hasPermission(context: PolicyContext, permission: PermissionType): PolicyResult {
    if (context.user.role === 'SUPER_ADMIN') {
      return { allowed: true };
    }

    const hasPerm = context.user.permissions.includes(permission);
    
    return {
      allowed: hasPerm,
      reason: hasPerm ? undefined : `Insufficient permission: ${permission}`,
    };
  },

  /**
   * Check if the user has a specific role.
   */
  hasRole(context: PolicyContext, role: string): PolicyResult {
    const isMatch = context.user.role === role || context.user.role === 'SUPER_ADMIN';
    
    return {
      allowed: isMatch,
      reason: isMatch ? undefined : `Required role: ${role}`,
    };
  },

  /**
   * Combine multiple policy results.
   */
  combine(results: PolicyResult[]): PolicyResult {
    const denied = results.find(r => !r.allowed);
    if (denied) return denied;
    return { allowed: true };
  }
};
