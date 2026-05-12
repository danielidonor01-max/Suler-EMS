"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock } from 'lucide-react';
import { useAccess } from '@/context/AccessContext';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

const DEFAULT_BLOCKED = (
  <div className="section-breathing flex flex-col items-center justify-center h-[60vh] gap-6">
    <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
      <ShieldAlert className="w-8 h-8 text-rose-400" />
    </div>
    <div className="text-center">
      <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h2>
      <p className="text-[13px] font-medium text-slate-400 max-w-[360px] leading-relaxed">
        You do not have sufficient privileges to view this module. Contact your Super Admin to request elevated access.
      </p>
    </div>
    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl">
      <Lock className="w-3.5 h-3.5 text-rose-400" />
      <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest">Zero Trust — Access Denied</span>
    </div>
  </div>
);

export function RouteGuard({ children, allowedRoles, fallback }: RouteGuardProps) {
  const { userRole, isLoading } = useAccess();

  if (isLoading) {
    return (
      <div className="section-breathing flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!allowedRoles.includes(userRole)) {
    return <>{fallback || DEFAULT_BLOCKED}</>;
  }

  return <>{children}</>;
}
