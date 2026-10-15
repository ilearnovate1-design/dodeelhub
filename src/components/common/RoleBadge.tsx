import React from 'react';
import { UserRole } from '../../types';
import { ROLE_LABELS } from '../../utils/permissions';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'sm' }) => {
  const getRoleStyle = (r: UserRole) => {
    switch (r) {
      case 'CDS_COORDINATOR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'STATE_PRESIDENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'VP_GROWTH':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'VP_ACCOUNTABILITY':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'VP_COMMUNITY_IMPACT':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'LG_PRESIDENT':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'EXECUTIVE':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'GROUP_LEADER':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'MEMBER':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center font-bold rounded px-2 py-0.5 border ${getRoleStyle(
        role
      )} text-[10px] uppercase tracking-wide`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
};
