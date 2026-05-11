"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

export interface Team {
  id: string;
  name: string;
  description: string;
  department: string;
  hub: string;
  managerId: string; // Employee ID
  members: string[]; // Array of Employee IDs
  status: 'ACTIVE' | 'INACTIVE';
  performanceScore: number;
  activeTasks: number;
  createdAt: string;
  _v: number;
}

interface TeamContextType {
  teams: Team[];
  addTeam: (team: Omit<Team, 'id' | 'status' | 'performanceScore' | 'activeTasks' | 'createdAt' | '_v'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addMemberToTeam: (teamId: string, employeeId: string) => void;
  removeMemberFromTeam: (teamId: string, employeeId: string) => void;
  assignTeamManager: (teamId: string, employeeId: string) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const SEEDED_TEAMS: Team[] = [
  {
    id: 'TEAM-01',
    name: 'Executive Operations',
    description: 'Core operational leadership and strategic execution team.',
    department: 'Operations',
    hub: 'Lagos HQ',
    managerId: 'EMP-001', // Seeded Admin
    members: ['EMP-001', 'EMP-002'],
    status: 'ACTIVE',
    performanceScore: 94,
    activeTasks: 12,
    createdAt: new Date().toISOString(),
    _v: 1
  },
  {
    id: 'TEAM-02',
    name: 'Lagos Talent Hub',
    description: 'Regional recruitment and talent management group.',
    department: 'Human Resources',
    hub: 'Lagos HQ',
    managerId: 'EMP-003',
    members: ['EMP-003', 'EMP-004'],
    status: 'ACTIVE',
    performanceScore: 88,
    activeTasks: 5,
    createdAt: new Date().toISOString(),
    _v: 1
  }
];

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  useEffect(() => {
    const savedTeams = localStorage.getItem('suler_teams');
    if (savedTeams) {
      setTeams(JSON.parse(savedTeams));
    } else {
      setTeams(SEEDED_TEAMS);
      localStorage.setItem('suler_teams', JSON.stringify(SEEDED_TEAMS));
    }
  }, []);

  const syncState = (nextTeams: Team[]) => {
    setTeams(nextTeams);
    localStorage.setItem('suler_teams', JSON.stringify(nextTeams));
  };

  const addTeam = (teamData: Omit<Team, 'id' | 'status' | 'performanceScore' | 'activeTasks' | 'createdAt' | '_v'>) => {
    const newTeam: Team = {
      ...teamData,
      id: `TEAM-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      status: 'ACTIVE',
      performanceScore: 0,
      activeTasks: 0,
      createdAt: new Date().toISOString(),
      _v: 1
    };
    
    syncState([...teams, newTeam]);

    pushActivity({
      type: 'GOVERNANCE',
      label: 'Operational Team Created',
      message: `New execution unit [${newTeam.name}] established within ${newTeam.hub}.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    const nextTeams = teams.map(t => t.id === id ? { ...t, ...updates, _v: t._v + 1 } : t);
    syncState(nextTeams);

    pushActivity({
      type: 'GOVERNANCE',
      label: 'Team Parameters Mutated',
      message: `Operational configuration for [${teams.find(t => t.id === id)?.name}] updated.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const deleteTeam = (id: string) => {
    const teamToDelete = teams.find(t => t.id === id);
    if (!teamToDelete) return;

    syncState(teams.filter(t => t.id !== id));

    pushActivity({
      type: 'GOVERNANCE',
      label: 'Operational Team Dissolved',
      message: `Execution unit [${teamToDelete.name}] has been decommissioned.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const addMemberToTeam = (teamId: string, employeeId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team && !team.members.includes(employeeId)) {
      updateTeam(teamId, { members: [...team.members, employeeId] });
    }
  };

  const removeMemberFromTeam = (teamId: string, employeeId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      updateTeam(teamId, { members: team.members.filter(id => id !== employeeId) });
    }
  };

  const assignTeamManager = (teamId: string, employeeId: string) => {
    updateTeam(teamId, { managerId: employeeId });
  };

  return (
    <TeamContext.Provider value={{ 
      teams, 
      addTeam, 
      updateTeam, 
      deleteTeam, 
      addMemberToTeam, 
      removeMemberFromTeam, 
      assignTeamManager 
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeams = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeams must be used within a TeamProvider');
  }
  return context;
};

export const useTeam = useTeams;
