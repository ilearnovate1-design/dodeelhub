import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, CDSDocument, LearningResource, Task } from '../../types';
import { ActivityCard } from '../common/ActivityCard';
import { DocumentCard } from '../common/DocumentCard';
import { EmptyState } from '../common/EmptyState';
import { KPIStat } from '../common/KPIStat';
import { LearningCard } from '../common/LearningCard';
import { TaskCard } from '../common/TaskCard';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FolderLock,
  MapPin,
  TrendingUp,
} from 'lucide-react';

interface MemberDashboardProps {
  tasks: Task[];
  activities: Activity[];
  documents: CDSDocument[];
  learning: LearningResource[];
  onNavigate: (tab: string, filter?: string) => void;
  onOpenTask: (task: Task) => void;
  onOpenLearning: (resource: LearningResource) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  tasks,
  activities,
  documents,
  learning,
  onNavigate,
  onOpenTask,
  onOpenLearning,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  // Tasks assigned to this specific member
  const myTasks = tasks.filter((t) => t.assignedUserId === currentUser.id);
  const myCompletedTasks = myTasks.filter((t) => t.calculatedStatus === 'COMPLETED').length;

  // Upcoming activities relevant to member's LG or statewide
  const upcomingActivities = activities
    .filter(
      (a) =>
        a.status === 'UPCOMING' &&
        (a.lgId === 'ALL' || a.lgId === currentUser.lgId)
    )
    .slice(0, 2);

  // Calculate member's attendance
  let attendedCount = 0;
  let totalEligibleActivities = 0;
  activities.forEach((act) => {
    const record = act.attendanceRecords.find((r) => r.memberId === currentUser.id);
    if (record) {
      totalEligibleActivities++;
      if (record.status === 'PRESENT') attendedCount++;
    }
  });

  const attendanceRate =
    totalEligibleActivities > 0 ? Math.round((attendedCount / totalEligibleActivities) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 text-white p-5 sm:p-6 shadow-xs">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-200 bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/30 mb-2">
                DO-DEEL Member Portal
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Welcome back, {currentUser.fullName}!
              </h1>
              <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
                Digital Literacy, Employability, Entrepreneurship & Leadership Mentoring
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center self-start sm:self-auto min-w-[120px]">
              <span className="text-[10px] text-emerald-200 block font-semibold uppercase">Attendance</span>
              <span className="text-2xl font-black text-white">{attendanceRate}%</span>
              <span className="text-[10px] text-emerald-100 block">
                {attendedCount} / {totalEligibleActivities} sessions
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-emerald-100">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              {currentUser.lgName}
            </span>
            {currentUser.stateCode && (
              <span className="flex items-center gap-1.5 font-medium bg-emerald-900/50 px-2 py-0.5 rounded">
                Code: {currentUser.stateCode}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-emerald-300" />
              Active Corps Member
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPIStat
          label="My Assigned Tasks"
          value={myTasks.length}
          subtext={`${myCompletedTasks} completed`}
          icon={CheckCircle2}
          onClick={() => onNavigate('tasks')}
        />
        <KPIStat
          label="Upcoming Activities"
          value={upcomingActivities.length}
          subtext="In your chapter"
          icon={Calendar}
          variant="blue"
          onClick={() => onNavigate('activities')}
        />
        <KPIStat
          label="Learning Hub"
          value={learning.length}
          subtext="Tutorials available"
          icon={BookOpen}
          variant="purple"
          onClick={() => onNavigate('learning')}
        />
        <KPIStat
          label="CDS Documents"
          value={documents.length}
          subtext="Downloadable guides"
          icon={FolderLock}
          variant="emerald"
          onClick={() => onNavigate('documents')}
        />
      </div>

      {/* Main Grid: My Tasks & Upcoming Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">My Assigned Tasks</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all ({myTasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {myTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No tasks currently assigned"
              description="New responsibilities assigned by your LG President or team lead will appear here."
            />
          ) : (
            <div className="space-y-3">
              {myTasks.slice(0, 2).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={onOpenTask}
                  showAssignee={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Activities Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Upcoming CDS Activities</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('activities')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingActivities.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming activities scheduled"
              description="Check back soon for weekly Thursday meeting announcements and training sessions."
            />
          ) : (
            <div className="space-y-3">
              {upcomingActivities.map((act) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  onClick={() => onNavigate('activities')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Featured Learning & Documents Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Learning Hub Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Featured Learning Resources</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('learning')}
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Explore all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {learning.slice(0, 2).map((item) => (
              <LearningCard
                key={item.id}
                resource={item}
                onClick={onOpenLearning}
              />
            ))}
          </div>
        </div>

        {/* Latest CDS Documents */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                <FolderLock className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Official CDS Documents</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Document library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {documents.slice(0, 2).map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
