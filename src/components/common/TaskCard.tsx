import React from 'react';
import { Task } from '../../types';
import { formatDate, getDaysRemaining } from '../../utils/formatters';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { Check, CheckCircle2, MessageSquare, Sparkles, User } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  showAssignee?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  showAssignee = true,
}) => {
  const days = getDaysRemaining(task.deadline);
  const status = task.calculatedStatus || 'NOT_STARTED';
  const isOverdue = status === 'OVERDUE';
  const isCompleted = status === 'COMPLETED';

  return (
    <div
      onClick={() => onClick(task)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(task);
        }
      }}
      className={`group bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs flex flex-col justify-between focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 min-h-[145px] ${
        isOverdue
          ? 'border-rose-200 hover:border-rose-400 bg-rose-50/15'
          : isCompleted
          ? 'border-emerald-200/80 hover:border-emerald-300'
          : 'border-slate-200 hover:border-emerald-400 hover:shadow-xs'
      }`}
    >
      <div>
        {/* Top Header: Status & Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <StatusBadge status={status} size="sm" />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {task.lgName || task.assignedLGName}
            </span>
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
          {task.title}
        </h3>

        {/* KPI Target Preview */}
        <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span className="line-clamp-1 font-medium">KPI: {task.kpi}</span>
        </div>
      </div>

      {/* Footer: Assignee & Deadline Status */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {showAssignee ? (
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <div className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
              {task.assignedUserName?.charAt(0) || 'U'}
            </div>
            <span className="font-semibold text-slate-800 truncate max-w-[110px] sm:max-w-[150px]">
              {task.assignedUserName}
            </span>
          </div>
        ) : (
          <span className="text-slate-500 font-medium">
            Due {formatDate(task.deadline)}
          </span>
        )}

        <div className="flex items-center gap-2.5 shrink-0">
          {task.hasEvidence && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Evidence</span>
            </span>
          )}

          {task.comments && task.comments.length > 0 && (
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <MessageSquare className="w-3 h-3" />
              {task.comments.length}
            </span>
          )}

          <span
            className={`font-bold ${
              isOverdue
                ? 'text-rose-600'
                : isCompleted
                ? 'text-emerald-700'
                : 'text-slate-700'
            }`}
          >
            {days.label}
          </span>
        </div>
      </div>
    </div>
  );
};
