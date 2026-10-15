import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, LocalGovernment, Member, Task, UserRole } from '../../types';
import { formatDate } from '../../utils/formatters';
import { 
  canChangeMemberLG, 
  canChangeMemberRole, 
  canManageAccountStatus, 
  ROLE_LABELS 
} from '../../utils/permissions';
import { dataService } from '../../services/dataService';
import { Modal } from '../common/Modal';
import { RoleBadge } from '../common/RoleBadge';
import { StatusBadge } from '../common/StatusBadge';
import { AccountStatusBadge } from '../common/AccountStatusBadge';
import {
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';

interface MemberDetailModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  activities: Activity[];
  lgs?: LocalGovernment[];
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  isOpen,
  onClose,
  tasks,
  activities,
  lgs = [],
}) => {
  const { currentUser, currentRole } = useAuth();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Administrative action modal states
  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [confirmRoleOpen, setConfirmRoleOpen] = useState(false);
  const [confirmLgOpen, setConfirmLgOpen] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [targetRole, setTargetRole] = useState<UserRole>(member?.role || 'MEMBER');
  const [isChangingLG, setIsChangingLG] = useState(false);
  const [targetLGId, setTargetLGId] = useState(member?.lgId || '');

  if (!member) return null;

  const memberTasks = tasks.filter((t) => t.assignedUserId === member.id);
  const completedTasks = memberTasks.filter((t) => t.calculatedStatus === 'COMPLETED').length;

  const attendedActivities = activities.filter((act) =>
    act.attendanceRecords.some((r) => r.memberId === member.id && r.status === 'PRESENT')
  );

  const canManageStatus = currentUser
    ? canManageAccountStatus(currentRole, member.role, currentUser.lgId, member.lgId) &&
      currentUser.id !== member.id
    : false;

  const canChangeRole = canChangeMemberRole(currentRole, member.role) && currentUser?.id !== member.id;
  const canChangeLG = canChangeMemberLG(currentRole) && currentUser?.id !== member.id;

  const activationUrl = member.invitationCode
    ? `${window.location.origin}?activate=true&email=${encodeURIComponent(member.email)}&code=${encodeURIComponent(
        member.invitationCode
      )}`
    : '';

  const copyActivationLink = () => {
    if (!activationUrl) return;
    navigator.clipboard.writeText(activationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyActivationCode = () => {
    if (!member.invitationCode) return;
    navigator.clipboard.writeText(member.invitationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSuspend = async () => {
    setIsProcessing(true);
    try {
      await dataService.suspendMemberAsync(member.id);
      member.accountStatus = 'SUSPENDED';
      setConfirmSuspendOpen(false);
      setActionSuccess('Account access suspended. Historical records remain fully preserved.');
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivate = async () => {
    setIsProcessing(true);
    try {
      await dataService.reactivateMemberAsync(member.id);
      member.accountStatus = 'ACTIVE';
      setConfirmReactivateOpen(false);
      setActionSuccess('Account access successfully reactivated.');
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerateCode = async () => {
    setIsProcessing(true);
    try {
      const res = await dataService.resendInvitationAsync(member.id);
      member.invitationCode = res.invitationCode;
      member.accountStatus = 'PENDING';
      setActionSuccess(`New invitation code generated: ${res.invitationCode}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveRole = async () => {
    setIsProcessing(true);
    try {
      await dataService.updateMemberRoleAsync(member.id, targetRole);
      member.role = targetRole;
      setIsChangingRole(false);
      setActionSuccess(`Role updated to ${ROLE_LABELS[targetRole]}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveLG = async () => {
    const selectedLG = lgs.find((l) => l.id === targetLGId);
    if (!selectedLG) return;
    setIsProcessing(true);
    try {
      await dataService.updateMemberLGAsync(member.id, selectedLG.id, selectedLG.name);
      member.lgId = selectedLG.id;
      member.lgName = selectedLG.name;
      setIsChangingLG(false);
      setActionSuccess(`Chapter reassigned to ${selectedLG.name}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Member Profile"
      subtitle={`${member.fullName} • ${member.lgName}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Action feedback banner */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Profile Header */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
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
            <div className="flex items-center gap-2 flex-wrap justify-between">
              <h3 className="text-base font-bold text-slate-900 truncate">{member.fullName}</h3>
              <div className="flex items-center gap-1.5">
                <AccountStatusBadge status={member.accountStatus || 'ACTIVE'} size="sm" />
                <StatusBadge status={member.membershipStatus} size="sm" />
              </div>
            </div>

            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <RoleBadge role={member.role} size="sm" />
              {member.stateCode && (
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                  {member.stateCode}
                </span>
              )}
              {member.operationalBatch && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {member.operationalBatch}
                </span>
              )}
              {member.assignedTeam && (
                <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {member.assignedTeam}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              {member.lgName} • Enrolled {formatDate(member.dateJoined)}
            </p>
          </div>
        </div>

        {/* Pending Invitation Control Box */}
        {member.accountStatus === 'PENDING' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 text-xs text-amber-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Pending Invitation Credentials</span>
              </div>
              <button
                type="button"
                onClick={handleRegenerateCode}
                disabled={isProcessing}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate Code</span>
              </button>
            </div>

            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              This member has been registered by administration but has not yet activated their password.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-white border border-amber-200 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Activation Code</span>
                  <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                    {member.invitationCode || 'None'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyActivationCode}
                  className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-white border border-amber-200 rounded-xl p-2.5 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Direct Activation Link</span>
                  <span className="font-mono text-slate-600 text-[11px] truncate block">
                    {activationUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyActivationLink}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                >
                  {copiedLink ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suspended Notice Banner */}
        {member.accountStatus === 'SUSPENDED' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Account Access Currently Suspended</p>
              <p className="text-[11px] text-rose-800/90 mt-0.5 leading-relaxed">
                This member cannot log in to the portal. However, all past attendance records, completed tasks, and submissions remain intact in the system.
              </p>
            </div>
          </div>
        )}

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
            <span className="truncate">Email {member.email}</span>
          </a>
        </div>

        {/* Administrative Management Controls */}
        {(canManageStatus || canChangeRole || canChangeLG) && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Administrative Account Governance
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Suspend / Reactivate Controls */}
              {canManageStatus && (
                <>
                  {member.accountStatus === 'SUSPENDED' ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReactivateOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Reactivate Access</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmSuspendOpen(true)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Suspend Account Access</span>
                    </button>
                  )}
                </>
              )}

              {/* Change Role */}
              {canChangeRole && !isChangingRole && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetRole(member.role);
                    setIsChangingRole(true);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Change Role
                </button>
              )}

              {/* Reassign LG */}
              {canChangeLG && !isChangingLG && lgs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetLGId(member.lgId);
                    setIsChangingLG(true);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Reassign Chapter
                </button>
              )}
            </div>

            {/* Change Role Inline Form */}
            {isChangingRole && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in">
                <label className="text-xs font-bold text-slate-700 block">
                  Select New Operational Role:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as UserRole)}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setConfirmRoleOpen(true)}
                    disabled={isProcessing}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Change Role...
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingRole(false)}
                    className="px-2.5 py-2 text-slate-500 hover:text-slate-800 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Change LG Inline Form */}
            {isChangingLG && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in">
                <label className="text-xs font-bold text-slate-700 block">
                  Reassign to Local Government Chapter:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={targetLGId}
                    onChange={(e) => setTargetLGId(e.target.value)}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                  >
                    {lgs.map((lg) => (
                      <option key={lg.id} value={lg.id}>
                        {lg.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setConfirmLgOpen(true)}
                    disabled={isProcessing}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Change Chapter...
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingLG(false)}
                    className="px-2.5 py-2 text-slate-500 hover:text-slate-800 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PPA Details */}
        {(member.ppaName || member.ppaAddress) && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Place of Primary Assignment (PPA)
            </h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              {member.ppaName && <p className="text-xs font-bold text-slate-800">{member.ppaName}</p>}
              {member.ppaAddress && (
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{member.ppaAddress}</p>
              )}
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

      {/* Confirmation Dialog: Suspend */}
      {confirmSuspendOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-rose-700 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Confirm Account Suspension</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to suspend access for <strong>{member.fullName}</strong>?
              They will be unable to log in to the portal, but their historical CDS records, submitted tasks, attendance, and evidence will be safely preserved.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmSuspendOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspend}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                {isProcessing ? 'Suspending...' : 'Yes, Suspend Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Reactivate */}
      {confirmReactivateOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>Confirm Account Reactivation</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Reactivate DO-DEEL portal access for <strong>{member.fullName}</strong>?
              They will be able to log in and participate in their chapter immediately.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmReactivateOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReactivate}
                disabled={isProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                {isProcessing ? 'Reactivating...' : 'Reactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Change Role */}
      {confirmRoleOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-purple-800 font-bold text-sm">
              <Shield className="w-5 h-5 shrink-0" />
              <span>Confirm Role Modification</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Change operational role for <strong>{member.fullName}</strong> from{' '}
              <span className="font-bold">{ROLE_LABELS[member.role]}</span> to{' '}
              <span className="font-bold text-purple-700">{ROLE_LABELS[targetRole]}</span>?
            </p>
            <p className="text-[11px] text-slate-500">
              Their operational permissions and dashboard views will immediately adjust.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmRoleOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmRoleOpen(false);
                  await handleSaveRole();
                }}
                disabled={isProcessing}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold"
              >
                {isProcessing ? 'Saving...' : 'Yes, Confirm Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Change LG Chapter */}
      {confirmLgOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-blue-800 font-bold text-sm">
              <MapPin className="w-5 h-5 shrink-0" />
              <span>Confirm Chapter Transfer</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transfer <strong>{member.fullName}</strong> from <strong>{member.lgName}</strong> to{' '}
              <strong className="text-blue-700">
                {lgs.find((l) => l.id === targetLGId)?.name || 'New Chapter'}
              </strong>?
            </p>
            <p className="text-[11px] text-slate-500">
              Active chapter counts will be recalculated automatically.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmLgOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmLgOpen(false);
                  await handleSaveLG();
                }}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold"
              >
                {isProcessing ? 'Transferring...' : 'Yes, Transfer Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
