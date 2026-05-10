"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { RoleName } from '@/modules/auth/domain/role.model';
import { PermissionType, PolicyContext, PolicyResult } from '@/modules/auth/domain/permission.model';
import { BaseEvaluator } from '@/policies/base.evaluator';

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
    return {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role as RoleName,
      permissions: session.user.permissions as PermissionType[],
      departmentId: session.user.departmentId,
      employeeId: session.user.employeeId,
    };
  }, [session]);

  const checkPermission = (permission: PermissionType): PolicyResult => {
    if (!user) return { allowed: false, reason: 'Not logged in' };
    
    const context: PolicyContext = {
      user: user,
    };
    return BaseEvaluator.hasPermission(context, permission);
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

