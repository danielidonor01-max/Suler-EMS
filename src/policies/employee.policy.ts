import { PolicyContext, PolicyResult, Permissions } from '@/modules/auth/domain/permission.model';
import { BaseEvaluator } from './base.evaluator';
import { EmployeeModel } from '@/modules/employees/domain/employee.model';

/**
 * Functional policy layer for Employee resources.
 * Handles scope, ownership, and departmental checks.
 */
export const EmployeePolicy = {
  /**
   * Evaluates if a user can view a specific employee.
   */
  canView(context: PolicyContext<EmployeeModel>): PolicyResult {
    // 1. Check base permission
    const baseCheck = BaseEvaluator.hasPermission(context, Permissions.EMPLOYEE_VIEW);
    if (!baseCheck.allowed) return baseCheck;

    // 2. Resource-level logic (e.g., scoping)
    if (context.user.role === 'SUPER_ADMIN' || context.user.role === 'HR') {
      return { allowed: true };
    }

    if (context.resource) {
      // If it's self
      if (context.user.id === context.resource.id) {
        return { allowed: true };
      }

      // If it's a manager checking their department
      if (context.user.role === 'MANAGER' && context.user.departmentId === context.resource.departmentId) {
        return { allowed: true };
      }
      
      return { 
        allowed: false, 
        reason: "You can only view employees within your own department." 
      };
    }

    return { allowed: true };
  },

  /**
   * Evaluates if a user can update a specific employee.
   */
  canUpdate(context: PolicyContext<EmployeeModel>): PolicyResult {
    const baseCheck = BaseEvaluator.hasPermission(context, Permissions.EMPLOYEE_UPDATE);
    if (!baseCheck.allowed) return baseCheck;

    if (context.user.role === 'SUPER_ADMIN' || context.user.role === 'HR') {
      return { allowed: true };
    }

    if (context.resource && context.user.role === 'MANAGER') {
       if (context.user.departmentId === context.resource.departmentId) {
         return { allowed: true };
       }
       return { 
         allowed: false, 
         reason: "Managers can only update employees in their assigned department." 
       };
    }

    return { allowed: false, reason: "Insufficient privileges to update employee data." };
  }
};
