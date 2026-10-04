import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LocalGovernment, Member, Task } from '../../types';
import { formatDate, getDaysRemaining } from '../../utils/formatters';
import {
  calculateExecutivePerformance,
  calculateLGPerformance,
  calculateTaskPerformanceSummary,
  getMostOverdueTasks,
  getRecentlyCompletedTasks,
  getTasksRequiringFollowUp,
  getUpcomingDeadlines,
  TaskFollowUpItem,
} from '../../utils/kpiEngine';
import { canAssignTask, ROLE_LABELS } from '../../utils/permissions';
import { EmptyState } from '../common/EmptyState';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { TaskCard } from '../common/TaskCard';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { TaskFormModal } from '../tasks/TaskFormModal';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from 'lucide-react';

interface AccountabilityDashboardProps {
  tasks: Task[];
  members: Member[];
  lgs: LocalGovernment[];
  onNavigate?: (tab: string, filter?: string) => void;
  onOpenTask?: (task: Task) => void;
  onNewTask?: () => void;
}

export const AccountabilityDashboard: React.FC<AccountabilityDashboardProps> = ({
  tasks,
  members,
  lgs,
  onNavigate,
  onOpenTask,
  onNewTask,
}) => {
  const { currentUser, currentRole } = useAuth();

  if (!currentUser) return null;

  const [activeSubTab, setActiveSubTab] = useState<'follow_up' | 'lgs' | 'executives' | 'deadlines'>('follow_up');
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState<'ALL' | 'OVERDUE' | 'REOPENED' | 'DUE_SOON'>('ALL');
  const [searchExecQuery, setSearchExecQuery] = useState('');
  const [selectedLGFilter, setSelectedLGFilter] = useState('ALL');

  const isVPAccountability = currentRole === 'VP_ACCOUNTABILITY';
  const isLGScoped = currentRole === 'LG_PRESIDENT';

  // Base tasks for current user scope
  const scopedTasks = useMemo(() => {
    if (isLGScoped) {
      return tasks.filter((t) => t.lgId === currentUser.lgId || t.assignedLG === currentUser.lgId);
    }
    return tasks;
  }, [tasks, isLGScoped, currentUser.lgId]);

  // Overall Performance Summary
  const summary = useMemo(() => {
    return calculateTaskPerformanceSummary(scopedTasks);
  }, [scopedTasks]);

  // LG Performance Scorecard
  const lgPerformances = useMemo(() => {
    return calculateLGPerformance(scopedTasks, lgs);
  }, [scopedTasks, lgs]);

  // Executive Performance Scorecard
  const execPerformances = useMemo(() => {
    const list = calculateExecutivePerformance(scopedTasks, members);
    return list.filter((item) => {
      if (selectedLGFilter !== 'ALL' && item.lgId !== selectedLGFilter) return false;
      if (searchExecQuery.trim()) {
        const q = searchExecQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.team.toLowerCase().includes(q) ||
          item.lgName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [scopedTasks, members, selectedLGFilter, searchExecQuery]);

  // Tasks requiring follow-up
  const followUpItems = useMemo(() => {
    const raw = getTasksRequiringFollowUp(scopedTasks);
    if (followUpFilter === 'OVERDUE') {
      return raw.filter((i) => i.reason === 'OVERDUE');
    }
    if (followUpFilter === 'REOPENED') {
      return raw.filter((i) => i.reason === 'REOPENED');
    }
    if (followUpFilter === 'DUE_SOON') {
      return raw.filter((i) => i.reason === 'DUE_SOON_NOT_STARTED' || i.reason === 'DUE_SOON_NO_EVIDENCE');
    }
    return raw;
  }, [scopedTasks, followUpFilter]);

  // Overdue, upcoming, and completed lists
  const mostOverdueTasks = useMemo(() => getMostOverdueTasks(scopedTasks, 6), [scopedTasks]);
  const upcomingTasks = useMemo(() => getUpcomingDeadlines(scopedTasks, 6), [scopedTasks]);
  const recentlyCompleted = useMemo(() => getRecentlyCompletedTasks(scopedTasks, 6), [scopedTasks]);

  const handleTaskClick = (task: Task) => {
    if (onOpenTask) {
      onOpenTask(task);
    } else {
      setSelectedTaskForModal(task);
    }
  };

  const canCreate = canAssignTask(currentRole);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isVPAccountability
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-purple-100 text-purple-900 border-purple-300'
                }`}
              >
                {isVPAccountability
                  ? '⚡ VP Accountability Operational Command'
                  : 'DO-DEEL Operational Accountability Engine'}
              </span>
              {isLGScoped && (
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                  {currentUser.lgName} Chapter
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Accountability & KPI Engine
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Transparent operational monitoring: assign responsibilities, track deadlines, verify evidence, and maintain executive follow-up without complex administrative overhead.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canCreate && (
              <button
                type="button"
                onClick={() => (onNewTask ? onNewTask() : setIsCreateModalOpen(true))}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Responsibility</span>
              </button>
            )}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all border border-slate-200"
              >
                <span>All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* Transparent System-Wide Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Assigned
            </span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{summary.totalAssigned}</p>
            <span className="text-[10px] text-slate-400 block mt-0.5">KPI targets set</span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Completed
            </span>
            <p className="text-xl font-black text-emerald-950 mt-0.5">{summary.completed}</p>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Evidence submitted</span>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
              In Progress
            </span>
            <p className="text-xl font-black text-blue-950 mt-0.5">{summary.inProgress}</p>
            <span className="text-[10px] text-blue-600 block mt-0.5">Ongoing execution</span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              Not Started
            </span>
            <p className="text-xl font-black text-amber-950 mt-0.5">{summary.notStarted}</p>
            <span className="text-[10px] text-amber-600 block mt-0.5">Pending kickoff</span>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              summary.overdue > 0
                ? 'bg-rose-50 border-rose-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block ${
                summary.overdue > 0 ? 'text-rose-700' : 'text-slate-500'
              }`}
            >
              Overdue
            </span>
            <p
              className={`text-xl font-black mt-0.5 ${
                summary.overdue > 0 ? 'text-rose-800' : 'text-slate-900'
              }`}
            >
              {summary.overdue}
            </p>
            <span
              className={`text-[10px] block mt-0.5 ${
                summary.overdue > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'
              }`}
            >
              {summary.overdue > 0 ? 'Action required' : 'None overdue'}
            </span>
          </div>

          <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Completion Rate
            </span>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black">{summary.completionRate}%</span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  ({summary.completed}/{summary.totalAssigned})
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1 rounded-full"
                  style={{ width: `${summary.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher: Follow-Up Queue | LG Scorecard | Executive Scorecard | Deadlines Timeline */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('follow_up')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeSubTab === 'follow_up'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Operational Follow-up Queue</span>
          {followUpItems.length > 0 && (
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                activeSubTab === 'follow_up'
                  ? 'bg-white text-amber-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {followUpItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('lgs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeSubTab === 'lgs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Completion by LG</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('executives')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeSubTab === 'executives'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Completion by Executive</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('deadlines')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeSubTab === 'deadlines'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Deadlines & Velocity</span>
        </button>
      </div>

      {/* SECTION 1: OPERATIONAL FOLLOW-UP QUEUE (VP ACCOUNTABILITY FOCUSED) */}
      {activeSubTab === 'follow_up' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
            <div>
              <h2 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Executive Follow-up Action List</span>
              </h2>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Responsibilities requiring proactive leadership contact: overdue deliverables, reopened tasks, or impending deadlines without kickoff.
              </p>
            </div>

            {/* Filter tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <button
                type="button"
                onClick={() => setFollowUpFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                  followUpFilter === 'ALL'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All ({followUpItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFollowUpFilter('OVERDUE')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                  followUpFilter === 'OVERDUE'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                }`}
              >
                Overdue
              </button>
              <button
                type="button"
                onClick={() => setFollowUpFilter('REOPENED')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                  followUpFilter === 'REOPENED'
                    ? 'bg-amber-700 text-white border-amber-700'
                    : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                }`}
              >
                Reopened
              </button>
              <button
                type="button"
                onClick={() => setFollowUpFilter('DUE_SOON')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                  followUpFilter === 'DUE_SOON'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                }`}
              >
                Impending (3 Days)
              </button>
            </div>
          </div>

          {followUpItems.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No follow-up actions pending"
              description="Excellent! All responsibilities are either completed or executing smoothly within deadlines."
            />
          ) : (
            <div className="space-y-3">
              {followUpItems.map((item) => (
                <div
                  key={item.task.id}
                  onClick={() => handleTaskClick(item.task)}
                  className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.urgency === 'CRITICAL'
                      ? 'border-rose-300 hover:border-rose-400 bg-rose-50/15'
                      : item.urgency === 'HIGH'
                      ? 'border-amber-300 hover:border-amber-400 bg-amber-50/15'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          item.urgency === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : item.urgency === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.reason.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {item.task.lgName}
                      </span>
                      <PriorityBadge priority={item.task.priority} />
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                      {item.task.title}
                    </h3>

                    <p className="text-[11px] text-slate-600 line-clamp-1">
                      <strong>Follow-up note:</strong> {item.detail}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                      <span>
                        Assignee: <strong>{item.task.assignedUserName}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Deadline: <strong>{formatDate(item.task.deadline)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(item.task);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <span>Review & Update</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: COMPLETION RATE BY LOCAL GOVERNMENT */}
      {activeSubTab === 'lgs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Local Government Operational Performance</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Transparent ranking and task execution rates across all DO-DEEL CDS local chapters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {lgPerformances.map((perf, idx) => (
              <div
                key={perf.lgId}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900">{perf.lgName}</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ondo State Chapter</p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900 block leading-tight">
                        {perf.completionRate}%
                      </span>
                      <span className="text-[10px] text-slate-400">completion</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        perf.completionRate >= 75
                          ? 'bg-emerald-600'
                          : perf.completionRate >= 50
                          ? 'bg-blue-600'
                          : 'bg-amber-600'
                      }`}
                      style={{ width: `${perf.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Micro metrics table */}
                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 text-center text-xs">
                  <div className="p-1.5 bg-slate-50 rounded-lg">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Total</span>
                    <span className="font-bold text-slate-800">{perf.totalAssigned}</span>
                  </div>
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase block">Done</span>
                    <span className="font-bold text-emerald-800">{perf.completed}</span>
                  </div>
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <span className="text-[9px] font-bold text-blue-600 uppercase block">Active</span>
                    <span className="font-bold text-blue-800">{perf.inProgress}</span>
                  </div>
                  <div
                    className={`p-1.5 rounded-lg ${
                      perf.overdue > 0 ? 'bg-rose-50' : 'bg-slate-50'
                    }`}
                  >
                    <span
                      className={`text-[9px] font-bold uppercase block ${
                        perf.overdue > 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      Overdue
                    </span>
                    <span
                      className={`font-bold ${
                        perf.overdue > 0 ? 'text-rose-700' : 'text-slate-800'
                      }`}
                    >
                      {perf.overdue}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: COMPLETION RATE BY EXECUTIVE */}
      {activeSubTab === 'executives' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Executive Responsibility & Completion Scorecard</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Transparent delivery records per assigned executive, group leader, and committee head.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter executive name..."
                  value={searchExecQuery}
                  onChange={(e) => setSearchExecQuery(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-emerald-500 w-44"
                />
              </div>

              {!isLGScoped && (
                <select
                  value={selectedLGFilter}
                  onChange={(e) => setSelectedLGFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium"
                >
                  <option value="ALL">All LGs</option>
                  {lgs.map((lg) => (
                    <option key={lg.id} value={lg.id}>
                      {lg.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Executive Officer</th>
                    <th className="py-3 px-3">Role & LG</th>
                    <th className="py-3 px-3">Team / Committee</th>
                    <th className="py-3 px-2 text-center">Assigned</th>
                    <th className="py-3 px-2 text-center">Completed</th>
                    <th className="py-3 px-2 text-center">Active</th>
                    <th className="py-3 px-2 text-center">Overdue</th>
                    <th className="py-3 px-4 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {execPerformances.map((exec) => (
                    <tr key={exec.memberId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[9px]">
                            {exec.name.charAt(0)}
                          </div>
                          <span>{exec.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <div>
                          <span className="font-semibold block">{ROLE_LABELS[exec.role]}</span>
                          <span className="text-[10px] text-slate-400">{exec.lgName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <span className="text-[11px] font-medium">{exec.team}</span>
                      </td>

                      <td className="py-3 px-2 text-center font-bold text-slate-800">
                        {exec.totalAssigned}
                      </td>

                      <td className="py-3 px-2 text-center font-bold text-emerald-700 bg-emerald-50/50">
                        {exec.completed}
                      </td>

                      <td className="py-3 px-2 text-center font-bold text-blue-700">
                        {exec.inProgress}
                      </td>

                      <td
                        className={`py-3 px-2 text-center font-bold ${
                          exec.overdue > 0
                            ? 'text-rose-700 bg-rose-50/80'
                            : 'text-slate-400'
                        }`}
                      >
                        {exec.overdue}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-black text-slate-900">{exec.completionRate}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                exec.completionRate >= 75
                                  ? 'bg-emerald-600'
                                  : exec.completionRate >= 50
                                  ? 'bg-blue-600'
                                  : 'bg-amber-600'
                              }`}
                              style={{ width: `${exec.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: DEADLINES & VELOCITY (MOST OVERDUE, UPCOMING, RECENTLY COMPLETED) */}
      {activeSubTab === 'deadlines' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Most Overdue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-rose-200">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-950">
                  Most Overdue Tasks ({mostOverdueTasks.length})
                </h3>
              </div>
              <span className="text-[10px] text-rose-600 font-bold">Past Deadline</span>
            </div>

            {mostOverdueTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No overdue tasks"
                description="Zero tasks currently past deadline."
              />
            ) : (
              <div className="space-y-2.5">
                {mostOverdueTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Upcoming Impending Deadlines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-blue-200">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-950">
                  Upcoming Deadlines ({upcomingTasks.length})
                </h3>
              </div>
              <span className="text-[10px] text-blue-600 font-bold">Next in Line</span>
            </div>

            {upcomingTasks.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No upcoming tasks"
                description="All active responsibilities completed."
              />
            ) : (
              <div className="space-y-2.5">
                {upcomingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Recently Completed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                  Recently Completed ({recentlyCompleted.length})
                </h3>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">Verified Evidence</span>
            </div>

            {recentlyCompleted.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No completed tasks"
                description="No completed deliverables recorded yet."
              />
            ) : (
              <div className="space-y-2.5">
                {recentlyCompleted.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Internal Modals */}
      {selectedTaskForModal && (
        <TaskDetailModal
          task={selectedTaskForModal}
          isOpen={Boolean(selectedTaskForModal)}
          onClose={() => setSelectedTaskForModal(null)}
          members={members}
        />
      )}

      <TaskFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        members={members}
        lgs={lgs}
      />
    </div>
  );
};
