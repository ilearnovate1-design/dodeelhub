import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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
  isSuspended: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, data: { fullName: string, phone: string, lgId: string, lgName: string }) => Promise<void>;
  activateAccount: (email: string, invitationCode: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
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
    ? (isSuperAdmin ? { ...matchedUser, role: 'CDS_COORDINATOR', accountStatus: 'ACTIVE' } : matchedUser)
    : (firebaseUser && isSuperAdmin
        ? {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            fullName: firebaseUser.displayName || 'Kolawole (Super Admin)',
            email: firebaseUser.email?.toLowerCase() || 'kolawoles445@gmail.com',
            phone: '+234 800 000 0001',
            lgId: 'lg-akure',
            lgName: 'Ondo State NYSC Directorate (Akure)',
            state: 'Ondo State',
            role: 'CDS_COORDINATOR',
            membershipStatus: 'ACTIVE',
            accountStatus: 'ACTIVE',
            dateJoined: '2026-10-01',
            skills: ['System Administration', 'Strategic Governance', 'Directorate Oversight'],
            bio: 'Super Administrator & State CDS Coordinator with complete system oversight and executive authority.',
            assignedTeam: 'State Directorate',
          }
        : null);

  const isSuspended = Boolean(currentUser && currentUser.accountStatus === 'SUSPENDED' && !isSuperAdmin);
  const currentRole: UserRole = isSuperAdmin ? 'CDS_COORDINATOR' : (currentUser?.role || 'MEMBER');

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    // If the account in Firestore is suspended, we still let them sign in to show the suspension state
    if (cred.user) {
      const doc = await dataService.getMemberByIdAsync(cred.user.uid);
      if (doc && doc.accountStatus === 'SUSPENDED' && !isSuperAdminEmail(cred.user.email)) {
        console.warn('Suspended user logged in:', cred.user.email);
      }
    }
  };

  const register = async (email: string, password: string, data: { fullName: string, phone: string, lgId: string, lgName: string }) => {
    const settings = dataService.getSettings();
    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    
    await dataService.registerMemberAsync(cred.user.uid, {
      ...data,
      email: email.trim().toLowerCase(),
      state: settings.state,
      operationalBatch: settings.operationalBatch,
    });
  };

  /**
   * Controlled Member Activation Flow:
   * 1. Authenticate the user (Sign in or Create)
   * 2. Validate invitation / link profile in Firestore
   */
  const activateAccount = async (email: string, invitationCode: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = invitationCode.trim().toUpperCase();

    // 1. Authenticate FIRST to get Firestore read permission
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-in-use') {
        try {
          userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        } catch {
          throw new Error('An account with this email already exists. Please use the "Forgot Password" link if you cannot sign in.');
        }
      } else {
        throw authError;
      }
    }

    // 2. Link the Firebase Auth user to the Member profile
    try {
      await dataService.activateMemberAccountAsync(normalizedEmail, normalizedCode, userCredential.user.uid);
    } catch (err: any) {
      // 3. Cleanup: If linking fails (wrong code/no profile), log them out so they can try again
      await signOut(auth);
      throw err;
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
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
      const updated = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
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
        isSuspended,
        loading,
        login,
        register,
        activateAccount,
        sendPasswordReset,
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
