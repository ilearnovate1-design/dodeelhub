import { LocalGovernment, Member, Task, UserRole } from '../types';
import { calculateTaskStatus } from './taskStatus';

export interface TaskPerformanceSummary {
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  completionRate: number; // 0 to 100
}

export interface LGPerformance {
  lgId: string;
  lgName: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  completionRate: number;
}

export interface ExecutivePerformance {
  memberId: string;
  name: string;
  role: UserRole;
  lgId: string;
  lgName: string;
  team: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  completionRate: number;
}

export type FollowUpReason =
  | 'OVERDUE'
  | 'REOPENED'
  | 'DUE_SOON_NOT_STARTED'
  | 'DUE_SOON_NO_EVIDENCE';

export interface TaskFollowUpItem {
  task: Task;
  reason: FollowUpReason;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  detail: string;
  daysDiff: number;
}

/**
 * Computes a transparent performance summary for any array of tasks.
 */
export function calculateTaskPerformanceSummary(tasks: Task[]): TaskPerformanceSummary {
  const totalAssigned = tasks.length;
  if (totalAssigned === 0) {
    return {
      totalAssigned: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
      completionRate: 0,
    };
  }

  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let overdue = 0;

  for (const t of tasks) {
    const status = calculateTaskStatus(t);
    switch (status) {
      case 'COMPLETED':
        completed++;
        break;
      case 'OVERDUE':
        overdue++;
        break;
      case 'IN_PROGRESS':
        inProgress++;
        break;
      case 'NOT_STARTED':
      default:
        notStarted++;
        break;
    }
  }

  const completionRate = Math.round((completed / totalAssigned) * 100);

  return {
    totalAssigned,
    completed,
    inProgress,
    notStarted,
    overdue,
    completionRate,
  };
}

/**
 * Calculates operational completion rates and statistics broken down by Local Government.
 */
export function calculateLGPerformance(
  tasks: Task[],
  lgs: LocalGovernment[]
): LGPerformance[] {
  return lgs.map((lg) => {
    const lgTasks = tasks.filter(
      (t) => t.assignedLG === lg.id || t.lgId === lg.id
    );
    const summary = calculateTaskPerformanceSummary(lgTasks);

    return {
      lgId: lg.id,
      lgName: lg.name,
      totalAssigned: summary.totalAssigned,
      completed: summary.completed,
      inProgress: summary.inProgress,
      notStarted: summary.notStarted,
      overdue: summary.overdue,
      completionRate: summary.completionRate,
    };
  }).sort((a, b) => {
    // Sort by completion rate descending, then total assigned descending
    if (b.completionRate !== a.completionRate) {
      return b.completionRate - a.completionRate;
    }
    return b.totalAssigned - a.totalAssigned;
  });
}

/**
 * Calculates individual operational completion rates and statistics broken down by executive.
 */
export function calculateExecutivePerformance(
  tasks: Task[],
  members: Member[]
): ExecutivePerformance[] {
  // Find members who have tasks assigned or are executives/group leaders
  const relevantMembers = members.filter((m) => {
    const hasTasks = tasks.some(
      (t) => t.assignedTo === m.id || t.assignedUserId === m.id
    );
    return hasTasks || m.role !== 'MEMBER';
  });

  return relevantMembers
    .map((member) => {
      const execTasks = tasks.filter(
        (t) => t.assignedTo === member.id || t.assignedUserId === member.id
      );
      const summary = calculateTaskPerformanceSummary(execTasks);

      return {
        memberId: member.id,
        name: member.fullName,
        role: member.role,
        lgId: member.lgId,
        lgName: member.lgName,
        team: member.assignedTeam || 'Executive Committee',
        totalAssigned: summary.totalAssigned,
        completed: summary.completed,
        inProgress: summary.inProgress,
        notStarted: summary.notStarted,
        overdue: summary.overdue,
        completionRate: summary.completionRate,
      };
    })
    .filter((e) => e.totalAssigned > 0)
    .sort((a, b) => {
      // Sort by completion rate descending, then overdue ascending
      if (b.completionRate !== a.completionRate) {
        return b.completionRate - a.completionRate;
      }
      return a.overdue - b.overdue;
    });
}

/**
 * Returns most overdue responsibilities sorted by days overdue (most days past deadline first).
 */
export function getMostOverdueTasks(tasks: Task[], limit: number = 5): Task[] {
  const now = new Date().getTime();
  const overdueTasks = tasks.filter((t) => calculateTaskStatus(t) === 'OVERDUE');

  return overdueTasks
    .sort((a, b) => {
      const timeA = new Date(a.deadline).getTime();
      const timeB = new Date(b.deadline).getTime();
      return timeA - timeB; // Earliest deadline = most days overdue
    })
    .slice(0, limit);
}

/**
 * Returns tasks with upcoming deadlines (not completed, sorted by earliest deadline).
 */
