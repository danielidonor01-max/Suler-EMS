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

    // Session.user.role MUST exist for an authenticated user — Credentials
    // provider sets it from the DB Role.name. If it's missing the JWT is
    // corrupt; treat as unauthenticated rather than silently falling back to
    // a 'GUEST' role (which used to expose the unauthenticated dashboard).
    const role = (session.user.role as string) || null;
    if (!role) return null;

    const permissions = (session.user.permissions as string[]) || ROLE_PERMISSION_MAP[role] || [];

    return {
      id: session.user.id,
      name: session.user.name,
      role,
      permissions,
      departmentId: session.user.departmentId,
      employeeId: session.user.employeeId,
    };
  }, [session]);

  const checkPermission = (permission: PermissionType): PolicyResult => {
    if (!user) return { allowed: false, reason: 'Not logged in' };
    const hasPerm = user.permissions.includes(permission) || user.role === 'SUPER_ADMIN';
    return {
      allowed: hasPerm,
      reason: hasPerm ? undefined : `Insufficient permission: ${permission}`,
    };
  };

  // No GUEST fallback. If a UI element renders before session loads it'll see
  // 'UNAUTHENTICATED' and should render a skeleton, not role-gated content.
  // Middleware guarantees authenticated users by the time any dashboard route
  // is reached.
  const userRole = useMemo(() => user?.role || 'UNAUTHENTICATED', [user]);

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

