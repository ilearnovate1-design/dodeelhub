import React from 'react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  alert?: boolean;
}

interface FilterBarProps {
  options: FilterOption[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  options,
  activeId,
  onSelect,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth ${className}`}
      role="tablist"
      aria-label="Filter options"
    >
      {options.map((opt) => {
        const isActive = activeId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(opt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border min-h-[36px] ${
              isActive
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : opt.alert
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : opt.alert
                    ? 'bg-rose-200 text-rose-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