export function getUpcomingDeadlines(tasks: Task[], limit: number = 5): Task[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeTasks = tasks.filter((t) => {
    const status = calculateTaskStatus(t);
    return status !== 'COMPLETED' && status !== 'OVERDUE';
  });

  return activeTasks
    .sort((a, b) => {
      const timeA = new Date(a.deadline).getTime();
      const timeB = new Date(b.deadline).getTime();
      return timeA - timeB;
    })
    .slice(0, limit);
}

/**
 * Returns recently completed tasks sorted by latest completion or update.
 */
export function getRecentlyCompletedTasks(tasks: Task[], limit: number = 5): Task[] {
  const completed = tasks.filter((t) => calculateTaskStatus(t) === 'COMPLETED');

  return completed
    .sort((a, b) => {
      const dateA = new Date(a.completedAt || a.completionDate || a.updatedAt).getTime();
      const dateB = new Date(b.completedAt || b.completionDate || b.updatedAt).getTime();
      return dateB - dateA;
    })
    .slice(0, limit);
}

/**
 * Returns tasks requiring operational follow-up:
 * - Overdue responsibilities
 * - Reopened tasks that are still in progress
 * - Tasks due in next 3 days that are still NOT_STARTED
 * - Tasks due in next 3 days that have no evidence/updates
 */
export function getTasksRequiringFollowUp(tasks: Task[]): TaskFollowUpItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nowMs = today.getTime();

  const items: TaskFollowUpItem[] = [];

  for (const task of tasks) {
    const status = calculateTaskStatus(task);
    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.ceil((deadlineDate.getTime() - nowMs) / (1000 * 60 * 60 * 24));

    // 1. Overdue tasks
    if (status === 'OVERDUE') {
      const daysOverdue = Math.abs(daysDiff);
      items.push({
        task,
        reason: 'OVERDUE',
        urgency: daysOverdue > 3 ? 'CRITICAL' : 'HIGH',
        detail: `Deadline passed ${daysOverdue === 0 ? 'today' : `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago`}. Awaiting evidence & results.`,
        daysDiff,
      });
      continue;
    }

    // 2. Reopened tasks in progress
    if (task.reopenedAt && status !== 'COMPLETED') {
      items.push({
        task,
        reason: 'REOPENED',
        urgency: 'HIGH',
        detail: `Reopened by ${task.reopenedByName || 'Leadership'}: "${task.reopenReason || 'Requires revision'}"`,
        daysDiff,
      });
      continue;
    }

    // 3. Due soon and not started
    if (status === 'NOT_STARTED' && daysDiff >= 0 && daysDiff <= 3) {
      items.push({
        task,
        reason: 'DUE_SOON_NOT_STARTED',
        urgency: daysDiff <= 1 ? 'HIGH' : 'MEDIUM',
        detail: `Due ${daysDiff === 0 ? 'today' : `in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`} but has not been started yet.`,
        daysDiff,
      });
      continue;
    }

    // 4. In progress but due within 2 days with no evidence attached
    if (status === 'IN_PROGRESS' && daysDiff >= 0 && daysDiff <= 2 && !task.evidence && (!task.result || !task.result.trim())) {
      items.push({
        task,
        reason: 'DUE_SOON_NO_EVIDENCE',
        urgency: 'MEDIUM',
        detail: `Due ${daysDiff === 0 ? 'today' : `in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`} with no evidence submitted yet.`,
        daysDiff,
      });
    }
  }

  // Sort by urgency: CRITICAL -> HIGH -> MEDIUM, then closest deadline
  const urgencyWeight = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
  return items.sort((a, b) => {
    if (urgencyWeight[b.urgency] !== urgencyWeight[a.urgency]) {
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    }
    return a.daysDiff - b.daysDiff;
  });
}

/**
 * Filter tasks by date range presets
 */
export function filterTasksByDatePreset(tasks: Task[], preset: string): Task[] {
  if (preset === 'ALL') return tasks;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nowMs = today.getTime();

  return tasks.filter((task) => {
    const deadline = new Date(task.deadline);
    deadline.setHours(0, 0, 0, 0);
    const deadlineMs = deadline.getTime();
    const daysDiff = Math.ceil((deadlineMs - nowMs) / (1000 * 60 * 60 * 24));

    switch (preset) {
      case 'OVERDUE':
        return calculateTaskStatus(task) === 'OVERDUE';
      case 'TODAY':
        return daysDiff === 0;
      case 'THIS_WEEK':
        return daysDiff >= 0 && daysDiff <= 7;
      case 'THIS_MONTH': {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        return (
          deadline.getMonth() === currentMonth &&
          deadline.getFullYear() === currentYear
        );
      }
      case 'COMPLETED_RECENT': {
        if (calculateTaskStatus(task) !== 'COMPLETED') return false;
        const compDate = new Date(task.completedAt || task.completionDate || task.updatedAt);
        const diffDays = Math.ceil((nowMs - compDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }
      default:
        return true;
    }
  });
}
