import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, Task } from '../../types';
import { ActivityCard } from '../common/ActivityCard';
import { EmptyState } from '../common/EmptyState';
import { KPIStat } from '../common/KPIStat';
import { TaskCard } from '../common/TaskCard';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  PlusCircle,
  Send,
  UserCheck,
} from 'lucide-react';

interface ExecutiveDashboardProps {
  tasks: Task[];
  activities: Activity[];
  onNavigate: (tab: string, filter?: string) => void;
  onOpenTask: (task: Task) => void;
  onNewTask?: () => void;
  onOpenActivityAttendance?: (activity: Activity) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  tasks,
  activities,
  onNavigate,
  onOpenTask,
  onNewTask,
  onOpenActivityAttendance,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  // Tasks assigned to this executive or created by them
  const myTasks = tasks.filter(
    (t) => t.assignedUserId === currentUser.id || t.createdBy === currentUser.id
  );

  const completedTasks = myTasks.filter((t) => t.calculatedStatus === 'COMPLETED');
  const inProgressTasks = myTasks.filter((t) => t.calculatedStatus === 'IN_PROGRESS');
  const overdueTasks = myTasks.filter((t) => t.calculatedStatus === 'OVERDUE');
  const notStartedTasks = myTasks.filter((t) => t.calculatedStatus === 'NOT_STARTED');

  // Activities organized by or assigned to this executive's LG
  const myActivities = activities.filter(
    (a) =>
      a.organizerId === currentUser.id ||
      a.lgId === currentUser.lgId ||
      a.lgId === 'ALL'
  );

  // Upcoming deadlines sorted by closest
  const upcomingDeadlines = [...myTasks]
    .filter((t) => t.calculatedStatus !== 'COMPLETED')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Executive Operations Workspace
          </span>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {currentUser.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser.assignedTeam || 'Executive Committee'} • {currentUser.lgName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNewTask && (
            <button
              type="button"
              onClick={onNewTask}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assign Task</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all border border-slate-200"
          >
            <Send className="w-4 h-4 text-slate-500" />
            <span>Monthly Report</span>
          </button>
        </div>
      </div>

      {/* KPI & Status Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPIStat
          label="Assigned Tasks"
          value={myTasks.length}
          subtext={`${notStartedTasks.length} not started`}
          icon={Clock}
          onClick={() => onNavigate('tasks')}
        />
        <KPIStat
          label="In Progress"
          value={inProgressTasks.length}
          subtext="Active execution"
          icon={Clock}
          variant="blue"
          onClick={() => onNavigate('tasks', 'IN_PROGRESS')}
        />
        <KPIStat
          label="Overdue Tasks"
          value={overdueTasks.length}
          subtext={overdueTasks.length > 0 ? 'Requires action' : 'None overdue'}
          icon={AlertCircle}
          variant={overdueTasks.length > 0 ? 'rose' : 'default'}
          onClick={() => onNavigate('tasks', 'OVERDUE')}
        />
        <KPIStat
          label="Completed"
          value={completedTasks.length}
          subtext="Evidence verified"
          icon={CheckCircle2}
          variant="emerald"
          onClick={() => onNavigate('tasks', 'COMPLETED')}
        />
      </div>

      {/* Main Sections: Upcoming Deadlines & Attendance Responsibilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines & High Priority Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>All tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All tasks on track"
              description="You have no impending task deadlines requiring immediate action."
            />
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={onOpenTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Assigned Activities & Attendance Responsibilities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Attendance Responsibilities</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Take attendance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {myActivities.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No activities assigned"
              description="You do not have any pending meetings or outreach sessions to coordinate attendance for."
            />
          ) : (
            <div className="space-y-3">
              {myActivities.slice(0, 3).map((act) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  onClick={() => onNavigate('activities')}
                  onMarkAttendance={onOpenActivityAttendance}
                  canMarkAttendance={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
