import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LocalGovernment, Member, Task, TaskPriority } from '../../types';
import { Modal } from '../common/Modal';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  lgs: LocalGovernment[];
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  members,
  lgs,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [lgId, setLgId] = useState(currentUser.lgId || lgs[0]?.id || 'lg-akure');
  const [team, setTeam] = useState('Training & Mentorship');
  const [kpi, setKpi] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedUserId) return;

    const assignedUser = members.find((m) => m.id === assignedUserId);
    if (!assignedUser) return;

    const selectedLG = lgs.find((l) => l.id === lgId) || {
      id: lgId,
      name: assignedUser.lgName,
    };

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      responsibility: team,
      description: description.trim(),
      assignedTo: assignedUser.id,
      assignedToName: assignedUser.fullName,
      assignedToRole: assignedUser.role,
      assignedUserId: assignedUser.id,
      assignedUserName: assignedUser.fullName,
      assignedUserRole: assignedUser.role,
      assignedBy: currentUser.id,
      assignedByName: currentUser.fullName,
      assignedLG: selectedLG.id,
      assignedLGName: selectedLG.name,
      lgId: selectedLG.id,
      lgName: selectedLG.name,
      team,
      kpi: kpi.trim(),
      priority,
      startDate,
      deadline,
      manualProgress: 'NOT_STARTED',
      hasEvidence: false,
      comments: [],
      createdBy: currentUser.id,
      createdByName: currentUser.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dataService.saveTask(newTask);
    onClose();
    // Reset form
    setTitle('');
    setDescription('');
    setAssignedUserId('');
    setKpi('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Responsibility & KPI Task"
      subtitle="Follow DO-DEEL Lifecycle: ASSIGN → EXECUTE → EVIDENCE → REPORT → REVIEW"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Conduct Secondary School Digital Literacy Workshop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="Specify expectations, target location, audience, and instructions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Assignee & LG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Responsible Person <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={assignedUserId}
              onChange={(e) => {
                setAssignedUserId(e.target.value);
                const user = members.find((m) => m.id === e.target.value);
                if (user) setLgId(user.lgId);
              }}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Choose Member/Executive --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.lgName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Local Government (LG)
            </label>
            <select
              value={lgId}
              onChange={(e) => setLgId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              {lgs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assigned Team & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Team</label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Training & Mentorship">Training & Mentorship</option>
              <option value="Growth & Visibility">Growth & Visibility</option>
              <option value="Community Impact & Outreach">Community Impact & Outreach</option>
              <option value="Accountability & Monitoring">Accountability & Monitoring</option>
              <option value="Publicity & Social Media">Publicity & Social Media</option>
              <option value="Logistics & Events">Logistics & Events</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        {/* Target KPI / Expected Result */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Target KPI / Expected Result <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 50 students certified with verified attendance sheets"
            value={kpi}
            onChange={(e) => setKpi(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Deadline <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Task status will automatically switch to Overdue if deadline lapses without evidence.
            </p>
          </div>
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
            Assign Task
          </button>
        </div>
      </form>
    </Modal>
  );
};
