import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { EvidenceType, Member, Task, TaskManualProgress } from '../../types';
import { formatDate, formatDateTime, getDaysRemaining } from '../../utils/formatters';
import { canAssignTask, canReopenTask, ROLE_LABELS } from '../../utils/permissions';
import { Modal } from '../common/Modal';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Link,
  MapPin,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  Tag,
  User,
  UserCheck,
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  members,
}) => {
  const { currentUser, currentRole } = useAuth();

  if (!currentUser) return null;

  const [commentText, setCommentText] = useState('');
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('URL');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [taskResult, setTaskResult] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');

  // Reopen state
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenDeadline, setReopenDeadline] = useState('');

  if (!task) return null;

  const isAssignee = task.assignedUserId === currentUser.id;
  const canManage = canAssignTask(currentRole);
  const canReopen = canReopenTask(currentRole);
  const daysInfo = getDaysRemaining(task.deadline);

  // Status calculation
  const status = task.calculatedStatus || 'NOT_STARTED';

  const handleUpdateProgress = async (progress: TaskManualProgress) => {
    await dataService.updateTaskProgress(task.id, progress);
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;

    await dataService.reopenTask(
      task.id,
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      reopenReason.trim(),
      reopenDeadline || undefined
    );

    setShowReopenForm(false);
    setReopenReason('');
    setReopenDeadline('');
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceDesc && !evidenceUrl) return;

    await dataService.updateTaskProgress(
      task.id,
      'COMPLETED',
      {
        type: evidenceType,
        url: evidenceUrl,
        description: evidenceDesc,
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser.id,
        submittedByName: currentUser.fullName,
      },
      taskResult || task.result || 'Task deliverables successfully executed.'
    );

    setShowEvidenceForm(false);
    setEvidenceUrl('');
    setEvidenceDesc('');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await dataService.addTaskComment(
      task.id,
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      commentText.trim()
    );
    setCommentText('');
  };

  const handleReassign = () => {
    if (!selectedAssigneeId) return;
    const target = members.find((m) => m.id === selectedAssigneeId);
    if (!target) return;

    const updatedTask: Task = {
      ...task,
      assignedTo: target.id,
      assignedToName: target.fullName,
      assignedToRole: target.role,
      assignedUserId: target.id,
      assignedUserName: target.fullName,
      assignedUserRole: target.role,
      assignedLG: target.lgId,
      assignedLGName: target.lgName,
      lgId: target.lgId,
      lgName: target.lgName,
    };
    dataService.saveTask(updatedTask);
    setIsReassigning(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      subtitle={`Task ID: ${task.id} • Assigned in ${task.lgName}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Reopened Banner */}
        {task.reopenedAt && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5">
            <RotateCcw className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900">Responsibility Reopened by Leadership</span>
                <span className="text-[10px] text-amber-700 font-medium">
                  {formatDateTime(task.reopenedAt)}
                </span>
              </div>
              <p className="text-amber-800 mt-0.5">
                Reopened by <strong>{task.reopenedByName || 'Leadership'}</strong>
              </p>
              {task.reopenReason && (
                <p className="text-amber-950 mt-1.5 italic bg-amber-100/70 p-2 rounded-lg border border-amber-200 text-xs">
                  "{task.reopenReason}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Core Product Lifecycle Progress Tracker: ASSIGN → EXECUTE → EVIDENCE → REPORT → REVIEW */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            DO-DEEL Responsibility Lifecycle
          </p>
          <div className="grid grid-cols-5 gap-1 text-center">
            {[
              { id: 'ASSIGN', label: '1. Assign', done: true },
              {
                id: 'EXECUTE',
                label: '2. Execute',
                done: status === 'IN_PROGRESS' || status === 'COMPLETED',
              },
              {
                id: 'EVIDENCE',
                label: '3. Evidence',
                done: Boolean(task.evidence),
              },
              {
                id: 'REPORT',
                label: '4. Report',
                done: status === 'COMPLETED',
              },
              {
                id: 'REVIEW',
                label: '5. Review',
                done: status === 'COMPLETED' && task.comments.length > 0,
              },
            ].map((step, idx) => (
              <div
                key={step.id}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  step.done
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {step.label}
              </div>
            ))}
          </div>
        </div>

        {/* Task Metadata & Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">Status (Calculated)</span>
            <div className="mt-1">
              <StatusBadge status={status} size="sm" />
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">Priority</span>
            <div className="mt-1">
              <PriorityBadge priority={task.priority} />
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">Deadline</span>
            <span
              className={`font-bold block mt-1 ${
                daysInfo.isPast ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {formatDate(task.deadline)}
              <span className="text-[10px] block font-normal text-slate-500">
                ({daysInfo.label})
              </span>
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">Assigned Team</span>
            <span className="font-semibold text-slate-900 block mt-1 truncate">
              {task.team || 'Operations'}
            </span>
          </div>
        </div>

        {/* Task Description & KPI */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Description
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
              {task.description}
            </p>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold mb-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Target KPI / Expected Result</span>
            </div>
            <p className="text-xs text-emerald-950 font-medium">{task.kpi}</p>
          </div>
        </div>

        {/* Responsible Person / Reassign */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {task.assignedUserName.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{task.assignedUserName}</p>
              <p className="text-[11px] text-slate-500">
                {ROLE_LABELS[task.assignedUserRole]} • {task.lgName}
              </p>
            </div>
          </div>

          {canManage && (
            <div>
              {!isReassigning ? (
                <button
                  type="button"
                  onClick={() => setIsReassigning(true)}
                  className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  Reassign Task
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select Member</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.lgName})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleReassign}
                    disabled={!selectedAssigneeId}
                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReassigning(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evidence & Result Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Execution Evidence & Results</span>
            </h4>

            <div className="flex items-center gap-2">
              {canReopen && status === 'COMPLETED' && !showReopenForm && (
                <button
                  type="button"
                  onClick={() => setShowReopenForm(true)}
                  className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen Task</span>
                </button>
              )}

              {(isAssignee || canManage) && !showEvidenceForm && (
                <button
                  type="button"
                  onClick={() => setShowEvidenceForm(true)}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                >
                  {task.evidence ? 'Update Evidence' : 'Submit Evidence & Complete'}
                </button>
              )}
            </div>
          </div>

          {/* Reopen Form for Authorized Leadership */}
          {showReopenForm && (
            <form
              onSubmit={handleReopenSubmit}
              className="bg-amber-50/70 p-4 rounded-xl border border-amber-300 space-y-3"
            >
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>Leadership Operational Reopen</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Reopen this completed responsibility to require revised evidence, updated KPI results, or deliverable corrections.
              </p>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Reason for Reopening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Evidence incomplete; need verified student attendance list."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Revise / Extend Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={reopenDeadline}
                  onChange={(e) => setReopenDeadline(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Current deadline: {formatDate(task.deadline)}. If deadline remains in the past, task status will calculate as Overdue.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReopenForm(false)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-800 px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reopenReason.trim()}
                  className="text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 px-3.5 py-1.5 rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirm & Reopen Responsibility</span>
                </button>
              </div>
            </form>
          )}

          {/* Existing Evidence Display */}
          {task.evidence ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {task.evidence.type} EVIDENCE
                </span>
                <span className="text-[10px] text-slate-400">
                  Submitted {formatDateTime(task.evidence.submittedAt)}
                </span>
              </div>

              {task.evidence.url && (
                <div className="text-xs font-medium text-emerald-700 flex items-center gap-1 break-all">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <a
                    href={task.evidence.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-emerald-800"
                  >
                    {task.evidence.url}
                  </a>
                </div>
              )}

              <p className="text-xs text-slate-700">{task.evidence.description}</p>

              {task.result && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-800">Final Outcome:</span>
                  <p className="text-xs text-slate-600 mt-0.5">{task.result}</p>
                </div>
              )}
            </div>
          ) : (
            !showEvidenceForm && (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-500">No evidence submitted yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  To complete the task, attach evidence (link, photo, doc, or report notes).
                </p>
              </div>
            )
          )}

          {/* Evidence Submission Form */}
          {showEvidenceForm && (
            <form
              onSubmit={handleSubmitEvidence}
              className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3"
            >
              <h5 className="text-xs font-bold text-emerald-950">
                Submit Task Evidence & Outcome
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Evidence Type
                  </label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="URL">Google Drive / Cloud Link</option>
                    <option value="SOCIAL_URL">Social Media Post URL</option>
                    <option value="IMAGE">Photo / Screenshot URL</option>
                    <option value="DOCUMENT">Document / PDF Link</option>
                    <option value="DESCRIPTION">Written Execution Summary</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Evidence Link / URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Evidence Details & Activities Carried Out
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detail the session, number of attendees, feedback, or link contents..."
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Final KPI Outcome / Result
                </label>
                <input
                  type="text"
                  placeholder="e.g. 64 students trained with 94% pass rate on digital quiz"
                  value={taskResult}
                  onChange={(e) => setTaskResult(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEvidenceForm(false)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-800 px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg shadow-xs"
                >
                  Confirm & Mark Completed
                </button>
              </div>
            </form>
          )}

          {/* Manual Progress Selector for Assignee (Not Started / In Progress) */}
          {(isAssignee || canManage) && status !== 'COMPLETED' && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">Quick State Transition:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateProgress('NOT_STARTED')}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${
                    task.manualProgress === 'NOT_STARTED'
                      ? 'bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Not Started
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateProgress('IN_PROGRESS')}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${
                    task.manualProgress === 'IN_PROGRESS'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-blue-700 hover:bg-blue-50 border-blue-200'
                  }`}
                >
                  Start Task (In Progress)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Comments & Review Thread */}
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Executive Review & Comments ({task.comments.length})</span>
          </h4>

          {task.comments.length > 0 ? (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {task.comments.map((comm) => (
                <div
                  key={comm.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{comm.authorName}</span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(comm.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{comm.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No comments yet.</p>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Add feedback, update or review note..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
