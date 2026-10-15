import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  FileText,
  FolderLock,
  LayoutDashboard,
  MoreHorizontal,
  User,
  UserCheck,
  Users,
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMore: () => void;
  overdueTaskCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMore,
  overdueTaskCount = 0,
}) => {
  const { currentRole } = useAuth();

  const getTabs = () => {
    if (currentRole === 'MEMBER') {
      return [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: overdueTaskCount },
        { id: 'activities', label: 'Activities', icon: Calendar },
        { id: 'learning', label: 'Learning', icon: BookOpen },
        { id: 'profile', label: 'Profile', icon: User },
      ];
    }

    if (currentRole === 'EXECUTIVE' || currentRole === 'GROUP_LEADER') {
      return [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: overdueTaskCount },
        { id: 'activities', label: 'Activities', icon: Calendar },
        { id: 'attendance', label: 'Attendance', icon: UserCheck },
      ];
    }

    // Leadership
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: overdueTaskCount },
      { id: 'members', label: 'Members', icon: Users },
      { id: 'activities', label: 'Activities', icon: Calendar },
    ];
  };

  const tabs = getTabs();
  const showMoreButton = currentRole !== 'MEMBER';

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 sm:px-3 py-1 shadow-lg"
      aria-label="Mobile Navigation"
    >
      <div className={`grid ${showMoreButton ? 'grid-cols-5' : 'grid-cols-5'} gap-0.5 items-center max-w-md mx-auto`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[46px] ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} aria-hidden="true" />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span
                    className="absolute -top-1 -right-2.5 bg-rose-600 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs"
                    aria-label={`${tab.badge} overdue tasks`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[58px]">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More tab button if not Member */}
        {showMoreButton && (
          <button
            type="button"
            onClick={onOpenMore}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-slate-800 transition-all min-h-[46px]"
            aria-label="More navigation modules"
          >
            <MoreHorizontal className="w-5 h-5 stroke-2" aria-hidden="true" />
            <span className="text-[10px] mt-0.5 tracking-tight">More</span>
          </button>
        )}
      </div>
    </nav>
  );
};
