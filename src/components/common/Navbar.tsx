import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isLeadershipRole, ROLE_LABELS } from '../../utils/permissions';
import { RoleBadge } from './RoleBadge';
import { RoleSwitcherModal } from './RoleSwitcherModal';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  CloudOff,
  FileText,
  FolderLock,
  LayoutDashboard,
  Menu,
  RotateCw,
  Shield,
  TrendingUp,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenRoleSwitcher?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenRoleSwitcher,
}) => {
  const { currentUser, currentRole } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!currentUser) return null;

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Compute strictly role-tailored navigation modules per user brief
  const getNavItems = () => {
    if (currentRole === 'MEMBER') {
      return [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'activities', label: 'Activities', icon: Calendar },
        { id: 'learning', label: 'Learning', icon: BookOpen },
        { id: 'documents', label: 'Documents', icon: FolderLock },
        { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
        { id: 'profile', label: 'Profile', icon: User },
      ];
    }

    if (currentRole === 'EXECUTIVE' || currentRole === 'GROUP_LEADER') {
      return [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
        { id: 'activities', label: 'Activities', icon: Calendar },
        { id: 'attendance', label: 'Attendance', icon: UserCheck },
        { id: 'learning', label: 'Learning', icon: BookOpen },
        { id: 'documents', label: 'Documents', icon: FolderLock },
        { id: 'reports', label: 'Reports', icon: FileText },
      ];
    }

    // Leadership roles: CDS Coordinator, State President, VPs, LG President
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare },
      { id: 'accountability', label: 'Accountability', icon: TrendingUp },
      { id: 'members', label: 'Members', icon: Users },
      { id: 'activities', label: 'Activities', icon: Calendar },
      { id: 'learning', label: 'Learning', icon: BookOpen },
      { id: 'documents', label: 'Documents', icon: FolderLock },
      { id: 'reports', label: 'Reports', icon: FileText },
    ];

    if (currentRole === 'CDS_COORDINATOR') {
      items.push({ id: 'admin', label: 'Administration', icon: Shield });
    }

    return items;
  };

  const navItems = getNavItems();

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    setIsMobileMenuOpen(false);
  };

  const handleOpenRoleModal = () => {
    if (onOpenRoleSwitcher) {
      onOpenRoleSwitcher();
    } else {
      setIsRoleModalOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className="flex items-center gap-2 text-left focus:outline-hidden"
                aria-label="DO-DEEL CDS Manager Home"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-800 to-teal-600 flex items-center justify-center text-white shadow-xs font-black text-xs sm:text-sm tracking-tight">
                  DO
                </div>
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                      DO-DEEL
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 tracking-wider">
                      CDS
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate max-w-[130px] sm:max-w-xs mt-0.5">
                    CDS Manager
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Role Persona Switcher & Mobile Menu Trigger */}
            <div className="flex items-center gap-2">
              {!isOnline && (
                <div 
                  className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-700 animate-pulse"
                  title="Your changes will sync when you reconnect"
                >
                  <CloudOff className="w-3 h-3" />
                  <span className="hidden xs:inline uppercase tracking-wider">Working Offline</span>
                </div>
              )}
              
              <button
                type="button"
                onClick={handleOpenRoleModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 transition-colors shadow-2xs"
                title="Switch persona for testing"
                aria-label={`Current Role: ${ROLE_LABELS[currentRole]}. Click to switch.`}
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span className="hidden sm:inline text-slate-500 font-normal">Role:</span>
                <span className="font-bold text-slate-900 max-w-[110px] sm:max-w-[150px] truncate">
                  {ROLE_LABELS[currentRole]}
                </span>
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
                aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
            {/* User Persona Header */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.lgName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleOpenRoleModal();
                }}
                className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shrink-0"
              >
                Switch Role
              </button>
            </div>

            {/* Menu Buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold transition-all min-h-[44px] ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </>
  );
};
