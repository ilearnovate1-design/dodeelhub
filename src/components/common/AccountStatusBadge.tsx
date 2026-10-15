import React from 'react';
import { AccountStatus } from '../../types';

interface AccountStatusBadgeProps {
  status: AccountStatus;
  size?: 'sm' | 'md';
}

export const AccountStatusBadge: React.FC<AccountStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStyle = (s: AccountStatus) => {
    switch (s) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SUSPENDED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLabel = (s: AccountStatus) => {
    switch (s) {
      case 'ACTIVE':
        return 'Active';
      case 'PENDING':
        return 'Pending Activation';
      case 'SUSPENDED':
        return 'Suspended';
      default:
        return s;
    }
  };

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${getStyle(
        status
      )} ${sizeClass} tracking-wide`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {getLabel(status)}
    </span>
  );
};
