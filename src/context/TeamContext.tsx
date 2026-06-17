"use client";

/**
 * Teams — DB-backed via /api/teams.
 *
 * Same SWR pattern as OrganizationContext: a 30s polling window so a
 * change made elsewhere (other tab / device / direct API call) shows
 * up without manual refresh, and mutations call apiMutate then
 * revalidate the cache.
 */

import React, { createContext, useCallback, useContext, useMemo, ReactNode } from 'react';
import useSWR from 'swr';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

export interface TeamMember {
  membershipId: string;
  role: string | null;
  joinedAt: string;
  employee: {
    id: string;
    name: string;
    staffId: string;
    jobTitle: string;
  };
}

export interface Team {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  hub: { id: string; code: string; name: string } | null;
  hubId: string | null;
  department: { id: string; code: string; name: string } | null;
  departmentId: string | null;
  manager: { id: string; name: string; jobTitle: string | null } | null;
  managerId: string | null;
  members: TeamMember[];
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface NewTeamInput {
  code: string;
  name: string;
  description?: string | null;
  hubId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  members?: Array<{ employeeId: string; role?: string | null }>;
}

interface UpdateTeamInput {
  name?: string;
  description?: string | null;
  status?: Team['status'];
  hubId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
}

interface TeamContextType {
  teams: Team[];
  teamsLoading: boolean;
  teamsError: Error | undefined;
  addTeam: (input: NewTeamInput) => Promise<void>;
  updateTeam: (id: string, updates: UpdateTeamInput) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addMemberToTeam: (teamId: string, employeeId: string, role?: string | null) => Promise<void>;
  removeMemberFromTeam: (teamId: string, employeeId: string) => Promise<void>;
  assignTeamManager: (teamId: string, employeeId: string | null) => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    data: teams = [],
    error: teamsError,
    isLoading: teamsLoading,
    mutate: revalidate,
  } = useSWR<Team[]>('/api/teams', apiFetcher, { refreshInterval: 30_000 });

  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  // Pre-v3 cleanup on first mount — old localStorage cache shouldn't shadow
  // server data. Idempotent / safe to run on every reload.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      ['suler_teams', 'suler_teams_v2'].forEach(k => localStorage.removeItem(k));
    } catch { /* private mode */ }
  }, []);

  const addTeam = useCallback(async (input: NewTeamInput) => {
    await apiMutate('/api/teams', 'POST', input);
    await revalidate();
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Operational Team Created',
      message: `New execution unit [${input.name}] established.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [revalidate, pushActivity, userRole]);

  const updateTeam = useCallback(async (id: string, updates: UpdateTeamInput) => {
    const target = teams.find(t => t.id === id);
    await apiMutate(`/api/teams/${id}`, 'PATCH', updates);
    await revalidate();
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Team Parameters Updated',
      message: `Configuration for [${target?.name ?? id}] updated.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [teams, revalidate, pushActivity, userRole]);

  const deleteTeam = useCallback(async (id: string) => {
    const target = teams.find(t => t.id === id);
    await apiMutate(`/api/teams/${id}`, 'DELETE');
    await revalidate();
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Operational Team Dissolved',
      message: `Execution unit [${target?.name ?? id}] decommissioned.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [teams, revalidate, pushActivity, userRole]);

  const addMemberToTeam = useCallback(async (teamId: string, employeeId: string, role?: string | null) => {
    await apiMutate(`/api/teams/${teamId}/members`, 'POST', { employeeId, role: role ?? null });
    await revalidate();
  }, [revalidate]);

  const removeMemberFromTeam = useCallback(async (teamId: string, employeeId: string) => {
    await apiMutate(`/api/teams/${teamId}/members/${employeeId}`, 'DELETE');
    await revalidate();
  }, [revalidate]);

  const assignTeamManager = useCallback(async (teamId: string, employeeId: string | null) => {
    await apiMutate(`/api/teams/${teamId}`, 'PATCH', { managerId: employeeId });
    await revalidate();
  }, [revalidate]);

  const value = useMemo<TeamContextType>(() => ({
    teams,
    teamsLoading,
    teamsError: teamsError as Error | undefined,
    addTeam,
    updateTeam,
    deleteTeam,
    addMemberToTeam,
    removeMemberFromTeam,
    assignTeamManager,
  }), [teams, teamsLoading, teamsError, addTeam, updateTeam, deleteTeam, addMemberToTeam, removeMemberFromTeam, assignTeamManager]);

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeams = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeams must be used within a TeamProvider');
  }
  return context;
};

export const useTeam = useTeams;
