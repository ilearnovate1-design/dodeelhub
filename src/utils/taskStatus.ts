import { Task, TaskStatus } from '../types';

/**
 * Calculates the current status of a task dynamically.
 * Rules:
 * - If manualProgress is 'COMPLETED' and evidence or result is present, status is 'COMPLETED'.
 * - If current date > deadline and task is not completed, status is automatically 'OVERDUE'.
 * - If manualProgress is 'IN_PROGRESS', status is 'IN_PROGRESS'.
 * - Otherwise, status is 'NOT_STARTED'.
 */
export function calculateTaskStatus(task: Pick<Task, 'manualProgress' | 'deadline' | 'evidence' | 'result'>): TaskStatus {
  // If marked completed with evidence or result
  if (task.manualProgress === 'COMPLETED' && (task.evidence || (task.result && task.result.trim().length > 0))) {
    return 'COMPLETED';
  }

  // Check if overdue: compare deadline with current date (at end of day)
  if (task.deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(task.deadline);
    // Treat deadline as the end of that day (23:59:59)
    deadlineDate.setHours(23, 59, 59, 999);

    if (today.getTime() > deadlineDate.getTime()) {
      return 'OVERDUE';
    }
  }

  if (task.manualProgress === 'IN_PROGRESS') {
    return 'IN_PROGRESS';
  }

  return 'NOT_STARTED';
}

/**
 * Enriches tasks with calculated status.
 */
export function enrichTaskWithStatus(task: Task): Task {
  return {
    ...task,
    calculatedStatus: calculateTaskStatus(task),
  };
}

/**
 * Computes task completion rate: (completed / total) * 100
 */
export function calculateCompletionRate(tasks: Task[]): number {
  if (!tasks.length) return 0;
  const completed = tasks.filter(t => calculateTaskStatus(t) === 'COMPLETED').length;
  return Math.round((completed / tasks.length) * 100);
}
