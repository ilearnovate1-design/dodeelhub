import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPIStatProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
  onClick?: () => void;
}

export const KPIStat: React.FC<KPIStatProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  onClick,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300',
          text: 'text-emerald-900',
          iconBg: 'bg-emerald-100 text-emerald-800',
          sub: 'text-emerald-700',
        };
      case 'blue':
        return {
          bg: 'bg-blue-50/60 border-blue-200 hover:border-blue-300',
          text: 'text-blue-900',
          iconBg: 'bg-blue-100 text-blue-800',
          sub: 'text-blue-700',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50/60 border-purple-200 hover:border-purple-300',
          text: 'text-purple-900',
          iconBg: 'bg-purple-100 text-purple-800',
          sub: 'text-purple-700',
        };
      case 'rose':
        return {
          bg: 'bg-rose-50/60 border-rose-200 hover:border-rose-300',
          text: 'text-rose-900',
          iconBg: 'bg-rose-100 text-rose-800',
          sub: 'text-rose-700',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50/60 border-amber-200 hover:border-amber-300',
          text: 'text-amber-900',
          iconBg: 'bg-amber-100 text-amber-800',
          sub: 'text-amber-700',
        };
      case 'default':
      default:
        return {
          bg: 'bg-white border-slate-200 hover:border-slate-300',
          text: 'text-slate-900',
          iconBg: 'bg-slate-100 text-slate-700',
          sub: 'text-slate-500',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      onClick={onClick}
      className={`p-3.5 sm:p-4 rounded-xl border shadow-2xs transition-colors flex flex-col justify-between ${styles.bg} ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 truncate">
          {label}
        </span>
        {Icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg}`}>
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="mt-1.5">
        <p className={`text-xl sm:text-2xl font-black tracking-tight leading-none ${styles.text}`}>
          {value}
        </p>
        {subtext && (
          <p className={`text-[11px] font-medium mt-1 truncate ${styles.sub}`}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
