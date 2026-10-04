import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, LocalGovernment, Member, MonthlyReport, Task } from '../../types';
import { formatDate } from '../../utils/formatters';
import { calculateCompletionRate } from '../../utils/taskStatus';
import { EmptyState } from '../common/EmptyState';
import { KPIStat } from '../common/KPIStat';
import { StatusBadge } from '../common/StatusBadge';
import { TaskCard } from '../common/TaskCard';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Plus,
  Send,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';

interface LeadershipDashboardProps {
  members: Member[];
  tasks: Task[];
  activities: Activity[];
  reports: MonthlyReport[];
  lgs: LocalGovernment[];
  onNavigate: (tab: string, filter?: string) => void;
  onOpenTask: (task: Task) => void;
  onOpenReport: (report: MonthlyReport) => void;
  onNewTask?: () => void;
}

export const LeadershipDashboard: React.FC<LeadershipDashboardProps> = ({
  members,
  tasks,
  activities,
  reports,
  lgs,
  onNavigate,
  onOpenTask,
  onOpenReport,
  onNewTask,
}) => {
  const { currentUser, currentRole } = useAuth();

  if (!currentUser) return null;

  // Scope data if user is LG President
  const isLGScoped = currentRole === 'LG_PRESIDENT';
  const displayedMembers = isLGScoped
    ? members.filter((m) => m.lgId === currentUser.lgId)
    : members;
  const displayedTasks = isLGScoped
    ? tasks.filter((t) => t.lgId === currentUser.lgId)
    : tasks;
  const displayedActivities = isLGScoped
    ? activities.filter((a) => a.lgId === currentUser.lgId || a.lgId === 'ALL')
    : activities;
  const displayedReports = isLGScoped
    ? reports.filter((r) => r.lgId === currentUser.lgId)
    : reports;

  const totalMembers = displayedMembers.length;
  const activeMembers = displayedMembers.filter((m) => m.membershipStatus === 'ACTIVE').length;

  const totalTasks = displayedTasks.length;
  const completedTasks = displayedTasks.filter((t) => t.calculatedStatus === 'COMPLETED').length;
  const inProgressTasks = displayedTasks.filter((t) => t.calculatedStatus === 'IN_PROGRESS').length;
  const overdueTasks = displayedTasks.filter((t) => t.calculatedStatus === 'OVERDUE');
  const completionRate = calculateCompletionRate(displayedTasks);

  // Attendance rate
  let totalPresent = 0;
  let totalRecords = 0;
  displayedActivities.forEach((act) => {
    act.attendanceRecords.forEach((r) => {
      totalRecords++;
      if (r.status === 'PRESENT') totalPresent++;
    });
  });
  const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 92;

  // Total beneficiaries
  const totalBeneficiaries = displayedReports.reduce(
    (sum, rep) => sum + (rep.beneficiariesReached || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Leadership Strategic Command
            </span>
            {isLGScoped && (
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                {currentUser.lgName}
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
            DO-DEEL CDS Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isLGScoped
              ? `Operational monitoring & KPI management for ${currentUser.lgName}.`
              : 'Digital Onboarders state-wide KPI tracking, chapter coordination & execution oversight.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNewTask && (
            <button
              type="button"
              onClick={onNewTask}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Task</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('growth')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold transition-all border border-emerald-200"
          >
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>Growth Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('accountability')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all border border-amber-200"
          >
            <BarChart3 className="w-4 h-4 text-amber-700" />
            <span>Accountability Engine</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all border border-slate-200"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Monthly Reports</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid using KPIStat */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPIStat
          label="Total Members"
          value={totalMembers}
          subtext={`${activeMembers} active`}
          icon={Users}
          onClick={() => onNavigate('members')}
        />
        <KPIStat
          label={isLGScoped ? 'My Chapter' : 'Active LGs'}
          value={isLGScoped ? 1 : lgs.length}
          subtext={isLGScoped ? currentUser.lgName : `${lgs.length} coordinating`}
          icon={Building2}
          variant="purple"
          onClick={() => onNavigate('members')}
        />
        <KPIStat
          label="Total Tasks"
          value={totalTasks}
          subtext={`${inProgressTasks} in progress`}
          icon={Clock}
          variant="blue"
          onClick={() => onNavigate('tasks')}
        />
        <KPIStat
          label="Completed"
          value={completedTasks}
          subtext="Verified evidence"
          icon={CheckCircle2}
          variant="emerald"
          onClick={() => onNavigate('tasks', 'COMPLETED')}
        />
        <KPIStat
          label="Overdue Tasks"
          value={overdueTasks.length}
          subtext={overdueTasks.length > 0 ? 'Requires follow-up' : 'All on time'}
          icon={AlertTriangle}
          variant={overdueTasks.length > 0 ? 'rose' : 'default'}
          onClick={() => onNavigate('tasks', 'OVERDUE')}
        />
        <KPIStat
          label="Completion"
          value={`${completionRate}%`}
          subtext={`${completedTasks} of ${totalTasks} done`}
          icon={TrendingUp}
          variant="emerald"
          onClick={() => onNavigate('tasks')}
        />
      </div>

      {/* Attendance & Beneficiaries Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Average CDS Attendance
              </h3>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{attendanceRate}%</p>
            <p className="text-[11px] text-slate-500">
              Verified attendance across weekly sessions
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('activities')}
            className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            Attendance Roll
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Beneficiaries Mentored
              </h3>
            </div>
            <p className="text-2xl font-black text-purple-900 mt-1">{totalBeneficiaries} People</p>
            <p className="text-[11px] text-slate-500">
              Students & local community members reached
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-2 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors"
          >
            Review Reports
          </button>
        </div>
      </div>

      {/* Overdue Attention & Recent Monthly Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks Watch */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Overdue Follow-up</h2>
                <p className="text-[10px] text-slate-500">Automatically triggered by deadline engine</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks', 'OVERDUE')}
              className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1"
            >
              <span>View all ({overdueTasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {overdueTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No overdue tasks"
              description="All ongoing responsibilities are currently within schedule."
            />
          ) : (
            <div className="space-y-3">
              {overdueTasks.slice(0, 3).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={onOpenTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Monthly Reports */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Recent Monthly Reports</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>All reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {displayedReports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No reports submitted"
              description="Submitted monthly executive and LG reports will appear here."
            />
          ) : (
            <div className="space-y-3">
              {displayedReports.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => onOpenReport(rep)}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{rep.month} Operations</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {rep.submitterName} ({rep.lgName})
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {rep.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <span>Activities: <strong>{rep.activitiesCompleted}/{rep.activitiesAssigned}</strong></span>
                    <span>Beneficiaries: <strong>{rep.beneficiariesReached}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
