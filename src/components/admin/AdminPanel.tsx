import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LocalGovernment, Member, SystemSettings, UserRole } from '../../types';
import { ROLE_LABELS } from '../../utils/permissions';
import { RoleBadge } from '../common/RoleBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  AlertTriangle,
  Building2,
  Database,
  Download,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  Trash2,
  Users,
} from 'lucide-react';

interface AdminPanelProps {
  members: Member[];
  lgs: LocalGovernment[];
  settings: SystemSettings;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ members, lgs, settings }) => {
  const { currentUser, currentRole, switchRole } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<'USERS' | 'LGS' | 'SYSTEM'>('USERS');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState<UserRole>('MEMBER');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  // Handle Role Change for any user
  const handleSaveUserRole = async (userId: string) => {
    const target = members.find((m) => m.id === userId);
    if (!target) return;

    const updated = { ...target, role: selectedRoleToAssign };
    await dataService.saveMemberAsync(updated);
    setEditingUserId(null);
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

  const handleResetData = async () => {
    if (
      window.confirm(
        'Reset DO-DEEL CDS Manager to the initial realistic sample data? All local tasks, attendance, and member changes will be reseeded.'
      )
    ) {
      await dataService.seedInitialData(true);
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
            Full system oversight for CDS Coordinator • Users, Roles, Local Governments & Configuration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearData}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Data</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'USERS', label: 'User Roles & Access', icon: Users },
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
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-purple-600 hover:text-purple-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: USERS & ROLE PERMISSIONS */}
      {activeAdminTab === 'USERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Manage Operational Roles</h2>
              <p className="text-xs text-slate-500">
                Grant executive responsibilities or elevate members across chapters
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              {members.length} Total Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Name & Email</th>
                  <th className="py-2.5 px-3">Chapter (LG)</th>
                  <th className="py-2.5 px-3">Current Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const isEditing = editingUserId === m.id;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{m.fullName}</p>
                        <p className="text-[11px] text-slate-400">{m.email}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{m.lgName}</td>
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <select
                            value={selectedRoleToAssign}
                            onChange={(e) => setSelectedRoleToAssign(e.target.value as UserRole)}
                            className="text-xs bg-white border border-slate-300 rounded-lg p-1 font-semibold"
                          >
                            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <RoleBadge role={m.role} size="sm" />
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={m.membershipStatus} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveUserRole(m.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="px-2 py-1 text-slate-400 hover:text-slate-700 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(m.id);
                              setSelectedRoleToAssign(m.role);
                            }}
                            className="text-xs font-semibold text-purple-700 hover:underline"
                          >
                            Change Role
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                <span className="text-[11px] text-slate-400 block font-medium">Data Storage Engine</span>
                <span className="font-bold text-emerald-700 mt-0.5 block">
                  Persistent Local DB (Active & Offline Capable)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Status Calculation</span>
                <span className="font-bold text-blue-700 mt-0.5 block">
                  Automatic Dynamic Deadline Engine (Anti-Manual Overdue)
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
    </div>
  );
};
