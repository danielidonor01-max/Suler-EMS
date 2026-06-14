"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Permissions, PermissionType, PolicyContext, PolicyResult } from '@/modules/auth/domain/permission.model';
import { BaseEvaluator } from '@/policies/base.evaluator';

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  SUPER_ADMIN: Object.values(Permissions),
  HR_ADMIN: [
    Permissions.WORKFORCE_VIEW, Permissions.WORKFORCE_CREATE, Permissions.WORKFORCE_EDIT,
    Permissions.LEAVE_VIEW, Permissions.LEAVE_APPROVE,
    Permissions.ATTENDANCE_VIEW,
    Permissions.PAYROLL_VIEW,
    Permissions.AUDIT_VIEW,
    Permissions.ANALYTICS_VIEW
  ],
  FINANCE_MANAGER: [
    Permissions.PAYROLL_VIEW, Permissions.PAYROLL_EDIT, Permissions.PAYROLL_APPROVE, Permissions.PAYROLL_PROCESS,
    Permissions.FINANCE_VIEW, Permissions.FINANCE_ALLOCATE, Permissions.FINANCE_APPROVE, Permissions.FINANCE_DISBURSE,
    Permissions.AUDIT_VIEW,
    Permissions.ANALYTICS_VIEW
  ],
  MANAGER: [
    Permissions.WORKFORCE_VIEW,
    Permissions.LEAVE_VIEW, Permissions.LEAVE_SUBMIT,
    Permissions.ATTENDANCE_VIEW,
    Permissions.ANALYTICS_VIEW,
    Permissions.REPORTS_GENERATE,
    Permissions.FINANCE_VIEW
  ],
  EMPLOYEE: [
    Permissions.LEAVE_VIEW, Permissions.LEAVE_SUBMIT,
    Permissions.ATTENDANCE_VIEW,
    Permissions.WORKFORCE_VIEW, // Can view colleagues
    Permissions.FINANCE_VIEW
  ]
};

interface AccessContextType {
  user: any;
  userRole: string;
  checkPermission: (permission: PermissionType) => PolicyResult;
  isLoading: boolean;
  status: 'authenticated' | 'unauthenticated' | 'loading';
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export function AccessProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const user = useMemo(() => {
    if (!session?.user) return null;
    
    // In MVP, we derive permissions from the role map if not provided by session
    const role = (session.user.role as string) || 'GUEST';
    const permissions = (session.user.permissions as string[]) || ROLE_PERMISSION_MAP[role] || [];

    return {
      id: session.user.id,
      name: session.user.name,
      role: role,
      permissions: permissions,
      departmentId: session.user.departmentId,
      employeeId: session.user.employeeId,
    };
  }, [session]);

  const checkPermission = (permission: PermissionType): PolicyResult => {
    if (!user) return { allowed: false, reason: 'Not logged in' };
    
    // Check if the user has the permission in their mapped permission list
    const hasPerm = user.permissions.includes(permission) || user.role === 'SUPER_ADMIN';

    return {
      allowed: hasPerm,
      reason: hasPerm ? undefined : `Insufficient permission: ${permission}`
    };
  };

  const userRole = useMemo(() => user?.role || 'GUEST', [user]);

  const value = {
    user,
    userRole,
    checkPermission,
    isLoading: status === 'loading',
    status: status as any
  };

  return (
    <AccessContext.Provider value={value}>
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess() {
  const context = useContext(AccessContext);
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
}

