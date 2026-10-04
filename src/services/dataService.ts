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
  INITIAL_ACTIVITIES,
  INITIAL_DOCUMENTS,
  INITIAL_LEARNING,
  INITIAL_LGS,
  INITIAL_MEMBERS,
  INITIAL_REPORTS,
  INITIAL_TASKS,
} from './mockData';

const STORAGE_KEYS = {
  MEMBERS: 'dodeel_members_v2',
  TASKS: 'dodeel_tasks_v2',
  ACTIVITIES: 'dodeel_activities_v2',
  DOCUMENTS: 'dodeel_documents_v2',
  LEARNING: 'dodeel_learning_v2',
  REPORTS: 'dodeel_reports_v2',
  LGS: 'dodeel_lgs_v2',
  SETTINGS: 'dodeel_settings_v2',
  INITIALIZED: 'dodeel_initialized_v2',
};

class DataService {
  private listeners: Set<() => void> = new Set();
  private cache: {
    members: Member[] | null;
    tasks: Task[] | null;
    activities: Activity[] | null;
    documents: CDSDocument[] | null;
    learning: LearningResource[] | null;
    reports: MonthlyReport[] | null;
    lgs: LocalGovernment[] | null;
    settings: SystemSettings | null;
  } = {
    members: null,
    tasks: null,
    activities: null,
    documents: null,
    learning: null,
    reports: null,
    lgs: null,
    settings: null,
  };

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      this.resetToSampleData();
    }
  }

  private clearCache() {
    this.cache = {
      members: null,
      tasks: null,
      activities: null,
      documents: null,
      learning: null,
      reports: null,
      lgs: null,
      settings: null,
    };
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.clearCache();
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in subscriber callback:', err);
      }
    });
  }

  public resetToSampleData() {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
    localStorage.setItem(STORAGE_KEYS.LEARNING, JSON.stringify(INITIAL_LEARNING));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
    localStorage.setItem(STORAGE_KEYS.LGS, JSON.stringify(INITIAL_LGS));
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        stateSecretariat: 'Ondo State NYSC Directorate',
        operationalBatch: '2026 Batch A',
        operationalBatches: ['2026 Batch A', '2025 Batch C', '2025 Batch B'],
        state: 'Ondo State',
      })
    );
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    this.notify();
  }

  public clearAllData() {
    if (typeof window === 'undefined') return;
    
    // Clear all keys with dodeel_ prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dodeel_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Set a flag so it doesn't auto-reinitialize immediately if not desired
    // (though usually we WANT it to re-initialize on next refresh if empty)
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'cleared');
    
    this.notify();
  }

  // --- SYSTEM SETTINGS ---
  public getSettings(): SystemSettings {
    if (this.cache.settings) return this.cache.settings;
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const data = raw
      ? JSON.parse(raw)
      : {
          stateSecretariat: 'Ondo State NYSC Directorate',
          operationalBatch: '2026 Batch A',
          operationalBatches: ['2026 Batch A', '2025 Batch C', '2025 Batch B'],
          state: 'Ondo State',
        };
    this.cache.settings = data;
    return data;
  }

  public saveSettings(settings: SystemSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.notify();
  }

  // --- LOCAL GOVERNMENTS ---
  public getLGs(): LocalGovernment[] {
    if (this.cache.lgs) return this.cache.lgs;
    const raw = localStorage.getItem(STORAGE_KEYS.LGS);
    const data = raw ? JSON.parse(raw) : INITIAL_LGS;
    this.cache.lgs = data;
    return data;
  }

  public saveLG(lg: LocalGovernment): void {
    const lgs = this.getLGs();
    const index = lgs.findIndex((l) => l.id === lg.id);
    if (index >= 0) {
      lgs[index] = lg;
    } else {
      lgs.push(lg);
    }
    localStorage.setItem(STORAGE_KEYS.LGS, JSON.stringify(lgs));
    this.notify();
  }

  // --- MEMBERS ---
  public getMembers(): Member[] {
    if (this.cache.members) return this.cache.members;
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    const data = raw ? JSON.parse(raw) : INITIAL_MEMBERS;
    this.cache.members = data;
    return data;
  }

  public getMemberById(id: string): Member | undefined {
    return this.getMembers().find((m) => m.id === id);
  }

  public saveMember(member: Member): void {
    const members = this.getMembers();
    const index = members.findIndex((m) => m.id === member.id);
    if (index >= 0) {
      members[index] = member;
    } else {
      members.unshift(member);
    }
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    this.notify();
  }

  public deleteMember(id: string): void {
    const members = this.getMembers().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    this.notify();
  }

  // --- TASKS ---
  public getTasks(): Task[] {
    if (this.cache.tasks) return this.cache.tasks;
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks: Task[] = raw ? JSON.parse(raw) : INITIAL_TASKS;
    const enriched = tasks.map(enrichTaskWithStatus);
    this.cache.tasks = enriched;
    return enriched;
  }

  public getTaskById(id: string): Task | undefined {
    return this.getTasks().find((t) => t.id === id);
  }

  public saveTask(task: Task): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    task.updatedAt = new Date().toISOString();
    task.assignedTo = task.assignedTo || task.assignedUserId;
    task.assignedBy = task.assignedBy || task.createdBy;
    task.assignedLG = task.assignedLG || task.lgId;
    task.hasEvidence = Boolean(task.evidence);
    if (task.completedAt && !task.completionDate) {
      task.completionDate = task.completedAt;
    }
    task.calculatedStatus = calculateTaskStatus(task);
    task.status = task.calculatedStatus;

    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.unshift(task);
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.notify();
  }

  public updateTaskProgress(
    taskId: string,
    manualProgress: TaskManualProgress,
    evidence?: TaskEvidence,
    result?: string
  ): void {
    const task = this.getTaskById(taskId);
    if (!task) return;

    task.manualProgress = manualProgress;
    if (evidence) {
      task.evidence = evidence;
    }
    if (result !== undefined) {
      task.result = result;
    }
    if (manualProgress === 'COMPLETED' && !task.completionDate) {
      task.completionDate = new Date().toISOString().split('T')[0];
      task.completedAt = new Date().toISOString();
    }
    this.saveTask(task);
  }

  /**
   * Reopens a completed task by authorized leadership with a recorded reason
   */
  public reopenTask(
    taskId: string,
    userId: string,
    userName: string,
    userRole: any,
    reason: string,
    newDeadline?: string
  ): void {
    const task = this.getTaskById(taskId);
    if (!task) return;

    const timestamp = new Date().toISOString();
    task.manualProgress = 'IN_PROGRESS';
    task.completedAt = undefined;
    task.completionDate = undefined;
    if (newDeadline) {
      task.deadline = newDeadline;
    }

    task.reopenedAt = timestamp;
    task.reopenedBy = userId;
    task.reopenedByName = userName;
    task.reopenReason = reason;

    if (!task.reopenHistory) {
      task.reopenHistory = [];
    }
    task.reopenHistory.push({
      reopenedAt: timestamp,
      reopenedBy: userId,
      reopenedByName: userName,
      reason,
    });

    // Add audit comment
    task.comments.push({
      id: `reopen-${Date.now()}`,
      authorId: userId,
      authorName: userName,
      authorRole: userRole,
      text: `🔄 Responsibility Reopened by ${userName}: "${reason}"${
        newDeadline ? ` (Deadline updated to: ${newDeadline})` : ''
      }`,
      createdAt: timestamp,
    });

    this.saveTask(task);
  }

  public addTaskComment(
    taskId: string,
    authorId: string,
    authorName: string,
    authorRole: any,
    text: string
  ): void {
    const task = this.getTaskById(taskId);
    if (!task) return;

    const newComment = {
      id: `comm-${Date.now()}`,
      authorId,
      authorName,
      authorRole,
      text,
      createdAt: new Date().toISOString(),
    };

    task.comments.push(newComment);
    this.saveTask(task);
  }

  public deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.notify();
  }

  // --- ACTIVITIES & ATTENDANCE ---
  public getActivities(): Activity[] {
    if (this.cache.activities) return this.cache.activities;
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    const data = raw ? JSON.parse(raw) : INITIAL_ACTIVITIES;
    this.cache.activities = data;
    return data;
  }

  public getActivityById(id: string): Activity | undefined {
    return this.getActivities().find((a) => a.id === id);
  }

  public saveActivity(activity: Activity): void {
    const activities = this.getActivities();
    const index = activities.findIndex((a) => a.id === activity.id);
    if (index >= 0) {
      activities[index] = activity;
    } else {
      activities.unshift(activity);
    }
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    this.notify();
  }

  public recordBulkAttendance(
    activityId: string,
    records: Array<{ memberId: string; memberName: string; status: 'PRESENT' | 'ABSENT' }>,
    markedBy: string
  ): void {
    const activity = this.getActivityById(activityId);
    if (!activity) return;

    const now = new Date().toISOString();
    const existingMap = new Map(activity.attendanceRecords.map((r) => [r.memberId, r]));

    records.forEach((r) => {
      existingMap.set(r.memberId, {
        memberId: r.memberId,
        memberName: r.memberName,
        status: r.status,
        markedAt: now,
        markedBy,
      });
    });

    activity.attendanceRecords = Array.from(existingMap.values());
    this.saveActivity(activity);
  }

  public deleteActivity(id: string): void {
    const activities = this.getActivities().filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    this.notify();
  }

  // --- DOCUMENTS ---
  public getDocuments(): CDSDocument[] {
    if (this.cache.documents) return this.cache.documents;
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    const data = raw ? JSON.parse(raw) : INITIAL_DOCUMENTS;
    this.cache.documents = data;
    return data;
  }

  public saveDocument(doc: CDSDocument): void {
    const docs = this.getDocuments();
    const index = docs.findIndex((d) => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.unshift(doc);
    }
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    this.notify();
  }

  public deleteDocument(id: string): void {
    const docs = this.getDocuments().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    this.notify();
  }

  // --- LEARNING RESOURCES ---
  public getLearning(): LearningResource[] {
    if (this.cache.learning) return this.cache.learning;
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNING);
    const data = raw ? JSON.parse(raw) : INITIAL_LEARNING;
    this.cache.learning = data;
    return data;
  }

  public saveLearning(resource: LearningResource): void {
    const list = this.getLearning();
    const index = list.findIndex((r) => r.id === resource.id);
    if (index >= 0) {
      list[index] = resource;
    } else {
      list.unshift(resource);
    }
    localStorage.setItem(STORAGE_KEYS.LEARNING, JSON.stringify(list));
    this.notify();
  }

  public deleteLearning(id: string): void {
    const list = this.getLearning().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.LEARNING, JSON.stringify(list));
    this.notify();
  }

  // --- MONTHLY REPORTS ---
  public getReports(): MonthlyReport[] {
    if (this.cache.reports) return this.cache.reports;
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    const data = raw ? JSON.parse(raw) : INITIAL_REPORTS;
    this.cache.reports = data;
    return data;
  }

  public saveReport(report: MonthlyReport): void {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === report.id);
    if (index >= 0) {
      reports[index] = report;
    } else {
      reports.unshift(report);
    }
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    this.notify();
  }
}

export const dataService = new DataService();
