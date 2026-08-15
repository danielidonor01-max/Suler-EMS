'use client';

/**
 * Global "open this employee's profile" affordance.
 *
 * v2: openProfile() now NAVIGATES to the full-page dossier at
 * /staff/[id] instead of opening the old overlay modal. Product call
 * (client pilot feedback): two competing profile UIs was confusing, and
 * the full page is the stronger surface — tabs, documents, more room,
 * a shareable URL. The old EmployeeProfileModal is no longer rendered;
 * every EmployeeChip / row-action across the app funnels here.
 *
 * openProfile accepts either the canonical DB UUID or the display
 * staffId — /staff/[id] resolves both.
 *
 * Usage:
 *
 *   const { openProfile } = useEmployeeProfile();
 *   <button onClick={() => openProfile(employee.id)}>...</button>
 *
 * Or use <EmployeeChip employeeId="..." name="..." /> as a drop-in
 * replacement for the standard avatar+name display.
 */

import React, { createContext, useCallback, useContext, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface EmployeeProfileContextValue {
  openProfile: (employeeId: string) => void;
  closeProfile: () => void;
}

const EmployeeProfileContext = createContext<EmployeeProfileContextValue | undefined>(undefined);

export function EmployeeProfileProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const openProfile = useCallback((employeeId: string) => {
    if (!employeeId) return;
    router.push(`/staff/${encodeURIComponent(employeeId)}`);
  }, [router]);

  // Kept for API compatibility with existing callers; navigation has no
  // "close" so this is a no-op.
  const closeProfile = useCallback(() => {}, []);

  const value = useMemo(() => ({ openProfile, closeProfile }), [openProfile, closeProfile]);

  return (
    <EmployeeProfileContext.Provider value={value}>
      {children}
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
