import React from 'react';
import { Member } from '../../types';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import { AccountStatusBadge } from './AccountStatusBadge';
import { KeyRound, Mail, MapPin, Phone } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  onClick: (member: Member) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
  return (
    <div
      onClick={() => onClick(member)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(member);
        }
      }}
      className={`bg-white rounded-2xl border transition-all p-4 shadow-2xs cursor-pointer flex flex-col justify-between focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 ${
        member.accountStatus === 'SUSPENDED'
          ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
          : member.accountStatus === 'PENDING'
          ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
          : 'border-slate-200 hover:border-emerald-300'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
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
            <div className="truncate">
              <h3 className="text-xs font-bold text-slate-900 truncate">{member.fullName}</h3>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {member.lgName}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <AccountStatusBadge status={member.accountStatus || 'ACTIVE'} size="sm" />
            <StatusBadge status={member.membershipStatus} size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap my-2">
          <RoleBadge role={member.role} size="sm" />
          {member.stateCode && (
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              {member.stateCode}
            </span>
          )}
          {member.assignedTeam && (
            <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
              {member.assignedTeam}
            </span>
          )}
        </div>

        {member.accountStatus === 'PENDING' && member.invitationCode && (
          <div className="my-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-amber-600" />
              <span>Invite Code:</span>
            </span>
            <span className="font-mono font-bold tracking-wider">{member.invitationCode}</span>
          </div>
        )}

        {member.skills && member.skills.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-2">
            {member.skills.slice(0, 3).map((skill, i) => (
              <span
                key={i}
                className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="truncate">{member.phone}</span>
        <span className="text-emerald-700 font-bold hover:underline shrink-0">
          View Profile →
        </span>
      </div>
    </div>
  );
};
