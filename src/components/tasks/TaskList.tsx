import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LocalGovernment, Member, Task, TaskPriority, UserRole } from '../../types';
import { calculateTaskPerformanceSummary, filterTasksByDatePreset } from '../../utils/kpiEngine';
import { canAssignTask, isScopedToLG, ROLE_LABELS } from '../../utils/permissions';
import { EmptyState } from '../common/EmptyState';
import { FilterBar } from '../common/FilterBar';
import { SearchBar } from '../common/SearchBar';
import { TaskCard } from '../common/TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskFormModal } from './TaskFormModal';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Filter,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  members: Member[];
  lgs: LocalGovernment[];
  initialStatusFilter?: string;
  selectedTask?: Task | null;
  onClearSelectedTask?: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  members,
  lgs,
  initialStatusFilter,
  selectedTask: externalSelectedTask,
  onClearSelectedTask,
}) => {
  const { currentUser, currentRole } = useAuth();

  if (!currentUser) return null;

  // Filter States
  const [activeStatusTab, setActiveStatusTab] = useState<string>(initialStatusFilter || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLg, setSelectedLg] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedExecutive, setSelectedExecutive] = useState<string>('ALL');
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Modals
  const [activeTask, setActiveTask] = useState<Task | null>(externalSelectedTask || null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  React.useEffect(() => {
    if (externalSelectedTask) {
      setActiveTask(externalSelectedTask);
    }
  }, [externalSelectedTask]);

  React.useEffect(() => {
    if (initialStatusFilter) {
      setActiveStatusTab(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const isMember = currentRole === 'MEMBER';
  const isLGScoped = isScopedToLG(currentRole);

  // Base tasks accessible to this user
  const baseUserTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (isMember) {
        return t.assignedUserId === currentUser.id || t.assignedTo === currentUser.id;
      }
      if (isLGScoped) {
        return t.lgId === currentUser.lgId || t.assignedLG === currentUser.lgId;
      }
      return true;
    });
  }, [tasks, isMember, isLGScoped, currentUser.id, currentUser.lgId]);

  // Overall performance summary for accessible tasks
  const performanceSummary = useMemo(() => {
    return calculateTaskPerformanceSummary(baseUserTasks);
  }, [baseUserTasks]);

  // Filtered tasks based on all active criteria
  const filteredTasks = useMemo(() => {
    let result = baseUserTasks;

    // Filter by LG (for state-wide leadership)
    if (!isMember && !isLGScoped && selectedLg !== 'ALL') {
      result = result.filter(
        (t) => t.lgId === selectedLg || t.assignedLG === selectedLg
      );
    }

    // Filter by Role
    if (selectedRole !== 'ALL') {
      result = result.filter((t) => {
        const role = t.assignedUserRole || t.assignedToRole;
        if (role) return role === selectedRole;
        // Lookup member
        const m = members.find((mem) => mem.id === (t.assignedTo || t.assignedUserId));
        return m?.role === selectedRole;
      });
    }

    // Filter by Executive (assigned person)
    if (selectedExecutive !== 'ALL') {
      result = result.filter(
        (t) => t.assignedTo === selectedExecutive || t.assignedUserId === selectedExecutive
      );
    }

    // Filter by Status Tab
    if (activeStatusTab !== 'ALL') {
      result = result.filter((t) => t.calculatedStatus === activeStatusTab);
    }

    // Filter by Date Preset
    if (selectedDatePreset !== 'ALL') {
      result = filterTasksByDatePreset(result, selectedDatePreset);
    }

    // Filter by Priority
    if (selectedPriority !== 'ALL') {
      result = result.filter((t) => t.priority === selectedPriority);
    }

    // Search Query (title, description, assignee, KPI)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((task) => {
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesAssignee = task.assignedUserName.toLowerCase().includes(q);
        const matchesKpi = task.kpi.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesTeam = task.team?.toLowerCase().includes(q);
        return matchesTitle || matchesAssignee || matchesKpi || matchesDesc || matchesTeam;
      });
    }

    return result;
  }, [
    baseUserTasks,
    isMember,
    isLGScoped,
    selectedLg,
    selectedRole,
    selectedExecutive,
    activeStatusTab,
    selectedDatePreset,
    selectedPriority,
    searchQuery,
    members,
  ]);

  // Tab counts dynamically based on current secondary filters
  const tabCounts = useMemo(() => {
    return {
      ALL: baseUserTasks.length,
      NOT_STARTED: performanceSummary.notStarted,
      IN_PROGRESS: performanceSummary.inProgress,
      COMPLETED: performanceSummary.completed,
      OVERDUE: performanceSummary.overdue,
    };
  }, [baseUserTasks.length, performanceSummary]);

  const canCreate = canAssignTask(currentRole);

  const isAnyFilterActive =
    selectedLg !== 'ALL' ||
    selectedRole !== 'ALL' ||
    selectedExecutive !== 'ALL' ||
    selectedDatePreset !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    activeStatusTab !== 'ALL' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setActiveStatusTab('ALL');
    setSelectedLg('ALL');
    setSelectedRole('ALL');
    setSelectedExecutive('ALL');
    setSelectedDatePreset('ALL');
    setSelectedPriority('ALL');
    setSearchQuery('');
  };

  const filterOptions = [
    { id: 'ALL', label: 'All Tasks', count: tabCounts.ALL },
    { id: 'NOT_STARTED', label: 'Not Started', count: tabCounts.NOT_STARTED },
    { id: 'IN_PROGRESS', label: 'In Progress', count: tabCounts.IN_PROGRESS },
    { id: 'COMPLETED', label: 'Completed', count: tabCounts.COMPLETED },
    {
      id: 'OVERDUE',
      label: 'Overdue',
      count: tabCounts.OVERDUE,
      alert: tabCounts.OVERDUE > 0,
    },
  ];

  // Unique list of assignees for the dropdown
  const availableExecutives = useMemo(() => {
    const ids = new Set<string>();
    baseUserTasks.forEach((t) => {
      if (t.assignedTo) ids.add(t.assignedTo);
      if (t.assignedUserId) ids.add(t.assignedUserId);
    });
    return members.filter((m) => ids.has(m.id));
  }, [baseUserTasks, members]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              DO-DEEL Operational Engine
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              ASSIGN → EXECUTE → EVIDENCE → REPORT → REVIEW
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {isMember ? 'My Assigned Responsibilities' : 'Tasks & KPI Accountability Engine'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent performance metrics, automatic deadline calculation, and verifiable evidence.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Responsibility</span>
          </button>
        )}
      </div>

      {/* Transparent Performance Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveStatusTab('ALL')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusTab === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 block">
            Total Assigned
          </span>
          <p className="text-xl sm:text-2xl font-black mt-0.5">
            {performanceSummary.totalAssigned}
          </p>
          <span className="text-[10px] opacity-75 block mt-0.5">All responsibilities</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusTab('COMPLETED')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusTab === 'COMPLETED'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 shadow-2xs'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Completed
          </span>
          <p className="text-xl sm:text-2xl font-black mt-0.5 text-emerald-900">
            {performanceSummary.completed}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Verified evidence</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusTab('IN_PROGRESS')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusTab === 'IN_PROGRESS'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 shadow-2xs'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
            In Progress
          </span>
          <p className="text-xl sm:text-2xl font-black mt-0.5 text-blue-900">
            {performanceSummary.inProgress}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Under execution</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusTab('NOT_STARTED')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusTab === 'NOT_STARTED'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
            Not Started
          </span>
          <p className="text-xl sm:text-2xl font-black mt-0.5 text-amber-900">
            {performanceSummary.notStarted}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Pending kickoff</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusTab('OVERDUE')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusTab === 'OVERDUE'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : performanceSummary.overdue > 0
              ? 'bg-rose-50/60 text-slate-900 border-rose-200 hover:border-rose-300 shadow-2xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider block ${
              performanceSummary.overdue > 0 ? 'text-rose-600' : 'text-slate-500'
            }`}
          >
            Overdue
          </span>
          <p
            className={`text-xl sm:text-2xl font-black mt-0.5 ${
              performanceSummary.overdue > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {performanceSummary.overdue}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {performanceSummary.overdue > 0 ? 'Requires action' : 'None overdue'}
          </span>
        </button>

        <div className="p-3 rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Completion Rate
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {performanceSummary.completionRate}%
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${performanceSummary.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Segmented Status Tab Bar */}
      <FilterBar
        options={filterOptions}
        activeId={activeStatusTab}
        onSelect={(id) => setActiveStatusTab(id)}
      />

      {/* Filter Matrix (Search + LG + Role + Executive + Date + Priority) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by responsibility, KPI, assignee, or team..."
        />

        {/* Granular Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 text-xs">
          {/* LG Filter */}
          {!isMember && !isLGScoped ? (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Filter by LG
              </label>
              <select
                value={selectedLg}
                onChange={(e) => setSelectedLg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Local Governments</option>
                {lgs.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    {lg.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Local Government
              </label>
              <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-600 font-semibold truncate">
                {currentUser.lgName}
              </div>
            </div>
          )}

          {/* Role Filter */}
          {!isMember && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Filter by Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Roles</option>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Executive / Assignee Filter */}
          {!isMember && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Filter by Executive
              </label>
              <select
                value={selectedExecutive}
                onChange={(e) => setSelectedExecutive(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Executives / Members</option>
                {availableExecutives.map((exec) => (
                  <option key={exec.id} value={exec.id}>
                    {exec.fullName} ({exec.lgName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Filter by Date / Deadline
            </label>
            <select
              value={selectedDatePreset}
              onChange={(e) => setSelectedDatePreset(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Deadlines</option>
              <option value="OVERDUE">Overdue (Past Deadline)</option>
              <option value="TODAY">Due Today</option>
              <option value="THIS_WEEK">Due This Week</option>
              <option value="THIS_MONTH">Due This Month</option>
              <option value="COMPLETED_RECENT">Completed Recently</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Filter by Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Active Filters Indicator & Reset */}
        {isAnyFilterActive && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing <strong>{filteredTasks.length}</strong> of {baseUserTasks.length} responsibilities
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-slate-600 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No responsibilities found"
          description="There are no responsibilities matching your current search or active filter combination."
          actionLabel={isAnyFilterActive ? 'Clear Filters' : undefined}
          onAction={isAnyFilterActive ? handleResetFilters : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={setActiveTask}
              showAssignee={!isMember}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {activeTask && (
        <TaskDetailModal
          task={activeTask}
          isOpen={Boolean(activeTask)}
          onClose={() => {
            setActiveTask(null);
            if (onClearSelectedTask) onClearSelectedTask();
          }}
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
