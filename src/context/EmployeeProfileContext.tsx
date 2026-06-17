'use client';

/**
 * Global "open this employee's profile" affordance.
 *
 * Wrapping the dashboard in <EmployeeProfileProvider> gives every
 * descendant access to `useEmployeeProfile().openProfile(employeeId)`.
 * The provider keeps the currently-open id in state and renders a
 * single shared <EmployeeProfileModal /> so the dozens of name+avatar
 * displays scattered across the app don't each need their own modal
 * instance + state.
 *
 * Usage:
 *
 *   const { openProfile } = useEmployeeProfile();
 *   <button onClick={() => openProfile(employee.id)}>...</button>
 *
 * Or use <EmployeeChip employeeId="..." name="..." /> as a drop-in
 * replacement for the standard avatar+name display — see ./
 * EmployeeChip.tsx for the convenience component.
 */

import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { EmployeeProfileModal } from '@/components/employees/EmployeeProfileModal';

interface EmployeeProfileContextValue {
  openProfile: (employeeId: string) => void;
  closeProfile: () => void;
}

const EmployeeProfileContext = createContext<EmployeeProfileContextValue | undefined>(undefined);

export function EmployeeProfileProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const openProfile = useCallback((employeeId: string) => {
    setOpenId(employeeId);
  }, []);

  const closeProfile = useCallback(() => {
    setOpenId(null);
  }, []);

  const value = useMemo(() => ({ openProfile, closeProfile }), [openProfile, closeProfile]);

  return (
    <EmployeeProfileContext.Provider value={value}>
      {children}
      <EmployeeProfileModal employeeId={openId} onClose={closeProfile} />
    </EmployeeProfileContext.Provider>
  );
}

export function useEmployeeProfile(): EmployeeProfileContextValue {
  const ctx = useContext(EmployeeProfileContext);
  if (!ctx) {
    // Soft fallback: outside the provider (e.g. in storybook / tests),
    // return no-ops rather than throwing. Real consumer pages all live
    // under the dashboard provider tree.
    return {
      openProfile: () => {},
      closeProfile: () => {},
    };
  }
  return ctx;
}
