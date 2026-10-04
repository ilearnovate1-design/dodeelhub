import React from 'react';
import { Activity } from '../../types';
import { formatDate } from '../../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { Calendar, Clock, MapPin, UserCheck, Users } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  onClick: (activity: Activity) => void;
  onMarkAttendance?: (activity: Activity) => void;
  canMarkAttendance?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onClick,
  onMarkAttendance,
  canMarkAttendance = false,
}) => {
  const records = activity.attendanceRecords || [];
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;

  return (
    <div
      onClick={() => onClick(activity)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(activity);
        }
      }}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 transition-all p-4 shadow-2xs cursor-pointer flex flex-col justify-between focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {activity.lgName}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {activity.locationType === 'ONLINE' ? 'Virtual' : 'In-Person'}
            </span>
          </div>
          <StatusBadge status={activity.status} size="sm" />
        </div>

        <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
          {activity.title}
        </h3>

        <div className="space-y-1 mt-2.5 text-xs text-slate-600">
          <p className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800">{formatDate(activity.date)}</span>
            <span className="text-slate-400">•</span>
            <span>{activity.time}</span>
          </p>
          <p className="flex items-center gap-1.5 text-slate-500 truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{activity.location}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="text-[11px] text-slate-500">
          {records.length > 0 ? (
            <span className="font-semibold text-emerald-700">
              {presentCount} Present ({records.length} marked)
            </span>
          ) : (
            <span>Expected: {activity.expectedAttendance}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canMarkAttendance && onMarkAttendance && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAttendance(activity);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-colors shadow-2xs text-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{records.length > 0 ? 'Attendance' : 'Mark'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
