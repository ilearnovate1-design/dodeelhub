import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { dataService } from '../services/dataService';
import { Member, UserRole } from '../types';
import { isSuperAdminEmail, ROLE_LABELS } from '../utils/permissions';

interface AuthContextType {
  currentUser: Member | null;
  currentRole: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData: Partial<Member>) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  updateCurrentUserProfile: (updates: Partial<Member>) => Promise<void>;
  availableRoles: Array<{ role: UserRole; label: string; desc: string }>;
  allUsers: Member[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  CDS_COORDINATOR: 'Super Admin: Highest authority, system oversight, all tasks, reports, settings',
  STATE_PRESIDENT: 'Operational coordination: All LGs, performance, learning, state activities',
  VP_GROWTH: 'Membership growth, social media, visibility campaigns, learning content',
  VP_ACCOUNTABILITY: 'Task monitoring, executive deadlines, evidence audits, KPI tracking',
  VP_COMMUNITY_IMPACT: 'Outreach reports, beneficiary tracking, impact assessment',
  LG_PRESIDENT: 'LG operations: Local members, LG tasks, activities, attendance & reports',
  EXECUTIVE: 'Operational officer: Tasks execution, evidence submission, activity coordination',
  GROUP_LEADER: 'Team leader: Group tasks, member attendance, field implementation',
  MEMBER: 'Standard member: My tasks, resources, CDS documents, attendance record',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        dataService.initRealtimeListeners();
        // If this user is a designated Super Admin, guarantee their Firestore member record exists as CDS_COORDINATOR
        if (isSuperAdminEmail(user.email)) {
          try {
            await dataService.ensureSuperAdminUser(
              user.email!,
              user.displayName || (user.email?.toLowerCase().includes('kolawole') ? 'Kolawole (Super Admin)' : 'Joma Schools Admin'),
              user.uid
            );
          } catch (err) {
            console.error('Error auto-provisioning super admin:', err);
          }
        }
      } else {
        dataService.stopRealtimeListeners();
      }
      setLoading(false);
    });

    const unsubscribeData = dataService.subscribe(() => {
      setMembers(dataService.getMembers());
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData();
      dataService.stopRealtimeListeners();
    };
  }, []);

  const matchedUser = members.find((m) => m.id === firebaseUser?.uid) ||
    members.find((m) => m.email.toLowerCase() === firebaseUser?.email?.toLowerCase()) ||
    null;

  const isSuperAdmin = isSuperAdminEmail(firebaseUser?.email);

  // If user is super admin, enforce CDS_COORDINATOR role and supply super admin defaults if member doc is loading
  const currentUser: Member | null = matchedUser
    ? (isSuperAdmin ? { ...matchedUser, role: 'CDS_COORDINATOR' } : matchedUser)
    : (firebaseUser && isSuperAdmin
        ? {
            id: firebaseUser.uid,
            fullName: firebaseUser.displayName || 'Kolawole (Super Admin)',
            email: firebaseUser.email?.toLowerCase() || 'kolawoles445@gmail.com',
            phone: '+234 800 000 0001',
            lgId: 'lg-akure',
            lgName: 'Ondo State NYSC Directorate (Akure)',
            state: 'Ondo State',
            role: 'CDS_COORDINATOR',
            membershipStatus: 'ACTIVE',
            dateJoined: '2026-10-01',
            skills: ['System Administration', 'Strategic Governance', 'Directorate Oversight'],
            bio: 'Super Administrator & State CDS Coordinator with complete system oversight and executive authority.',
            assignedTeam: 'State Directorate',
          }
        : null);

  const currentRole: UserRole = isSuperAdmin ? 'CDS_COORDINATOR' : (currentUser?.role || 'MEMBER');

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, userData: Partial<Member>) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const normalizedEmail = email.toLowerCase().trim();
    const isSuper = isSuperAdminEmail(normalizedEmail);
    const role: UserRole = isSuper ? 'CDS_COORDINATOR' : ((userData.role as UserRole) || 'MEMBER');

    const newMember: Member = {
      ...userData,
      id: user.uid,
      fullName: userData.fullName || (isSuper ? 'Kolawole (Super Admin)' : ''),
      email: normalizedEmail,
      phone: userData.phone || '+234 800 000 0001',
      lgId: userData.lgId || 'lg-akure',
      lgName: userData.lgName || 'Ondo State NYSC Directorate (Akure)',
      state: userData.state || 'Ondo State',
      role,
      membershipStatus: 'ACTIVE',
      dateJoined: new Date().toISOString().split('T')[0],
      requiresProfileUpdate: !isSuper,
      skills: isSuper ? ['System Administration', 'Strategic Governance', 'Directorate Oversight'] : [],
      bio: isSuper ? 'Super Administrator & State CDS Coordinator with complete system oversight and executive authority.' : '',
      assignedTeam: isSuper ? 'State Directorate' : undefined,
    } as Member;
    await dataService.saveMemberAsync(newMember);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const switchUser = (userId: string) => {
    console.warn('switchUser is legacy logic. Use Firebase Auth in production.');
  };

  const switchRole = (role: UserRole) => {
    if (currentUser) {
      updateCurrentUserProfile({ role });
    }
  };

  const updateCurrentUserProfile = async (updates: Partial<Member>) => {
    if (currentUser) {
      const updated = { ...currentUser, ...updates };
      await dataService.saveMemberAsync(updated);
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
        currentUser,
        currentRole,
        loading,
        login,
        signup,
        logout,
        switchRole,
        switchUser,
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
