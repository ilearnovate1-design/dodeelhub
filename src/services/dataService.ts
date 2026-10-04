import {
  Activity,
  CDSDocument,
  LearningResource,
  LocalGovernment,
  Member,
  MonthlyReport,
  Task,
  TaskEvidence,
  TaskManualProgress,
  SystemSettings,
  UserRole,
  AccountStatus,
  MembershipStatus,
} from '../types';
import { calculateTaskStatus, enrichTaskWithStatus } from '../utils/taskStatus';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  INITIAL_ACTIVITIES,
  INITIAL_DOCUMENTS,
  INITIAL_LEARNING,
  INITIAL_LGS,
  INITIAL_MEMBERS,
  INITIAL_REPORTS,
  INITIAL_TASKS,
} from './mockData';

const STORAGE_KEYS = {
  INITIALIZED: 'dodeel_firebase_initialized_v1',
};

class DataService {
  private listeners: Set<() => void> = new Set();
  private cache: {
    members: Member[];
    tasks: Task[];
    activities: Activity[];
    documents: CDSDocument[];
    learning: LearningResource[];
    reports: MonthlyReport[];
    lgs: LocalGovernment[];
    settings: SystemSettings;
  } = {
    members: [],
    tasks: [],
    activities: [],
    documents: [],
    learning: [],
    reports: [],
    lgs: [],
    settings: {
      stateSecretariat: 'Ondo State NYSC Directorate',
      operationalBatch: '2026 Batch A',
      operationalBatches: ['2026 Batch A', '2025 Batch C', '2025 Batch B'],
      state: 'Ondo State',
    },
  };

  private unsubscribers: Array<() => void> = [];

  constructor() {
    // Listeners are now triggered by AuthContext once user is confirmed
  }

