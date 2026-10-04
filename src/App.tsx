import React, { useEffect, useState } from 'react';
import { ActivityList } from './components/activities/ActivityList';
import { AdminPanel } from './components/admin/AdminPanel';
import { BottomNav } from './components/common/BottomNav';
import { Navbar } from './components/common/Navbar';
import { RoleSwitcherModal } from './components/common/RoleSwitcherModal';
import { AccountabilityDashboard } from './components/dashboard/AccountabilityDashboard';
import { DashboardRouter } from './components/dashboard/DashboardRouter';
import { GrowthDashboard } from './components/dashboard/GrowthDashboard';
import { DocumentLibrary } from './components/documents/DocumentLibrary';
import { LearningHub } from './components/learning/LearningHub';
import { MemberList } from './components/members/MemberList';
import { ProfileView } from './components/profile/ProfileView';
import { MonthlyReports } from './components/reports/MonthlyReports';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { TaskList } from './components/tasks/TaskList';
import { LoginView } from './components/auth/LoginView';
import { SuspendedAccountView } from './components/auth/SuspendedAccountView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { dataService } from './services/dataService';
import {
  Activity,
  CDSDocument,
  LearningResource,
  LocalGovernment,
  Member,
  MonthlyReport,
  Task,
} from './types';
import { canAccessAdmin, isExecutiveOrAbove, isLeadershipRole } from './utils/permissions';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckSquare,
  FileText,
  FolderLock,
  Shield,
  TrendingUp,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, currentRole, isSuspended, loading } = useAuth();

  // Primary state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [documents, setDocuments] = useState<CDSDocument[]>([]);
  const [learning, setLearning] = useState<LearningResource[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [lgs, setLgs] = useState<LocalGovernment[]>([]);
  const [settings, setSettings] = useState(() => dataService.getSettings());

  // Navigation & filter state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // ... global modal states ...
  const [tasksStatusFilter, setTasksStatusFilter] = useState<string>('ALL');
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [selectedReportForModal, setSelectedReportForModal] = useState<MonthlyReport | null>(null);
  const [selectedLearningForModal, setSelectedLearningForModal] = useState<LearningResource | null>(
    null
  );
  const [selectedActivityForAttendance, setSelectedActivityForAttendance] =
    useState<Activity | null>(null);

  // Global modals
  const [isTaskCreateOpen, setIsTaskCreateOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);

  // Production Environment Initialization & Reactive Sync
  useEffect(() => {
    const init = async () => {
      // Ensure the production environment is purged of demo records and verified
      if (currentUser && canAccessAdmin(currentRole)) {
        const isPurged = localStorage.getItem('dodeel_production_purged_v1');
        if (!isPurged) {
          await dataService.forceClearDemoContentAsync();
        } else {
          await dataService.ensureSuperAdminUser('kolawoles445@gmail.com', 'Kolawole (Super Admin)', 'user-kolawole');
        }
      }
    };
    init();
  }, [currentUser, currentRole]);

  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setTasks(dataService.getTasks());
      setActivities(dataService.getActivities());
      setDocuments(dataService.getDocuments());
      setLearning(dataService.getLearning());
      setMembers(dataService.getMembers());
      setReports(dataService.getReports());
      setLgs(dataService.getLGs());
      setSettings(dataService.getSettings());
    });
    return unsubscribe;
  }, []);

  // Force profile update check
  useEffect(() => {
    if (currentUser?.requiresProfileUpdate && currentTab !== 'profile') {
      setCurrentTab('profile');
    }
  }, [currentUser, currentTab]);

  // Ensure currentTab is allowed for current role when switching roles
  useEffect(() => {
    if (currentRole === 'MEMBER') {
      if (['members', 'reports', 'admin', 'attendance'].includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    } else if (currentRole === 'EXECUTIVE' || currentRole === 'GROUP_LEADER') {
      if (['members', 'admin'].includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    }
  }, [currentRole, currentTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">Syncing with State Directorate...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  if (isSuspended) {
    return <SuspendedAccountView />;
  }

  const overdueCount = tasks.filter((t) => t.calculatedStatus === 'OVERDUE').length;

  const handleNavigate = (tab: string, filter?: string) => {
    setCurrentTab(tab);
    if (tab === 'tasks' && filter) {
      setTasksStatusFilter(filter);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTaskForModal(task);
    setCurrentTab('tasks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReport = (report: MonthlyReport) => {
    setSelectedReportForModal(report);
    setCurrentTab('reports');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLearning = (res: LearningResource) => {
    setSelectedLearningForModal(res);
    setCurrentTab('learning');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenActivityAttendance = (act: Activity) => {
    setSelectedActivityForAttendance(act);
    setCurrentTab('activities');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get modules available for the "More" drawer on mobile
  const getMoreItems = () => {
    if (currentRole === 'MEMBER') {
      return [{ id: 'documents', label: 'Documents', icon: FolderLock }];
    }

    if (currentRole === 'EXECUTIVE' || currentRole === 'GROUP_LEADER') {
      return [
        { id: 'learning', label: 'Learning Hub', icon: BookOpen },
        { id: 'documents', label: 'Documents', icon: FolderLock },
        { id: 'reports', label: 'Monthly Reports', icon: FileText },
      ];
    }

    // Leadership
    const list = [
      { id: 'growth', label: 'Growth Dashboard', icon: TrendingUp },
      { id: 'accountability', label: 'Accountability Engine', icon: TrendingUp },
      { id: 'learning', label: 'Learning Hub', icon: BookOpen },
      { id: 'documents', label: 'Documents', icon: FolderLock },
      { id: 'reports', label: 'Monthly Reports', icon: FileText },
    ];
    if (canAccessAdmin(currentRole)) {
      list.push({ id: 'admin', label: 'Administration', icon: Shield });
    }
    return list;
  };

  const moreItems = getMoreItems();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-600 selection:text-white pb-20 lg:pb-8">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">
        {currentTab === 'dashboard' && (
          <DashboardRouter
            tasks={tasks}
            activities={activities}
            documents={documents}
            learning={learning}
            members={members}
            reports={reports}
            lgs={lgs}
            onNavigate={handleNavigate}
            onOpenTask={handleOpenTask}
            onOpenReport={handleOpenReport}
            onOpenLearning={handleOpenLearning}
            onNewTask={() => setIsTaskCreateOpen(true)}
            onOpenActivityAttendance={handleOpenActivityAttendance}
          />
        )}

        {currentTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            members={members}
            lgs={lgs}
            initialStatusFilter={tasksStatusFilter}
            selectedTask={selectedTaskForModal}
            onClearSelectedTask={() => setSelectedTaskForModal(null)}
          />
        )}

        {/* Operational Accountability Engine for Leadership & Executives */}
        {currentTab === 'accountability' && isExecutiveOrAbove(currentRole) && (
          <AccountabilityDashboard
            tasks={tasks}
            members={members}
            lgs={lgs}
            onNavigate={handleNavigate}
            onOpenTask={handleOpenTask}
            onNewTask={() => setIsTaskCreateOpen(true)}
          />
        )}

        {/* Growth & Engagement Dashboard for Leadership */}
        {currentTab === 'growth' && isLeadershipRole(currentRole) && (
          <GrowthDashboard
            tasks={tasks}
            members={members}
            activities={activities}
            lgs={lgs}
            onNavigate={handleNavigate}
            onOpenTask={handleOpenTask}
          />
        )}

        {currentTab === 'activities' && (
          <ActivityList
            activities={activities}
            members={members}
            lgs={lgs}
            initialAttendanceActivity={selectedActivityForAttendance}
          />
        )}

        {/* Dedicated Attendance Tab for Executive Navigation */}
        {currentTab === 'attendance' && (
          <ActivityList
            activities={activities}
            members={members}
            lgs={lgs}
            attendanceModeOnly={true}
          />
        )}

        {/* Members Directory for Leadership */}
        {currentTab === 'members' && isLeadershipRole(currentRole) && (
          <MemberList
            members={members}
            lgs={lgs}
            tasks={tasks}
            activities={activities}
          />
        )}

        {/* Profile Tab for Member Navigation */}
        {currentTab === 'profile' && (
          <ProfileView
            tasks={tasks}
            activities={activities}
            onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          />
        )}

        {currentTab === 'documents' && <DocumentLibrary documents={documents} />}

        {currentTab === 'learning' && (
          <LearningHub
            learning={learning}
            initialResource={selectedLearningForModal}
          />
        )}

        {/* Monthly Reports for Executive & Leadership */}
        {currentTab === 'reports' && currentRole !== 'MEMBER' && (
          <MonthlyReports
            reports={reports}
            lgs={lgs}
            tasks={tasks}
            activities={activities}
            initialReport={selectedReportForModal}
          />
        )}

        {/* Administration for CDS Coordinator */}
        {currentTab === 'admin' && canAccessAdmin(currentRole) && (
          <AdminPanel members={members} lgs={lgs} settings={settings} />
        )}
      </main>

      {/* Global Assign Task Modal */}
      <TaskFormModal
        isOpen={isTaskCreateOpen}
        onClose={() => setIsTaskCreateOpen(false)}
        members={members}
        lgs={lgs}
      />

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenMore={() => setIsMobileMoreOpen(true)}
        overdueTaskCount={overdueCount}
      />

      {/* Mobile "More" Drawer Modal */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileMoreOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full bg-white rounded-t-2xl p-5 space-y-3 z-10 animate-in slide-in-from-bottom-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Additional CDS Modules</h3>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentTab(item.id);
                      setIsMobileMoreOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center gap-2.5 text-xs font-bold text-slate-800 transition-colors min-h-[46px]"
                  >
                    <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
