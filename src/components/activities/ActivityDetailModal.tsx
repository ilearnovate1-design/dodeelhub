import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, Member } from '../../types';
import { formatDate } from '../../utils/formatters';
import { canMarkAttendance, ROLE_LABELS } from '../../utils/permissions';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAttendance: (activity: Activity) => void;
  members: Member[];
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  isOpen,
  onClose,
  onOpenAttendance,
  members,
}) => {
  const { currentRole } = useAuth();

  if (!activity) return null;

  const canMark = canMarkAttendance(currentRole);
  const records = activity.attendanceRecords || [];
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activity.title}
      subtitle={`DO-DEEL Activity • ${activity.lgName}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">Date & Time</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              {formatDate(activity.date)} at {activity.time}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">Format & Venue</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {activity.locationType === 'ONLINE' ? 'Virtual (Online)' : 'In-Person'}
            </span>
          </div>

          <div className="col-span-2">
            <span className="text-[11px] text-slate-500 block">Location / Meeting Link</span>
            <p className="font-semibold text-slate-800 mt-1 break-all bg-white p-2 rounded-lg border border-slate-200">
              {activity.location}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Activity Details
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
            {activity.description}
          </p>
        </div>

        {/* Organizer info */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block">Organized By</span>
            <span className="font-bold text-slate-900">{activity.organizerName}</span>
            <span className="text-[11px] text-slate-500 block">
              {ROLE_LABELS[activity.organizerRole]}
            </span>
          </div>

          <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
            Expected: {activity.expectedAttendance} Participants
          </span>
        </div>

        {/* Attendance Summary & Action */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Attendance Roll ({records.length} Recorded)</span>
            </h4>

            {canMark && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAttendance(activity);
                }}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Take / Edit Attendance</span>
              </button>
            )}
          </div>

          {records.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-500">Attendance has not been marked yet.</p>
              {canMark && (
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Click 'Take / Edit Attendance' above to mark members present.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <div className="flex items-center gap-3 p-2 text-xs font-semibold bg-slate-50 rounded-lg">
                <span className="text-emerald-700">{presentCount} Present</span>
                <span className="text-rose-700">{absentCount} Absent</span>
                <span className="text-slate-400">
                  Rate: {Math.round((presentCount / records.length) * 100)}%
                </span>
              </div>

              {records.map((r) => (
                <div
                  key={r.memberId}
                  className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-100 text-xs"
                >
                  <span className="font-medium text-slate-800">{r.memberName}</span>
                  <StatusBadge status={r.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
