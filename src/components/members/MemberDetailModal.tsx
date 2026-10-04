import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, Member, Task } from '../../types';
import { formatDate } from '../../utils/formatters';
import { ROLE_LABELS } from '../../utils/permissions';
import { Modal } from '../common/Modal';
import { RoleBadge } from '../common/RoleBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Tag,
  UserCheck,
} from 'lucide-react';

interface MemberDetailModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  activities: Activity[];
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  isOpen,
  onClose,
  tasks,
  activities,
}) => {
  if (!member) return null;

  const memberTasks = tasks.filter((t) => t.assignedUserId === member.id);
  const completedTasks = memberTasks.filter((t) => t.calculatedStatus === 'COMPLETED').length;

  // Attendance history
  const attendedActivities = activities.filter((act) =>
    act.attendanceRecords.some((r) => r.memberId === member.id && r.status === 'PRESENT')
  );

  const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Member Profile"
      subtitle={`${member.fullName} • ${member.lgName}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Profile Header */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            {member.profilePhoto ? (
              <img
                src={member.profilePhoto}
                alt={member.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              member.fullName.charAt(0)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 truncate">{member.fullName}</h3>
              <StatusBadge status={member.membershipStatus} size="sm" />
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <RoleBadge role={member.role} size="sm" />
              {member.stateCode && (
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {member.stateCode}
                </span>
              )}
              {member.operationalBatch && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {member.operationalBatch}
                </span>
              )}
              {member.fcmbAccount && (
                <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  FCMB: {member.fcmbAccount}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              {member.lgName} • Joined {formatDate(member.dateJoined)}
            </p>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <a
            href={`tel:${member.phone}`}
            className="flex items-center justify-center gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Call {member.phone}</span>
          </a>

          <a
            href={`mailto:${member.email}`}
            className="flex items-center justify-center gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors truncate"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate">Email Member</span>
          </a>
        </div>

        {/* PPA Details */}
        {(member.ppaName || member.ppaAddress) && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Place of Primary Assignment (PPA)
            </h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              {member.ppaName && <p className="text-xs font-bold text-slate-800">{member.ppaName}</p>}
              {member.ppaAddress && <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{member.ppaAddress}</p>}
            </div>
          </div>
        )}

        {/* Bio & Skills */}
        {member.bio && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              About Member
            </h4>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              {member.bio}
            </p>
          </div>
        )}

        {member.skills && member.skills.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Skills & Interests
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {member.skills.map((s, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Performance & Activity Snapshot */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Assigned Tasks</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {completedTasks} / {memberTasks.length}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium">Completed with evidence</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Activities Attended
            </span>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {attendedActivities.length} Sessions
            </p>
            <p className="text-[10px] text-slate-500">Verified attendance roll</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
