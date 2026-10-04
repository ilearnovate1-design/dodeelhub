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
      fullName: existing?.fullName || fullName,
      email: normalizedEmail,
      phone: existing?.phone || '+234 800 000 0001',
      lgId: existing?.lgId || 'lg-akure',
      lgName: existing?.lgName || 'Ondo State NYSC Directorate (Akure)',
      state: 'Ondo State',
      role: 'CDS_COORDINATOR',
      membershipStatus: 'ACTIVE',
      dateJoined: existing?.dateJoined || '2026-10-01',
      skills: existing?.skills?.length ? existing.skills : ['System Administration', 'Strategic Governance', 'Directorate Oversight'],
      bio: existing?.bio || 'Super Administrator & State CDS Coordinator with complete system oversight and executive authority.',
      assignedTeam: existing?.assignedTeam || 'State Directorate',
      password: existing?.password || 'password123',
      requiresProfileUpdate: false,
    };

    await setDoc(doc(db, 'members', targetId), superAdminMember);
    console.log(`Super Admin status secured for ${normalizedEmail} (ID: ${targetId})`);
  }

  public async saveMemberAsync(member: Member): Promise<void> {
    await setDoc(doc(db, 'members', member.id), member);
    
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
