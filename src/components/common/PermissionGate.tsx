"use client";

import React from 'react';
import { useAccess } from '@/context/AccessContext';
import { PermissionType } from '@/modules/auth/domain/permission.model';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  permission: PermissionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLocked?: boolean; // If true, shows a locked state instead of hiding
}

/**
 * PermissionGate
 * 
 * Conditionally renders children based on whether the current user has the required permission.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permission, 
  children, 
  fallback = null,
  showLocked = false
}) => {
  const { checkPermission, isLoading } = useAccess();

  if (isLoading) return null;

  const { allowed } = checkPermission(permission);

  if (allowed) {
    return <>{children}</>;
  }

  if (showLocked) {
    return (
      <div className="group relative inline-block">
        <div className="opacity-40 grayscale pointer-events-none filter blur-[0.5px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-slate-900/10 border border-slate-900/20 flex items-center justify-center text-slate-400 backdrop-blur-[1px]">
            <Lock className="w-4 h-4" />
          </div>
        </div>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-50 shadow-xl pointer-events-none">
          Locked: Requires {permission.split(':').join(' ').toUpperCase()}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
        </div>
      </div>
    );
  }

  return <>{fallback}</>;
};
