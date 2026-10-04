import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Activity, ActivityLocationType, LocalGovernment } from '../../types';
import { Modal } from '../common/Modal';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lgs: LocalGovernment[];
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  lgs,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [time, setTime] = useState('10:00');
  const [locationType, setLocationType] = useState<ActivityLocationType>('IN_PERSON');
  const [location, setLocation] = useState('');
  const [lgId, setLgId] = useState(currentUser.lgId || 'lg-ikeja');
  const [expectedAttendance, setExpectedAttendance] = useState(40);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;

    const selectedLG =
      lgId === 'ALL'
        ? { id: 'ALL', name: 'State-wide (All LGs)' }
        : lgs.find((l) => l.id === lgId) || { id: lgId, name: 'Local Government' };

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      locationType,
      location: location.trim(),
      lgId: selectedLG.id,
      lgName: selectedLG.name,
      organizerId: currentUser.id,
      organizerName: currentUser.fullName,
      organizerRole: currentUser.role,
      status: 'UPCOMING',
      expectedAttendance: Number(expectedAttendance) || 30,
      attendanceRecords: [],
      createdAt: new Date().toISOString(),
    };

    dataService.saveActivity(newActivity);
    onClose();
    // Reset
    setTitle('');
    setDescription('');
    setLocation('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New CDS Activity"
      subtitle="Schedule training, meeting, or community outreach"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Activity Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Weekly CDS Digital Skills Workshop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            placeholder="Objectives, agenda, target attendees, materials needed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Time</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Format</label>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value as ActivityLocationType)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="IN_PERSON">In-Person (Physical)</option>
              <option value="ONLINE">Virtual / Online (Google Meet/Zoom)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Target LG</label>
            <select
              value={lgId}
              onChange={(e) => setLgId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">State-wide (All LGs)</option>
              {lgs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            {locationType === 'ONLINE' ? 'Virtual Meeting Link' : 'Physical Venue Address'}{' '}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder={
              locationType === 'ONLINE'
                ? 'https://meet.google.com/...'
                : 'e.g. Ikeja Local Government Secretariat Hall'
            }
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Expected Participants
          </label>
          <input
            type="number"
            min={1}
            value={expectedAttendance}
            onChange={(e) => setExpectedAttendance(Number(e.target.value))}
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
            Create Activity
          </button>
        </div>
      </form>
    </Modal>
  );
};
