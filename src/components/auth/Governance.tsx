"use client";

import React from 'react';
import { useAccess } from '@/context/AccessContext';
import { PermissionType } from '@/modules/auth/domain/permission.model';

interface CanProps {
  permission: PermissionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Declarative component for conditional rendering based on permissions.
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { checkPermission } = useAccess();
  const result = checkPermission(permission);

  if (!result.allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Standardized Access Denied UI state.
 */
export function AccessDenied({ reason }: { reason?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-bg border border-dashed border-border rounded-xl">
      <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">Access Restricted</h3>
      <p className="text-sm text-text-secondary text-center max-w-xs">
        {reason || "You don't have the necessary permissions to view this section."}
      </p>
    </div>
  );
}


