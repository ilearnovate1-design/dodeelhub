import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, Task } from '../../types';
import { formatDate } from '../../utils/formatters';
import { ROLE_LABELS } from '../../utils/permissions';
import { RoleBadge } from '../common/RoleBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
  X,
} from 'lucide-react';

interface ProfileViewProps {
  tasks: Task[];
  activities: Activity[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  tasks,
  activities,
}) => {
  const { currentUser, updateCurrentUserProfile, logout } = useAuth();

  if (!currentUser) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [skillsStr, setSkillsStr] = useState((currentUser.skills || []).join(', '));
  const [bio, setBio] = useState(currentUser.bio || '');
  const [fcmbAccount, setFcmbAccount] = useState(currentUser.fcmbAccount || '');
  const [ppaName, setPpaName] = useState(currentUser.ppaName || '');
  const [ppaAddress, setPpaAddress] = useState(currentUser.ppaAddress || '');

  // Tasks statistics
  const myTasks = tasks.filter((t) => t.assignedUserId === currentUser.id);
  const completedTasks = myTasks.filter((t) => t.calculatedStatus === 'COMPLETED').length;

  // Attendance statistics
  let attendedCount = 0;
  let totalEligible = 0;
  activities.forEach((act) => {
    const rec = act.attendanceRecords.find((r) => r.memberId === currentUser.id);
    if (rec) {
      totalEligible++;
      if (rec.status === 'PRESENT') attendedCount++;
    }
  });
  const attendanceRate = totalEligible > 0 ? Math.round((attendedCount / totalEligible) * 100) : 100;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateCurrentUserProfile({
      phone: phone.trim(),
      skills,
      bio: bio.trim(),
      fcmbAccount: fcmbAccount.trim(),
      ppaName: ppaName.trim(),
      ppaAddress: ppaAddress.trim(),
      requiresProfileUpdate: false,
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Mandatory Update Alert */}
      {currentUser.requiresProfileUpdate && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Mandatory Profile Update Required</h3>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              To complete your DO-DEEL onboarding, please update your PPA details, FCMB account, bio, and skills. This helps the leadership track community impact and assign responsibilities effectively.
            </p>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-2 text-xs font-bold text-amber-700 hover:text-amber-900 underline"
              >
                Update Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Banner & Avatar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-800 via-emerald-700 to-slate-900" />
        <div className="px-5 pb-5 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex items-end gap-3.5">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center ring-4 ring-white shadow-md overflow-hidden shrink-0">
                {currentUser.profilePhoto ? (
                  <img
                    src={currentUser.profilePhoto}
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.fullName.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                  {currentUser.fullName}
                </h1>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{currentUser.lgName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-slate-100">
            <RoleBadge role={currentUser.role} size="sm" />
            <StatusBadge status={currentUser.membershipStatus} size="sm" />
            {currentUser.stateCode && (
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                Code: {currentUser.stateCode}
              </span>
            )}
            {currentUser.callUpNo && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                Call-up: {currentUser.callUpNo}
              </span>
            )}
            {currentUser.operationalBatch && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {currentUser.operationalBatch}
              </span>
            )}
            {currentUser.fcmbAccount && (
              <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                FCMB: {currentUser.fcmbAccount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editing Form or Readonly Information */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Update Profile Details</h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">FCMB Account Number</label>
              <input
                type="text"
                value={fcmbAccount}
                onChange={(e) => setFcmbAccount(e.target.value)}
                maxLength={10}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">PPA Name</label>
              <input
                type="text"
                value={ppaName}
                onChange={(e) => setPpaName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Skills & Competencies (comma separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">PPA Address</label>
            <input
              type="text"
              value={ppaAddress}
              onChange={(e) => setPpaAddress(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Bio / CDS Objective</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact & Bio */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact & Info</h3>
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{currentUser.email}</span>
              </p>
              <p className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{currentUser.phone}</span>
              </p>
              {currentUser.fcmbAccount && (
                <p className="flex items-center gap-2 text-slate-700">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-bold text-blue-700">FCMB: {currentUser.fcmbAccount}</span>
                </p>
              )}
              <p className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Joined {formatDate(currentUser.dateJoined)}</span>
              </p>
            </div>

            {(currentUser.ppaName || currentUser.ppaAddress) && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">PPA Details</span>
                {currentUser.ppaName && <p className="text-xs font-bold text-slate-800">{currentUser.ppaName}</p>}
                {currentUser.ppaAddress && <p className="text-[11px] text-slate-600 mt-0.5">{currentUser.ppaAddress}</p>}
              </div>
            )}

            {currentUser.bio && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">About</span>
                <p className="text-xs text-slate-600 leading-relaxed">{currentUser.bio}</p>
              </div>
            )}
          </div>

          {/* Performance & Skills */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              CDS Participation
            </h3>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Attendance</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{attendanceRate}%</p>
                <span className="text-[10px] text-emerald-700 font-medium">
                  {attendedCount} / {totalEligible} sessions
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tasks Completed</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{completedTasks}</p>
                <span className="text-[10px] text-slate-500 font-medium">
                  of {myTasks.length} assigned
                </span>
              </div>
            </div>

            {currentUser.skills && currentUser.skills.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                  Skills & Interests
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentUser.skills.map((s, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
