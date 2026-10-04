import React from 'react';
import { ActivityStatus, MembershipStatus, TaskStatus } from '../../types';
import { AlertCircle, CheckCircle2, Clock, PlayCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus | ActivityStatus | MembershipStatus | 'PRESENT' | 'ABSENT';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'NOT_STARTED':
        return {
          label: 'Not Started',
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Clock,
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          classes: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: PlayCircle,
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'OVERDUE':
        return {
          label: 'Overdue',
          classes: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
          icon: AlertCircle,
        };
      case 'UPCOMING':
        return {
          label: 'Upcoming',
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          classes: 'bg-slate-100 text-slate-500 border-slate-200',
          icon: AlertCircle,
        };
      case 'ACTIVE':
        return {
          label: 'Active',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'INACTIVE':
        return {
          label: 'Inactive',
          classes: 'bg-slate-100 text-slate-500 border-slate-200',
          icon: Clock,
        };
      case 'PENDING':
        return {
          label: 'Pending',
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
      case 'PRESENT':
        return {
          label: 'Present',
          classes: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
          icon: CheckCircle2,
        };
      case 'ABSENT':
        return {
          label: 'Absent',
          classes: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
          icon: AlertCircle,
        };
      default:
        return {
          label: status,
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Clock,
        };
    }
  };

  const { label, classes, icon: Icon } = getBadgeConfig();
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5 gap-1' : 'text-sm px-3 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center rounded-md border font-bold ${classes} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className="uppercase tracking-tight">{label}</span>
    </span>
  );
};
