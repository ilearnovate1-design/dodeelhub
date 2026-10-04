import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LocalGovernment, Member, MembershipStatus, UserRole } from '../../types';
import { isScopedToLG, ROLE_LABELS } from '../../utils/permissions';
import { Modal } from '../common/Modal';
import { Check, Copy, KeyRound, Mail, Send, ShieldCheck, UserCheck, Users } from 'lucide-react';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lgs: LocalGovernment[];
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({ isOpen, onClose, lgs }) => {
  const { currentUser, currentRole } = useAuth();
  const settings = dataService.getSettings();
  const isLGScoped = isScopedToLG(currentRole);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+234 ');
  const [lgId, setLgId] = useState('');
  const [role, setRole] = useState<UserRole>('MEMBER');
  const [assignedTeam, setAssignedTeam] = useState('School Outreach Team Alpha');
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('ACTIVE');
  const [stateCode, setStateCode] = useState('OD/26A/');

  // State after invitation creation
  const [createdMember, setCreatedMember] = useState<Member | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Handle LG Scoping
  useEffect(() => {
    if (isLGScoped && currentUser) {
      setLgId(currentUser.lgId);
    } else if (lgs.length > 0 && !lgId) {
      setLgId(lgs[0].id);
    }
  }, [isLGScoped, currentUser, lgs, lgId]);

  const handleClose = () => {
    setCreatedMember(null);
    setCopiedLink(false);
    setCopiedCode(false);
    setFullName('');
    setEmail('');
    setPhone('+234 ');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    const selectedLG = lgs.find((l) => l.id === lgId) || { id: lgId || 'lg-akure', name: 'Akure South LG' };

    const invitedMember = await dataService.inviteMemberAsync(
      {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        lgId: selectedLG.id,
        lgName: selectedLG.name,
        state: settings.state,
        role,
        groupId: assignedTeam,
        assignedTeam,
        membershipStatus,
        dateJoined: new Date().toISOString().split('T')[0],
        stateCode: stateCode.trim(),
        operationalBatch: settings.operationalBatch,
        skills: ['Digital Literacy'],
        requiresProfileUpdate: true,
      },
      currentUser?.fullName || 'Administrator'
    );

    setCreatedMember(invitedMember);
  };

  const activationUrl = createdMember
    ? `${window.location.origin}?activate=true&email=${encodeURIComponent(
        createdMember.email
      )}&code=${encodeURIComponent(createdMember.invitationCode || '')}`
    : '';

  const copyActivationLink = () => {
    if (!activationUrl) return;
    navigator.clipboard.writeText(activationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyActivationCode = () => {
    if (!createdMember?.invitationCode) return;
    navigator.clipboard.writeText(createdMember.invitationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdMember ? 'Member Invitation Issued' : 'Register & Invite Member'}
      subtitle={
        createdMember
          ? 'Share the activation code or link with the candidate to complete password creation'
          : 'Enroll an authorized corps member into the DO-DEEL CDS system'
      }
      maxWidth="md"
    >
      {createdMember ? (
        /* Invitation Success View */
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs space-y-1 text-emerald-900">
            <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Controlled Invitation Created</span>
            </div>
            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              <strong>{createdMember.fullName}</strong> ({createdMember.email}) has been registered in the system under <strong>{createdMember.lgName}</strong>.
              The account is now <strong>PENDING</strong> until the member activates it and chooses their private password.
            </p>
          </div>

          {/* Invitation Code Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Activation Code
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-black text-slate-900 tracking-wider">
                  {createdMember.invitationCode}
                </div>
                <button
                  type="button"
                  onClick={copyActivationCode}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Direct Activation Link
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activationUrl}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 truncate outline-none select-all"
                />
                <button
                  type="button"
                  onClick={copyActivationLink}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed">
            <strong>Privacy Guarantee:</strong> You will not see or control the member&apos;s password. They will securely set their own password through Firebase Authentication when clicking this link or entering the activation code.
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Done & Return to Directory
            </button>
          </div>
        </div>
      ) : (
        /* Invitation Registration Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] text-slate-600 leading-relaxed">
            <strong>Invitation-Based Enrollment:</strong> The member will be added in <strong>PENDING</strong> status. An invitation code and link will be generated for them to activate their account and choose their password.
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Babajide Daniel"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="member@dodeel.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Local Government (LG Chapter) <span className="text-rose-500">*</span>
              </label>
              <select
                value={lgId}
                onChange={(e) => setLgId(e.target.value)}
                disabled={isLGScoped}
                className={`w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none ${
                  isLGScoped ? 'opacity-70 bg-slate-50' : ''
                }`}
              >
                {lgs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Operational Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                {(Object.keys(ROLE_LABELS) as UserRole[])
                  .filter((r) => !isLGScoped || (r !== 'CDS_COORDINATOR' && r !== 'STATE_PRESIDENT'))
                  .map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                NYSC State Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. OD/26A/1234"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Assigned Team / Group (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. School Outreach Team Alpha"
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Initial Membership Standing
            </label>
            <select
              value={membershipStatus}
              onChange={(e) => setMembershipStatus(e.target.value as MembershipStatus)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="ACTIVE">ACTIVE (Full Participant)</option>
              <option value="PENDING">PENDING (Orientation Phase)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Issue Member Invitation</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
