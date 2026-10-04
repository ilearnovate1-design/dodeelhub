import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LocalGovernment, Member, MembershipStatus, UserRole } from '../../types';
import { isScopedToLG, ROLE_LABELS } from '../../utils/permissions';
import { Modal } from '../common/Modal';

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
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('ACTIVE');
  const [stateCode, setStateCode] = useState('OD/26A/');
  const [operationalBatch, setOperationalBatch] = useState(settings.operationalBatch);
  const [fcmbAccount, setFcmbAccount] = useState('');
  const [ppaName, setPpaName] = useState('');
  const [ppaAddress, setPpaAddress] = useState('');
  const [skillsStr, setSkillsStr] = useState('Digital Literacy, Canva, Google Docs');
  const [bio, setBio] = useState('');

  // Handle LG Scoping
  useEffect(() => {
    if (isLGScoped && currentUser) {
      setLgId(currentUser.lgId);
    } else if (lgs.length > 0 && !lgId) {
      setLgId(lgs[0].id);
    }
  }, [isLGScoped, currentUser, lgs, lgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    const selectedLG = lgs.find((l) => l.id === lgId) || { id: lgId, name: 'Akure South LG' };
    const skills = skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newMember: Member = {
      id: `user-${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      lgId: selectedLG.id,
      lgName: selectedLG.name,
      state: settings.state,
      role,
      membershipStatus,
      dateJoined: new Date().toISOString().split('T')[0],
      stateCode: stateCode.trim(),
      operationalBatch: operationalBatch.trim(),
      fcmbAccount: fcmbAccount.trim(),
      ppaName: ppaName.trim(),
      ppaAddress: ppaAddress.trim(),
      skills,
      bio: bio.trim(),
      password: 'password123',
      requiresProfileUpdate: true,
    };

    await dataService.saveMemberAsync(newMember);
    onClose();
    // Reset
    setFullName('');
    setEmail('');
    setPhone('+234 ');
    setBio('');
    setFcmbAccount('');
    setPpaName('');
    setPpaAddress('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll New CDS Member"
      subtitle="Register an NYSC corps member or DO-DEEL participant"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <p className="text-[10px] text-slate-500 leading-tight">
            <strong>Note:</strong> Newly enrolled members will have their password set to <span className="font-bold">password123</span> by default. They will be required to update their profile upon first login.
          </p>
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
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
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
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Local Government (LG)
            </label>
            <select
              value={lgId}
              onChange={(e) => setLgId(e.target.value)}
              disabled={isLGScoped}
              className={`w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 ${isLGScoped ? 'opacity-70 bg-slate-50' : ''}`}
            >
              {lgs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">NYSC State Code</label>
            <input
              type="text"
              placeholder="e.g. OD/26A/1234"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Operational Batch</label>
            <select
              value={operationalBatch}
              onChange={(e) => setOperationalBatch(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              {settings.operationalBatches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">FCMB Account Number</label>
            <input
              type="text"
              placeholder="10-digit account number"
              value={fcmbAccount}
              onChange={(e) => setFcmbAccount(e.target.value)}
              maxLength={10}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Membership Status</label>
            <select
              value={membershipStatus}
              onChange={(e) => setMembershipStatus(e.target.value as MembershipStatus)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">PPA Name</label>
            <input
              type="text"
              placeholder="e.g. Agidingbi Grammar School"
              value={ppaName}
              onChange={(e) => setPpaName(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Operational Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">PPA Address</label>
          <input
            type="text"
            placeholder="Detailed physical address of your PPA"
            value={ppaAddress}
            onChange={(e) => setPpaAddress(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Skills & Interests (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g. Graphic Design, Public Speaking, Web Development"
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Short Bio</label>
          <textarea
            rows={2}
            placeholder="Brief background or areas of contribution..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            Enroll Member
          </button>
        </div>
      </form>
    </Modal>
  );
};
