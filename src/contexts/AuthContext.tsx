import React, { createContext, useContext, useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { Member, UserRole } from '../types';
import { ROLE_LABELS } from '../utils/permissions';

interface AuthContextType {
  currentUser: Member | null;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  logout: () => void;
  updateCurrentUserProfile: (updates: Partial<Member>) => void;
  availableRoles: Array<{ role: UserRole; label: string; desc: string }>;
  allUsers: Member[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  CDS_COORDINATOR: 'Highest authority: System oversight, all tasks, reports, settings',
  STATE_PRESIDENT: 'Operational coordination: All LGs, performance, learning, state activities',
  VP_GROWTH: 'Membership growth, social media, visibility campaigns, learning content',
  VP_ACCOUNTABILITY: 'Task monitoring, executive deadlines, evidence audits, KPI tracking',
  VP_COMMUNITY_IMPACT: 'Outreach reports, beneficiary tracking, impact assessment',
  LG_PRESIDENT: 'LG operations: Local members, LG tasks, activities, attendance & reports',
  EXECUTIVE: 'Operational officer: Tasks execution, evidence submission, activity coordination',
  GROUP_LEADER: 'Team leader: Group tasks, member attendance, field implementation',
  MEMBER: 'Standard member: My tasks, resources, CDS documents, attendance record',
};

const CURRENT_USER_KEY = 'dodeel_active_user_id_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>(() => dataService.getMembers());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_USER_KEY);
  });

  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setMembers(dataService.getMembers());
    });
    return unsubscribe;
  }, []);

  const currentUser = members.find((m) => m.id === currentUserId);

  const currentRole = currentUser?.role || 'MEMBER';

  const switchUser = (userId: string) => {
    const target = members.find((m) => m.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      localStorage.setItem(CURRENT_USER_KEY, target.id);
      
      // Mark last login
      dataService.saveMember({
        ...target,
        lastLogin: new Date().toISOString()
      });
    }
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUserId(null);
  };

  const switchRole = (role: UserRole) => {
    // Find member with this role or update the current user's role
    const existing = members.find((m) => m.role === role);
    if (existing) {
      setCurrentUserId(existing.id);
      localStorage.setItem(CURRENT_USER_KEY, existing.id);
    } else if (currentUser) {
      // If none has this exact role, update current user role
      const updated = { ...currentUser, role };
      dataService.saveMember(updated);
    }
  };

  const updateCurrentUserProfile = (updates: Partial<Member>) => {
    if (currentUser) {
      const updated = { ...currentUser, ...updates };
      dataService.saveMember(updated);
    }
  };

  const availableRoles = (Object.keys(ROLE_LABELS) as UserRole[]).map((role) => ({
    role,
    label: ROLE_LABELS[role],
    desc: ROLE_DESCRIPTIONS[role],
  }));

  return (
    <AuthContext.Provider
      value={{
        currentUser: currentUser || null,
        currentRole,
        switchRole,
        switchUser,
        logout,
        updateCurrentUserProfile,
        availableRoles,
        allUsers: members,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
