import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LocalGovernment, Member, SystemSettings, UserRole } from '../../types';
import { ROLE_LABELS } from '../../utils/permissions';
import { RoleBadge } from '../common/RoleBadge';
import { StatusBadge } from '../common/StatusBadge';
import { AccountStatusBadge } from '../common/AccountStatusBadge';
import { MemberFormModal } from '../members/MemberFormModal';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  Filter,
  KeyRound,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';

interface AdminPanelProps {
  members: Member[];
  lgs: LocalGovernment[];
  settings: SystemSettings;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ members, lgs, settings }) => {
  const { currentUser, currentRole } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<'USERS' | 'LGS' | 'SYSTEM'>('USERS');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Users Filter & Search
  const [userSearch, setUserSearch] = useState('');
  const [filterLg, setFilterLg] = useState('ALL');
  const [filterAccountStatus, setFilterAccountStatus] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');

  // Register & Invite Modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Sensitive Action Confirmation States
  const [confirmSuspendMember, setConfirmSuspendMember] = useState<Member | null>(null);
  const [confirmReactivateMember, setConfirmReactivateMember] = useState<Member | null>(null);
  const [changeRoleTarget, setChangeRoleTarget] = useState<{ member: Member; newRole: UserRole } | null>(null);
  const [changeLgTarget, setChangeLgTarget] = useState<{ member: Member; newLgId: string } | null>(null);
  const [resendInviteInfo, setResendInviteInfo] = useState<{ member: Member; code: string; url: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // New LG form state
  const [isAddingLg, setIsAddingLg] = useState(false);
  const [newLgName, setNewLgName] = useState('');
  const [newLgVenue, setNewLgVenue] = useState('');
  const [newLgMeetingDay, setNewLgMeetingDay] = useState('Every Thursday, 10:00 AM');

  // System Settings state
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editSecretariat, setEditSecretariat] = useState(settings.stateSecretariat);
  const [editBatch, setEditBatch] = useState(settings.operationalBatch);
  const [editBatches, setEditBatches] = useState<string[]>(settings.operationalBatches || []);
  const [newBatchToAdd, setNewBatchToAdd] = useState('');

  // Sync edit state when settings prop changes (e.g. after reset)
  React.useEffect(() => {
    if (!isEditingSettings) {
      setEditSecretariat(settings.stateSecretariat);
      setEditBatch(settings.operationalBatch);
      setEditBatches(settings.operationalBatches || []);
    }
  }, [settings, isEditingSettings]);

  // Filtered members for admin table
  const filteredUsers = useMemo(() => {
    return members.filter((m) => {
      if (filterLg !== 'ALL' && m.lgId !== filterLg) return false;
      if (filterAccountStatus !== 'ALL' && (m.accountStatus || 'ACTIVE') !== filterAccountStatus) return false;
      if (filterRole !== 'ALL' && m.role !== filterRole) return false;

      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        const matchesName = m.fullName.toLowerCase().includes(q);
        const matchesEmail = m.email.toLowerCase().includes(q);
        const matchesPhone = (m.phone || '').toLowerCase().includes(q);
        const matchesCode = (m.stateCode || '').toLowerCase().includes(q);
        const matchesInvite = (m.invitationCode || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCode && !matchesInvite) {
          return false;
        }
      }
      return true;
    });
  }, [members, filterLg, filterAccountStatus, filterRole, userSearch]);

  // Statistics
  const totalCount = members.length;
  const activeCount = members.filter((m) => (m.accountStatus || 'ACTIVE') === 'ACTIVE').length;
  const pendingCount = members.filter((m) => m.accountStatus === 'PENDING').length;
  const suspendedCount = members.filter((m) => m.accountStatus === 'SUSPENDED').length;

  // Sensitive action: Suspend account
  const handleExecuteSuspend = async () => {
    if (!confirmSuspendMember) return;
    setIsProcessing(true);
    try {
      await dataService.suspendMemberAsync(confirmSuspendMember.id);
      setStatusMessage(`Account access suspended for ${confirmSuspendMember.fullName}. Historical records remain intact.`);
      setConfirmSuspendMember(null);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(`Error suspending account: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sensitive action: Reactivate account
  const handleExecuteReactivate = async () => {
    if (!confirmReactivateMember) return;
    setIsProcessing(true);
    try {
      await dataService.reactivateMemberAsync(confirmReactivateMember.id);
      setStatusMessage(`Account access successfully reactivated for ${confirmReactivateMember.fullName}.`);
      setConfirmReactivateMember(null);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(`Error reactivating account: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sensitive action: Change role
  const handleExecuteChangeRole = async () => {
    if (!changeRoleTarget) return;
    setIsProcessing(true);
    try {
      await dataService.updateMemberRoleAsync(changeRoleTarget.member.id, changeRoleTarget.newRole);
      setStatusMessage(`Role for ${changeRoleTarget.member.fullName} updated to ${ROLE_LABELS[changeRoleTarget.newRole]}.`);
      setChangeRoleTarget(null);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sensitive action: Change LG
  const handleExecuteChangeLg = async () => {
    if (!changeLgTarget) return;
    const targetLg = lgs.find((l) => l.id === changeLgTarget.newLgId);
    if (!targetLg) return;

    setIsProcessing(true);
    try {
      await dataService.updateMemberLGAsync(changeLgTarget.member.id, targetLg.id, targetLg.name);
      setStatusMessage(`Chapter reassigned to ${targetLg.name} for ${changeLgTarget.member.fullName}.`);
      setChangeLgTarget(null);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(`Error reassigning chapter: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sensitive action: Resend invitation
  const handleResendInvitation = async (member: Member) => {
    setIsProcessing(true);
    try {
      const res = await dataService.resendInvitationAsync(member.id);
      const url = `${window.location.origin}?activate=true&email=${encodeURIComponent(
        member.email
      )}&code=${encodeURIComponent(res.invitationCode)}`;
      setResendInviteInfo({
        member: { ...member, invitationCode: res.invitationCode, accountStatus: 'PENDING' },
        code: res.invitationCode,
        url,
      });
      setStatusMessage(`New invitation code issued for ${member.fullName}: ${res.invitationCode}`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(`Error generating invitation: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add LG
  const handleAddLG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLgName.trim()) return;

    const newLG: LocalGovernment = {
      id: `lg-${Date.now()}`,
      name: newLgName.trim(),
      state: settings.state,
      meetingVenue: newLgVenue.trim() || 'Council Secretariat',
      meetingDay: newLgMeetingDay.trim(),
      activeMemberCount: 0,
    };

    await dataService.saveLG(newLG);
    setIsAddingLg(false);
    setNewLgName('');
    setNewLgVenue('');
  };

  const handleForceClearDemo = async () => {
    if (
      window.confirm(
        'FORCE CLEAR DEMO CONTENT: This will permanently remove all mock members, demo tasks, demo activities, and demo reports from the database, leaving only authentic Super Admins and the 18 official Ondo State Local Government chapters. Proceed?'
      )
    ) {
      setIsProcessing(true);
      try {
        await dataService.forceClearDemoContentAsync();
        setStatusMessage('Demo content successfully purged. Application is now production-ready.');
        setTimeout(() => setStatusMessage(null), 5000);
      } catch (err: any) {
        alert(`Error clearing demo content: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleClearData = async () => {
    if (
      window.confirm(
        'DANGER: Clear ALL operational data? This will delete all members, tasks, attendance, and settings. This action is irreversible.'
      )
    ) {
      await dataService.clearAllDataAsync();
      setStatusMessage('Operational data cleared. The system will re-initialize on the next load.');
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleSaveSettings = async () => {
    const newSettings = {
      ...settings,
      stateSecretariat: editSecretariat.trim(),
      operationalBatch: editBatch.trim(),
      operationalBatches: editBatches,
    };
    await dataService.saveSettings(newSettings);
    setIsEditingSettings(false);
  };

  const handleAddBatch = () => {
    if (newBatchToAdd.trim() && !editBatches.includes(newBatchToAdd.trim())) {
      setEditBatches([...editBatches, newBatchToAdd.trim()]);
      setNewBatchToAdd('');
    }
  };

  const handleRemoveBatch = (batch: string) => {
    setEditBatches(editBatches.filter((b) => b !== batch));
  };

  const handleExportBackup = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      members: dataService.getMembers(),
      tasks: dataService.getTasks(),
      activities: dataService.getActivities(),
      documents: dataService.getDocuments(),
      learning: dataService.getLearning(),
      reports: dataService.getReports(),
      lgs: dataService.getLGs(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dodeel_cds_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-700" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              CDS Administration Control
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full governance for CDS Coordinator • Controlled Invitations, Roles, Local Governments & System Settings
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleClearData}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Data</span>
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Backup</span>
          </button>

          <button
            type="button"
            onClick={handleForceClearDemo}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Clear Demo (Production)</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'USERS', label: 'Membership & Access Governance', icon: Users },
          { id: 'LGS', label: 'Local Governments', icon: Building2 },
          { id: 'SYSTEM', label: 'System & Storage', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-purple-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Admin Status Notification */}
      {statusMessage && (
        <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-purple-600 hover:text-purple-800 text-xs font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: USERS & MEMBERSHIP GOVERNANCE */}
      {activeAdminTab === 'USERS' && (
        <div className="space-y-4">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Registered
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">{totalCount}</p>
              <span className="text-[10px] text-slate-500">Controlled Member Profiles</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                Active Accounts
              </span>
              <p className="text-xl font-black text-emerald-700 mt-1">{activeCount}</p>
              <span className="text-[10px] text-emerald-600">Can Authenticate & Access</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                Pending Activation
              </span>
              <p className="text-xl font-black text-amber-700 mt-1">{pendingCount}</p>
              <span className="text-[10px] text-amber-600">Awaiting Member Password</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                Suspended Access
              </span>
              <p className="text-xl font-black text-rose-700 mt-1">{suspendedCount}</p>
              <span className="text-[10px] text-rose-600">Historical Data Preserved</span>
            </div>
          </div>

          {/* Main User Registry Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">DO-DEEL Member Account Governance</h2>
                <p className="text-xs text-slate-500">
                  Search, register, invite, suspend, and reassign roles under the controlled membership model
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddMemberOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <UserCheck className="w-4 h-4" />
                <span>Register & Invite Member</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, phone, state code, or invite code..."
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterLg}
                  onChange={(e) => setFilterLg(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium"
                >
                  <option value="ALL">All LG Chapters</option>
                  {lgs.map((lg) => (
                    <option key={lg.id} value={lg.id}>
                      {lg.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterAccountStatus}
                  onChange={(e) => setFilterAccountStatus(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-bold"
                >
                  <option value="ALL">All Account Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending Activation</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium"
                >
                  <option value="ALL">All Roles</option>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                    <th className="py-2.5 px-3">Member & Identity</th>
                    <th className="py-2.5 px-3">Chapter (LG)</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Account Access</th>
                    <th className="py-2.5 px-3">Membership</th>
                    <th className="py-2.5 px-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No members matching the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((m) => {
                      const isSelf = currentUser?.id === m.id;
                      const isSuper = m.role === 'CDS_COORDINATOR';

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900">{m.fullName}</p>
                            <p className="text-[11px] text-slate-500">{m.email}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                              <span>{m.phone}</span>
                              {m.stateCode && <span>• {m.stateCode}</span>}
                              {m.accountStatus === 'PENDING' && (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-black font-mono mt-1 ring-1 ring-amber-500/20">
                                  <KeyRound className="w-2.5 h-2.5" />
                                  {m.invitationCode || 'MISSING'}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {m.lgName}
                          </td>

                          <td className="py-3 px-3">
                            <RoleBadge role={m.role} size="sm" />
                          </td>

                          <td className="py-3 px-3">
                            <AccountStatusBadge status={m.accountStatus || 'ACTIVE'} size="sm" />
                          </td>

                          <td className="py-3 px-3">
                            <StatusBadge status={m.membershipStatus} size="sm" />
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Change Role Button */}
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => setChangeRoleTarget({ member: m, newRole: m.role })}
                                className="px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors disabled:opacity-40"
                                title="Change Operational Role"
                              >
                                Role
                              </button>

                              {/* Reassign LG Button */}
                              <button
                                type="button"
                                disabled={isSelf || lgs.length === 0}
                                onClick={() => setChangeLgTarget({ member: m, newLgId: m.lgId })}
                                className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-40"
                                title="Reassign Local Government Chapter"
                              >
                                Chapter
                              </button>

                              {/* Resend Invitation for PENDING */}
                              {m.accountStatus === 'PENDING' && (
                                <button
                                  type="button"
                                  onClick={() => handleResendInvitation(m)}
                                  className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                                  title="Regenerate & Resend Invitation Code"
                                >
                                  Resend
                                </button>
                              )}

                              {/* Suspend / Reactivate Controls */}
                              {!isSelf && !isSuper && (
                                <>
                                  {m.accountStatus === 'SUSPENDED' ? (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmReactivateMember(m)}
                                      className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                                    >
                                      Reactivate
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmSuspendMember(m)}
                                      className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                                    >
                                      Suspend
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOCAL GOVERNMENTS */}
      {activeAdminTab === 'LGS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Local Government Chapters</h2>
              <p className="text-xs text-slate-500">
                Meeting venues, scheduled meeting days, and leadership coverage
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingLg(!isAddingLg)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Chapter</span>
            </button>
          </div>

          {/* Add LG Form */}
          {isAddingLg && (
            <form onSubmit={handleAddLG} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Create New Local Government</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="LG Name (e.g. Badagry LG)"
                  value={newLgName}
                  onChange={(e) => setNewLgName(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg p-2"
                />
                <input
                  type="text"
                  required
                  placeholder="Meeting Venue"
                  value={newLgVenue}
                  onChange={(e) => setNewLgVenue(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg p-2"
                />
                <input
                  type="text"
                  required
                  placeholder="Meeting Schedule"
                  value={newLgMeetingDay}
                  onChange={(e) => setNewLgMeetingDay(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingLg(false)}
                  className="text-xs text-slate-500 px-3 py-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold text-white bg-purple-600 px-3 py-1 rounded-lg"
                >
                  Save LG
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {lgs.map((lg) => (
              <div
                key={lg.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{lg.name}</h3>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {lg.activeMemberCount} Active Members
                  </span>
                </div>
                <p className="text-slate-600">
                  President: <strong>{lg.presidentName || 'To be appointed'}</strong>
                </p>
                <p className="text-slate-500">Venue: {lg.meetingVenue}</p>
                <p className="text-slate-500">Day: {lg.meetingDay}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM SETTINGS & AUDIT */}
      {activeAdminTab === 'SYSTEM' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">DO-DEEL Deployment Specifications</h2>
              {!isEditingSettings ? (
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(true)}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                >
                  Edit Specifications
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(false)}
                    className="text-xs font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="text-xs font-bold text-white bg-emerald-600 px-2.5 py-1 rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">State Secretariat</span>
                {isEditingSettings ? (
                  <input
                    type="text"
                    value={editSecretariat}
                    onChange={(e) => setEditSecretariat(e.target.value)}
                    className="w-full mt-1 bg-white border border-slate-300 rounded p-1 font-bold"
                  />
                ) : (
                  <span className="font-bold text-slate-900 mt-0.5 block">{settings.stateSecretariat}</span>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">Operational Batch</span>
                {isEditingSettings ? (
                  <div className="mt-1 space-y-2">
                    <select
                      value={editBatch}
                      onChange={(e) => setEditBatch(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold text-xs"
                    >
                      {editBatches.map((batch) => (
                        <option key={batch} value={batch}>
                          {batch}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">Current active batch for new registrations</p>
                  </div>
                ) : (
                  <span className="font-bold text-slate-900 mt-0.5 block">{settings.operationalBatch}</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider mb-2">Configure All Batches</span>
                {isEditingSettings ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {editBatches.map((batch) => (
                        <div key={batch} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                          <span className="font-bold text-slate-700">{batch}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBatch(batch)}
                            className="text-rose-500 hover:text-rose-700 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="New Batch Name (e.g. 2026 Batch B)"
                        value={newBatchToAdd}
                        onChange={(e) => setNewBatchToAdd(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded p-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddBatch}
                        className="bg-slate-900 text-white p-1.5 rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {settings.operationalBatches?.map((batch) => (
                      <span key={batch} className="bg-white border border-slate-200 px-2 py-1 rounded-lg font-semibold text-slate-600">
                        {batch}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Access Architecture</span>
                <span className="font-bold text-emerald-700 mt-0.5 block">
                  Controlled Invitation Model (No Open Signup)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Super Admin Authority</span>
                <span className="font-mono text-purple-700 font-bold mt-0.5 block truncate">
                  kolawoles445@gmail.com
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">System Maintenance & Sample Data</p>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                You can reset all data back to the clean, realistic DO-DEEL sample records at any time using the Reset button at top right, or export your operational data as a verified JSON backup.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SENSITIVE ACTION MODAL 1: SUSPEND ACCOUNT */}
      {confirmSuspendMember && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-rose-700 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Confirm Account Suspension</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to suspend portal access for <strong>{confirmSuspendMember.fullName}</strong>?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
              <p className="font-bold">Data Integrity Notice:</p>
              <p>
                The member's login access will be blocked immediately. However, all historical records (past tasks, attendance records, submitted monthly reports, and evidence) will remain permanently intact.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmSuspendMember(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSuspend}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                {isProcessing ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SENSITIVE ACTION MODAL 2: REACTIVATE ACCOUNT */}
      {confirmReactivateMember && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>Confirm Account Reactivation</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Reactivate DO-DEEL portal access for <strong>{confirmReactivateMember.fullName}</strong>?
            </p>
            <p className="text-[11px] text-slate-500">
              The member will be able to log in with their email and password immediately, continuing duties in <strong>{confirmReactivateMember.lgName}</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmReactivateMember(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReactivate}
                disabled={isProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                {isProcessing ? 'Reactivating...' : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SENSITIVE ACTION MODAL 3: CHANGE ROLE */}
      {changeRoleTarget && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-purple-800 font-bold text-sm">
              <Shield className="w-5 h-5 shrink-0" />
              <span>Confirm Operational Role Change</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Modifying authority level for <strong>{changeRoleTarget.member.fullName}</strong> ({changeRoleTarget.member.email}):
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Select New Role:</label>
              <select
                value={changeRoleTarget.newRole}
                onChange={(e) =>
                  setChangeRoleTarget({
                    ...changeRoleTarget,
                    newRole: e.target.value as UserRole,
                  })
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-600"
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-slate-500">
              Role permissions and menu items will immediately adjust upon confirmation.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setChangeRoleTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteChangeRole}
                disabled={isProcessing}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold"
              >
                {isProcessing ? 'Updating Role...' : 'Confirm Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SENSITIVE ACTION MODAL 4: CHANGE LG CHAPTER */}
      {changeLgTarget && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-blue-800 font-bold text-sm">
              <MapPin className="w-5 h-5 shrink-0" />
              <span>Confirm Chapter Reassignment</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transfer <strong>{changeLgTarget.member.fullName}</strong> to another Local Government chapter:
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Select Destination Chapter:</label>
              <select
                value={changeLgTarget.newLgId}
                onChange={(e) =>
                  setChangeLgTarget({
                    ...changeLgTarget,
                    newLgId: e.target.value,
                  })
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
              >
                {lgs.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    {lg.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-slate-500">
              Active member counts for both source and destination chapters will automatically update.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setChangeLgTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteChangeLg}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold"
              >
                {isProcessing ? 'Transferring...' : 'Confirm Chapter Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SENSITIVE ACTION MODAL 5: RESEND INVITATION INFO */}
      {resendInviteInfo && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-amber-800 font-bold text-sm">
              <KeyRound className="w-5 h-5 shrink-0" />
              <span>Invitation Token Generated</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              A fresh activation code has been created for <strong>{resendInviteInfo.member.fullName}</strong> ({resendInviteInfo.member.email}):
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Activation Code</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 font-mono font-black text-sm bg-white border border-slate-200 rounded-lg p-2 text-slate-900">
                    {resendInviteInfo.code}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resendInviteInfo.code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2500);
                    }}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1 shrink-0"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Direct Activation Link</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="text"
                    readOnly
                    value={resendInviteInfo.url}
                    className="flex-1 text-[11px] font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-600 truncate outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resendInviteInfo.url);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResendInviteInfo(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER REGISTRATION & INVITATION MODAL */}
      <MemberFormModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        lgs={lgs}
      />
    </div>
  );
};
