import React, { useState, useEffect } from 'react';
import { Building2, Check, MapPin, Calendar, UserCheck, Shield, AlertCircle } from 'lucide-react';
import { LocalGovernment, Member } from '../../types';
import { dataService } from '../../services/dataService';
import { Modal } from '../common/Modal';

interface LocalGovernmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lgToEdit?: LocalGovernment | null;
  members: Member[];
  defaultState?: string;
  onSaved?: (message: string) => void;
}

const MEETING_SCHEDULE_PRESETS = [
  'Every Thursday, 10:00 AM',
  'Every Thursday, 9:00 AM',
  'Every Thursday, 11:00 AM',
  'Every Friday, 10:00 AM',
  'Every Wednesday, 10:00 AM',
  'Bi-weekly Thursday, 10:00 AM',
];

export const LocalGovernmentModal: React.FC<LocalGovernmentModalProps> = ({
  isOpen,
  onClose,
  lgToEdit,
  members,
  defaultState = 'Ondo State',
  onSaved,
}) => {
  const isEditing = Boolean(lgToEdit);

  const [name, setName] = useState('');
  const [state, setState] = useState(defaultState);
  const [meetingVenue, setMeetingVenue] = useState('');
  const [meetingDay, setMeetingDay] = useState('Every Thursday, 10:00 AM');
  const [presidentId, setPresidentId] = useState<string>('');
  const [autoUpdateRole, setAutoUpdateRole] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lgToEdit) {
      setName(lgToEdit.name || '');
      setState(lgToEdit.state || defaultState);
      setMeetingVenue(lgToEdit.meetingVenue || '');
      setMeetingDay(lgToEdit.meetingDay || 'Every Thursday, 10:00 AM');
      setPresidentId(lgToEdit.presidentId || '');
    } else {
      setName('');
      setState(defaultState);
      setMeetingVenue('Local Government Secretariat Hall');
      setMeetingDay('Every Thursday, 10:00 AM');
      setPresidentId('');
    }
    setErrorMessage(null);
  }, [lgToEdit, defaultState, isOpen]);

  // Candidates for LG President (prefer active members)
  const candidateMembers = members.filter(
    (m) => m.accountStatus !== 'SUSPENDED'
  );

  // Group candidates into chapter members first, then other chapters
  const localMembers = candidateMembers.filter(
    (m) => lgToEdit && m.lgId === lgToEdit.id
  );
  const otherMembers = candidateMembers.filter(
    (m) => !lgToEdit || m.lgId !== lgToEdit.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Local Government name is required.');
      return;
    }
    if (!meetingVenue.trim()) {
      setErrorMessage('Meeting venue is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedPresident = members.find((m) => m.id === presidentId);

      const targetLG: LocalGovernment = {
        id: lgToEdit?.id || `lg-${Date.now()}`,
        name: name.trim(),
        state: state.trim() || defaultState,
        meetingVenue: meetingVenue.trim(),
        meetingDay: meetingDay.trim() || 'Every Thursday, 10:00 AM',
        presidentId: selectedPresident ? selectedPresident.id : '',
        presidentName: selectedPresident ? selectedPresident.fullName : '',
        activeMemberCount: lgToEdit?.activeMemberCount ?? 0,
        createdAt: lgToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dataService.saveLG(targetLG);

      // If a president was assigned and autoUpdateRole is true, sync role
      if (selectedPresident) {
        if (
          autoUpdateRole &&
          selectedPresident.role !== 'LG_PRESIDENT' &&
          selectedPresident.role !== 'CDS_COORDINATOR' &&
          selectedPresident.role !== 'STATE_PRESIDENT'
        ) {
          await dataService.updateMemberRoleAsync(selectedPresident.id, 'LG_PRESIDENT');
        }
      }

      onSaved?.(
        isEditing
          ? `Chapter "${targetLG.name}" updated successfully.`
          : `New Chapter "${targetLG.name}" created successfully.`
      );
      onClose();
    } catch (err: any) {
      console.error('Error saving Local Government:', err);
      setErrorMessage(err.message || 'Failed to save chapter changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Chapter: ${lgToEdit?.name}` : 'Create Local Government Chapter'}
      subtitle="Configure meeting venues, regular CDS schedules, and appointed chapter leadership"
      maxWidth="lg"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Chapter Name & State */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-700" />
              <span>Chapter / LG Name *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Akure South LG"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Ondo State"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none"
            />
          </div>
        </div>

        {/* Meeting Venue */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Meeting Venue *</span>
          </label>
          <input
            type="text"
            required
            value={meetingVenue}
            onChange={(e) => setMeetingVenue(e.target.value)}
            placeholder="e.g. Akure South Local Government Secretariat, Hall A"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none transition-all"
          />
          <p className="text-[10px] text-slate-400">
            Physical address or official gathering hall where CDS members assemble.
          </p>
        </div>

        {/* Meeting Day & Schedule */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-700" />
            <span>Scheduled Meeting Day & Time *</span>
          </label>
          <input
            type="text"
            required
            value={meetingDay}
            onChange={(e) => setMeetingDay(e.target.value)}
            placeholder="e.g. Every Thursday, 10:00 AM"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none transition-all"
          />

          {/* Quick Schedule Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 font-medium mr-1">Presets:</span>
            {MEETING_SCHEDULE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMeetingDay(preset)}
                className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium transition-colors ${
                  meetingDay === preset
                    ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Appointed Chapter President */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-purple-700" />
            <span>Appointed LG President</span>
          </label>

          <select
            value={presidentId}
            onChange={(e) => setPresidentId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none transition-all"
          >
            <option value="">-- No President Appointed (Vacant) --</option>
            {localMembers.length > 0 && (
              <optgroup label={`Members currently in ${name || 'this chapter'}`}>
                {localMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.stateCode || m.email}) • {m.role}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Other Active Members">
              {otherMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.stateCode || m.email}) • {m.lgName}
                </option>
              ))}
            </optgroup>
          </select>

          {presidentId && (
            <label className="flex items-center gap-2 p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 cursor-pointer">
              <input
                type="checkbox"
                checked={autoUpdateRole}
                onChange={(e) => setAutoUpdateRole(e.target.checked)}
                className="rounded border-purple-300 text-purple-700 focus:ring-purple-500 w-4 h-4"
              />
              <span className="font-medium text-[11px]">
                Automatically promote this member to the <strong>LG President</strong> operational role.
              </span>
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Chapter'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
