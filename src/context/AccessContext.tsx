"use client";

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export type RoleName = 'SUPER_ADMIN' | 'HR_ADMIN' | 'FINANCE_ADMIN' | 'MANAGER' | 'STAFF';

interface AccessContextType {
  user: any;
  isLoading: boolean;
  status: 'authenticated' | 'unauthenticated' | 'loading';
  userRole: RoleName;
  setRole: (role: RoleName) => void;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export function AccessProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [mockRole, setMockRole] = useState<RoleName>('SUPER_ADMIN');

  useEffect(() => {
    const loadRole = () => {
      const saved = localStorage.getItem('suler_mock_role');
      if (saved) setMockRole(saved as RoleName);
    };

    loadRole();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'suler_mock_role') {
        loadRole();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const userRole = useMemo(() => {
    if (session?.user?.role) return session.user.role as RoleName;
    return mockRole;
  }, [session, mockRole]);

  const setRole = (role: RoleName) => {
    setMockRole(role);
    localStorage.setItem('suler_mock_role', role);
    // In a real app, this would trigger a session refresh or re-auth
  };

  const user = useMemo(() => {
    return {
      id: session?.user?.id || 'MOCK-USER',
      name: session?.user?.name || (mockRole === 'SUPER_ADMIN' ? 'Chinedu Okoro' : 'Enterprise User'),
      role: userRole,
    };
  }, [session, userRole, mockRole]);

  const value = {
    user,
    userRole,
    setRole,
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