  public initRealtimeListeners() {
    this.stopRealtimeListeners();
    console.log('Initializing Firestore listeners...');

    const handleError = (collectionName: string) => (error: any) => {
      console.error(`Firestore error in ${collectionName} listener:`, error);
    };

    // Sync all collections in realtime
    this.unsubscribers.push(
      onSnapshot(collection(db, 'members'), 
        (snapshot) => {
          this.cache.members = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
          this.notify();
        },
        handleError('members')
      )
    );

    this.unsubscribers.push(
      onSnapshot(collection(db, 'tasks'), 
        (snapshot) => {
          this.cache.tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)).map(enrichTaskWithStatus);
          this.notify();
        },
        handleError('tasks')
      )
    );

    this.unsubscribers.push(
      onSnapshot(collection(db, 'activities'), 
        (snapshot) => {
          this.cache.activities = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Activity));
          this.notify();
        },
        handleError('activities')
      )
    );

    this.unsubscribers.push(
      onSnapshot(collection(db, 'lgs'), 
        (snapshot) => {
          this.cache.lgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LocalGovernment));
          this.notify();
        },
        handleError('lgs')
      )
    );

    this.unsubscribers.push(
      onSnapshot(collection(db, 'documents'), 
        (snapshot) => {
          this.cache.documents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CDSDocument));
          this.notify();
        },
        handleError('documents')
      )
    );

    this.unsubscribers.push(
      onSnapshot(collection(db, 'learning'), 
        (snapshot) => {
          this.cache.learning = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LearningResource));
          this.notify();
        },
        handleError('learning')
      )
    );

    this.unsubscribers.push(
      onSnapshot(collection(db, 'reports'), 
        (snapshot) => {
          this.cache.reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MonthlyReport));
          this.notify();
        },
        handleError('reports')
      )
    );

    this.unsubscribers.push(
      onSnapshot(doc(db, 'settings', 'global'), 
        (snapshot) => {
          if (snapshot.exists()) {
            this.cache.settings = snapshot.data() as SystemSettings;
            this.notify();
          }
        },
        handleError('settings')
      )
    );
  }

  public stopRealtimeListeners() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in subscriber callback:', err);
      }
    });
  }

  public async seedInitialData(force = false) {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (initialized && !force) return;

    console.log('Seeding/Resetting initial data to Firestore...');
    const batch = writeBatch(db);
    
    // Seed settings
    const settingsRef = doc(db, 'settings', 'global');
    batch.set(settingsRef, {
      stateSecretariat: 'Ondo State NYSC Directorate',
      operationalBatch: '2026 Batch A',
      operationalBatches: ['2026 Batch A', '2025 Batch C', '2025 Batch B'],
      state: 'Ondo State',
    });

    // Seed members
    for (const m of INITIAL_MEMBERS) {
      const ref = doc(db, 'members', m.id);
      batch.set(ref, m);
    }

    // Seed tasks
    for (const t of INITIAL_TASKS) {
      const ref = doc(db, 'tasks', t.id);
      batch.set(ref, t);
    }

    // Seed activities
    for (const a of INITIAL_ACTIVITIES) {
      const ref = doc(db, 'activities', a.id);
      batch.set(ref, a);
    }

    // Seed LGs
    for (const lg of INITIAL_LGS) {
      const ref = doc(db, 'lgs', lg.id);
      batch.set(ref, lg);
    }

    // Seed documents
    for (const d of INITIAL_DOCUMENTS) {
      const ref = doc(db, 'documents', d.id);
      batch.set(ref, d);
    }

    // Seed learning
    for (const l of INITIAL_LEARNING) {
      const ref = doc(db, 'learning', l.id);
      batch.set(ref, l);
    }

    await batch.commit();
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  public async forceClearDemoContentAsync(): Promise<void> {
    console.log('Force clearing all demo content to make application production ready...');
    
    // 1. Purge all demo operational collections
    const collectionsToPurge = ['tasks', 'activities', 'documents', 'learning', 'reports', 'announcements'];
    for (const collName of collectionsToPurge) {
      try {
        const snapshot = await getDocs(collection(db, collName));
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (err) {
        console.warn(`Error purging collection ${collName}:`, err);
      }
    }

    // 2. Purge non-superadmin demo members from members & users collections
    const superAdminEmails = ['kolawoles445@gmail.com', 'jomaschools@gmail.com'];
    for (const collName of ['members', 'users']) {
      try {
        const snap = await getDocs(collection(db, collName));
        if (!snap.empty) {
          const batch = writeBatch(db);
          let count = 0;
          snap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const email = (data.email || '').toLowerCase().trim();
            if (!superAdminEmails.includes(email)) {
              batch.delete(docSnap.ref);
              count++;
            }
          });
          if (count > 0) {
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn(`Error cleaning demo users in ${collName}:`, err);
      }
    }

    // 3. Re-seed the clean official 18 Ondo State LG chapters
    try {
      const lgBatch = writeBatch(db);
      for (const lg of INITIAL_LGS) {
        const ref = doc(db, 'lgs', lg.id);
        lgBatch.set(ref, { ...lg, activeMemberCount: 0 });
      }
      await lgBatch.commit();
    } catch (err) {
      console.warn('Error resetting LGs:', err);
    }

    // 4. Re-seed clean system settings
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        stateSecretariat: 'Ondo State NYSC Directorate',
        operationalBatch: '2026 Batch A',
        operationalBatches: ['2026 Batch A', '2025 Batch C', '2025 Batch B'],
        state: 'Ondo State',
      });
    } catch (err) {
      console.warn('Error resetting settings:', err);
    }

    // 5. Ensure super admins exist and are active in both collections
    await this.ensureSuperAdminUser('kolawoles445@gmail.com', 'Kolawole (Super Admin)', 'user-kolawole');
    await this.ensureSuperAdminUser('jomaschools@gmail.com', 'Joma Schools Admin', 'user-joma');

    // 6. Update in-memory cache
    this.cache.tasks = [];
    this.cache.activities = [];
    this.cache.documents = [];
    this.cache.learning = [];
    this.cache.reports = [];
    this.cache.lgs = INITIAL_LGS.map((l) => ({ ...l, activeMemberCount: 0 }));
    this.cache.members = this.cache.members.filter((m) => superAdminEmails.includes(m.email.toLowerCase().trim()));
    this.notify();

    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem('dodeel_production_purged_v1', 'true');
    console.log('Production environment successfully initialized with zero demo records.');
  }

  public async clearAllDataAsync() {
    console.warn('Clearing all operational data from Firestore...');
    const collections = ['members', 'tasks', 'activities', 'lgs', 'documents', 'learning', 'reports'];
    
    for (const collName of collections) {
      const snapshot = await getDocs(collection(db, collName));
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    
    // Also clear settings
    await deleteDoc(doc(db, 'settings', 'global'));
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  }

  // --- SYSTEM SETTINGS ---
  public getSettings(): SystemSettings {
    return this.cache.settings || {
      stateSecretariat: 'Ondo State NYSC Directorate',
      operationalBatch: '2026 Batch A',
      operationalBatches: ['2026 Batch A', '2025 Batch C', '2025 Batch B'],
      state: 'Ondo State',
    };
  }

  public async saveSettings(settings: SystemSettings): Promise<void> {
    await setDoc(doc(db, 'settings', 'global'), settings);
  }

  // --- LOCAL GOVERNMENTS ---
  public getLGs(): LocalGovernment[] {
    return this.cache.lgs;
  }

  public async saveLG(lg: LocalGovernment): Promise<void> {
    await setDoc(doc(db, 'lgs', lg.id), lg);
  }

  // --- MEMBERS ---
  public getMembers(): Member[] {
    return this.cache.members;
  }

  public async getMemberByIdAsync(id: string): Promise<Member | undefined> {
    const d = await getDoc(doc(db, 'members', id));
    return d.exists() ? { id: d.id, ...d.data() } as Member : undefined;
  }

  public async ensureSuperAdminUser(email: string, fullName = 'Kolawole (Super Admin)', uid?: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.cache.members.find(m => m.email.toLowerCase() === normalizedEmail);
    const targetId = uid || existing?.id || (normalizedEmail === 'kolawoles445@gmail.com' ? 'user-kolawole' : `user-${Date.now()}`);

    const superAdminMember: Member = {
      ...(existing || {}),
      id: targetId,
      uid: targetId,
      fullName: existing?.fullName || fullName,
      email: normalizedEmail,
      phone: existing?.phone || '+234 800 000 0001',
      lgId: existing?.lgId || 'lg-akure',
      lgName: existing?.lgName || 'Ondo State NYSC Directorate (Akure)',
      state: 'Ondo State',
      role: 'CDS_COORDINATOR',
      membershipStatus: 'ACTIVE',
      accountStatus: 'ACTIVE',
      dateJoined: existing?.dateJoined || '2026-10-01',
      skills: existing?.skills?.length ? existing.skills : ['System Administration', 'Strategic Governance', 'Directorate Oversight'],
      bio: existing?.bio || 'Super Administrator & State CDS Coordinator with complete system oversight and executive authority.',
      assignedTeam: existing?.assignedTeam || 'State Directorate',
      requiresProfileUpdate: false,
    };

    await setDoc(doc(db, 'members', targetId), superAdminMember);
    try {
      await setDoc(doc(db, 'users', targetId), superAdminMember);
    } catch {
      // Non-blocking mirror write
    }
    console.log(`Super Admin status secured for ${normalizedEmail} (ID: ${targetId})`);
  }

  public generateInvitationCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `DEEL-${randomPart}`;
  };

  public inviteMemberAsync = async (
    data: Omit<Member, 'id' | 'accountStatus' | 'invitationCode'>,
    invitedByName = 'Administrator'
  ): Promise<Member> => {
    const normalizedEmail = data.email.toLowerCase().trim();
    const invitationCode = this.generateInvitationCode();
    const docId = `invite-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newMember: Member = {
      ...data,
      id: docId,
      email: normalizedEmail,
      membershipStatus: data.membershipStatus || 'PENDING',
      accountStatus: 'PENDING',
      invitationCode,
      invitedBy: invitedByName,
      invitedAt: new Date().toISOString(),
      dateJoined: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveMemberAsync(newMember);
    return newMember;
  };

  public findPendingMemberByInvite(email: string, code: string): Member | undefined {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.toUpperCase().trim();
    return this.cache.members.find(
      (m) =>
        m.email.toLowerCase().trim() === normalizedEmail &&
        (m.invitationCode?.toUpperCase().trim() === normalizedCode || m.invitationCode === code) &&
        m.accountStatus === 'PENDING'
    );
  }

  public async activateMemberAccountAsync(email: string, code: string, uid: string): Promise<Member> {
    const normalizedEmail = email.toLowerCase().trim();
    const pendingMember = this.findPendingMemberByInvite(normalizedEmail, code);

    if (!pendingMember) {
      const q = query(
        collection(db, 'members'),
        where('email', '==', normalizedEmail),
        where('accountStatus', '==', 'PENDING')
      );
      const snapshot = await getDocs(q);
      const docMatch = snapshot.docs.find((d) => {
        const data = d.data() as Member;
        return data.invitationCode?.toUpperCase().trim() === code.toUpperCase().trim();
      });

      if (!docMatch) {
        throw new Error('Invalid invitation code or email. Please verify with your LG President or CDS Coordinator.');
      }

      const rawMember = { id: docMatch.id, ...docMatch.data() } as Member;
      const oldDocId = docMatch.id;

      const activatedMember: Member = {
        ...rawMember,
        id: uid,
        uid,
        accountStatus: 'ACTIVE',
        membershipStatus: 'ACTIVE',
        invitationCode: undefined,
        activatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'members', uid), activatedMember);
      try {
        await setDoc(doc(db, 'users', uid), activatedMember);
      } catch {}
      if (oldDocId !== uid) {
        await deleteDoc(doc(db, 'members', oldDocId));
        try {
          await deleteDoc(doc(db, 'users', oldDocId));
        } catch {}
      }
      return activatedMember;
    }

    const oldDocId = pendingMember.id;
    const activatedMember: Member = {
      ...pendingMember,
      id: uid,
      uid,
      accountStatus: 'ACTIVE',
      membershipStatus: 'ACTIVE',
      invitationCode: undefined,
      activatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'members', uid), activatedMember);
    try {
      await setDoc(doc(db, 'users', uid), activatedMember);
    } catch {}
    if (oldDocId !== uid) {
      await deleteDoc(doc(db, 'members', oldDocId));
      try {
        await deleteDoc(doc(db, 'users', oldDocId));
      } catch {}
    }
    return activatedMember;
  }

  public async suspendMemberAsync(memberId: string): Promise<void> {
    await updateDoc(doc(db, 'members', memberId), {
      accountStatus: 'SUSPENDED',
      updatedAt: new Date().toISOString(),
    });
    try {
      await updateDoc(doc(db, 'users', memberId), {
        accountStatus: 'SUSPENDED',
        updatedAt: new Date().toISOString(),
      });
    } catch {}
  }

  public async reactivateMemberAsync(memberId: string): Promise<void> {
    await updateDoc(doc(db, 'members', memberId), {
      accountStatus: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    });
    try {
      await updateDoc(doc(db, 'users', memberId), {
        accountStatus: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      });
    } catch {}
  }

  public resendInvitationAsync = async (memberId: string): Promise<{ invitationCode: string }> => {
    const invitationCode = this.generateInvitationCode();
    await updateDoc(doc(db, 'members', memberId), {
      invitationCode,
      accountStatus: 'PENDING',
      invitedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    try {
      await updateDoc(doc(db, 'users', memberId), {
        invitationCode,
        accountStatus: 'PENDING',
        invitedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch {}
    return { invitationCode };
  };

  public async updateMemberRoleAsync(memberId: string, role: UserRole): Promise<void> {
    await updateDoc(doc(db, 'members', memberId), {
      role,
      updatedAt: new Date().toISOString(),
    });
    try {
      await updateDoc(doc(db, 'users', memberId), {
        role,
        updatedAt: new Date().toISOString(),
      });
    } catch {}
  }

  public async updateMemberLGAsync(memberId: string, lgId: string, lgName: string): Promise<void> {
    const member = await this.getMemberByIdAsync(memberId);
    const oldLgId = member?.lgId;

    await updateDoc(doc(db, 'members', memberId), {
      lgId,
      lgName,
      updatedAt: new Date().toISOString(),
    });
    try {
      await updateDoc(doc(db, 'users', memberId), {
        lgId,
        lgName,
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    if (oldLgId && oldLgId !== 'ALL' && oldLgId !== lgId) {
      const oldLgDoc = await getDoc(doc(db, 'lgs', oldLgId));
      if (oldLgDoc.exists()) {
        const oldLgCount = this.cache.members.filter((m) => m.lgId === oldLgId && m.id !== memberId).length;
        await updateDoc(doc(db, 'lgs', oldLgId), { activeMemberCount: Math.max(0, oldLgCount) });
      }
    }
    if (lgId && lgId !== 'ALL') {
      const newLgDoc = await getDoc(doc(db, 'lgs', lgId));
      if (newLgDoc.exists()) {
        const newLgCount = this.cache.members.filter((m) => m.lgId === lgId || m.id === memberId).length;
        await updateDoc(doc(db, 'lgs', lgId), { activeMemberCount: newLgCount });
      }
    }
  }

  public async saveMemberAsync(member: Member): Promise<void> {
    await setDoc(doc(db, 'members', member.id), member);
    try {
      await setDoc(doc(db, 'users', member.id), member);
    } catch {}
    
    // Update LG active count using a consistent calculation
    if (member.lgId && member.lgId !== 'ALL') {
      // Re-calculate based on current cache + the new member if not already there
      const currentMembers = this.cache.members.some(m => m.id === member.id) 
        ? this.cache.members 
        : [...this.cache.members, member];
      
      const count = currentMembers.filter(m => m.lgId === member.lgId).length;
      
      const lgDoc = await getDoc(doc(db, 'lgs', member.lgId));
      if (lgDoc.exists()) {
        await updateDoc(doc(db, 'lgs', member.lgId), {
          activeMemberCount: count
        });
      }
    }
  }

  public async deleteMember(id: string): Promise<void> {
    const member = await this.getMemberByIdAsync(id);
    await deleteDoc(doc(db, 'members', id));
    
    // Update LG active count if member existed
    if (member && member.lgId && member.lgId !== 'ALL') {
      const count = this.cache.members.filter(m => m.lgId === member.lgId && m.id !== id).length;
      
      const lgDoc = await getDoc(doc(db, 'lgs', member.lgId));
      if (lgDoc.exists()) {
        await updateDoc(doc(db, 'lgs', member.lgId), {
          activeMemberCount: Math.max(0, count)
        });
      }
    }
  }

  // --- TASKS ---
  public getTasks(): Task[] {
    return this.cache.tasks;
  }

  public async saveTask(task: Task): Promise<void> {
    task.updatedAt = new Date().toISOString();
    task.hasEvidence = Boolean(task.evidence);
    if (task.completedAt && !task.completionDate) {
      task.completionDate = task.completedAt;
    }
    task.calculatedStatus = calculateTaskStatus(task);
    task.status = task.calculatedStatus;
    
    await setDoc(doc(db, 'tasks', task.id), task);
  }

  public async updateTaskProgress(
    taskId: string,
    manualProgress: TaskManualProgress,
    evidence?: TaskEvidence,
    result?: string
  ): Promise<void> {
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) return;
    const task = taskDoc.data() as Task;

    const updates: any = {
      manualProgress,
      updatedAt: new Date().toISOString()
    };
    
    if (evidence) updates.evidence = evidence;
    if (result !== undefined) updates.result = result;
    
    if (manualProgress === 'COMPLETED' && !task.completedAt) {
      updates.completionDate = new Date().toISOString().split('T')[0];
      updates.completedAt = new Date().toISOString();
    }
    
    await updateDoc(doc(db, 'tasks', taskId), updates);
  }

  /**
   * Reopens a completed task by authorized leadership with a recorded reason
   */
  public async reopenTask(
    taskId: string,
    userId: string,
    userName: string,
    userRole: any,
    reason: string,
    newDeadline?: string
  ): Promise<void> {
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) return;
    const task = taskDoc.data() as Task;

    const timestamp = new Date().toISOString();
    const reopenRecord = {
      reopenedAt: timestamp,
      reopenedBy: userId,
      reopenedByName: userName,
      reason,
    };

    const newComment = {
      id: `reopen-${Date.now()}`,
      authorId: userId,
      authorName: userName,
      authorRole: userRole,
      text: `🔄 Responsibility Reopened by ${userName}: "${reason}"${
        newDeadline ? ` (Deadline updated to: ${newDeadline})` : ''
      }`,
      createdAt: timestamp,
    };

    const updates: any = {
      manualProgress: 'IN_PROGRESS' as TaskManualProgress,
      completedAt: null,
      completionDate: null,
      reopenedAt: timestamp,
      reopenedBy: userId,
      reopenedByName: userName,
      reopenReason: reason,
      reopenHistory: [...(task.reopenHistory || []), reopenRecord],
      comments: [...(task.comments || []), newComment],
      updatedAt: timestamp
    };

    if (newDeadline) {
      updates.deadline = newDeadline;
    }

    await updateDoc(doc(db, 'tasks', taskId), updates);
  }

  public async addTaskComment(
    taskId: string,
    authorId: string,
    authorName: string,
    authorRole: any,
    text: string
  ): Promise<void> {
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) return;
    const task = taskDoc.data() as Task;

    const newComment = {
      id: `comm-${Date.now()}`,
      authorId,
      authorName,
      authorRole,
      text,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, 'tasks', taskId), {
      comments: [...(task.comments || []), newComment],
      updatedAt: new Date().toISOString()
    });
  }

  public async deleteTask(id: string): Promise<void> {
    await deleteDoc(doc(db, 'tasks', id));
  }

  // --- ACTIVITIES & ATTENDANCE ---
  public getActivities(): Activity[] {
    return this.cache.activities;
  }

  public async saveActivity(activity: Activity): Promise<void> {
    await setDoc(doc(db, 'activities', activity.id), activity);
  }

  public async deleteActivity(id: string): Promise<void> {
    await deleteDoc(doc(db, 'activities', id));
  }

  public async recordBulkAttendance(
    activityId: string,
    records: Array<{ memberId: string; memberName: string; status: 'PRESENT' | 'ABSENT' }>,
    markedBy: string
  ): Promise<void> {
    const activityDoc = await getDoc(doc(db, 'activities', activityId));
    if (!activityDoc.exists()) return;
    const activity = activityDoc.data() as Activity;

    const now = new Date().toISOString();
    const existingMap = new Map(activity.attendanceRecords?.map((r) => [r.memberId, r]) || []);

    records.forEach((r) => {
      existingMap.set(r.memberId, {
        memberId: r.memberId,
        memberName: r.memberName,
        status: r.status,
        markedAt: now,
        markedBy,
      });
    });

    await updateDoc(doc(db, 'activities', activityId), {
      attendanceRecords: Array.from(existingMap.values()),
      updatedAt: now
    });
  }

  // --- DOCUMENTS ---
  public getDocuments(): CDSDocument[] {
    return this.cache.documents;
  }

  public async saveDocument(docData: CDSDocument): Promise<void> {
    await setDoc(doc(db, 'documents', docData.id), docData);
  }

  public async deleteDocument(id: string): Promise<void> {
    await deleteDoc(doc(db, 'documents', id));
  }

  // --- LEARNING RESOURCES ---
  public getLearning(): LearningResource[] {
    return this.cache.learning;
  }

  public async saveLearning(resource: LearningResource): Promise<void> {
    await setDoc(doc(db, 'learning', resource.id), resource);
  }

  public async deleteLearning(id: string): Promise<void> {
    await deleteDoc(doc(db, 'learning', id));
  }

  // --- MONTHLY REPORTS ---
  public getReports(): MonthlyReport[] {
    return this.cache.reports;
  }

  public async saveReport(report: MonthlyReport): Promise<void> {
    await setDoc(doc(db, 'reports', report.id), report);
  }
}

export const dataService = new DataService();
