import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Announcement, LocalGovernment } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  canCreateAnnouncement,
  canPostGeneralAnnouncement,
  canViewAnnouncement,
  isScopedToLG,
  isStateWideLeader,
  isSuperAdminEmail,
  ROLE_LABELS,
} from '../../utils/permissions';
import { Modal } from './Modal';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Filter,
  Globe,
  MapPin,
  Megaphone,
  Plus,
  Send,
  Shield,
  Trash2,
} from 'lucide-react';

interface AnnouncementFeedProps {
  announcements: Announcement[];
  lgs: LocalGovernment[];
  maxDisplay?: number;
  compact?: boolean;
}

export const AnnouncementFeed: React.FC<AnnouncementFeedProps> = ({
  announcements,
  lgs,
  maxDisplay,
  compact = false,
}) => {
  const { currentUser, currentRole } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STATE_GENERAL' | 'LOCAL_LG'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New post form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetLG, setTargetLG] = useState<string>('ALL');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  if (!currentUser) return null;

  const canPost = canCreateAnnouncement(currentRole);
  const canPostGeneral = canPostGeneralAnnouncement(currentRole, currentUser.email);
  const isUserScoped = isScopedToLG(currentRole, currentUser.email);

  // Filter announcements strictly according to permission rules:
  // Local users strictly see posts for their LG, except general posts from State Presidents, Executives, and Super Admin.
  const visibleAnnouncements = useMemo(() => {
    return announcements
      .filter((a) => canViewAnnouncement(a, currentRole, currentUser.lgId, currentUser.email))
      .filter((a) => {
        if (activeFilter === 'STATE_GENERAL') return a.targetLG === 'ALL';
        if (activeFilter === 'LOCAL_LG') return a.targetLG !== 'ALL';
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [announcements, currentRole, currentUser.lgId, currentUser.email, activeFilter]);

  const displayedList = maxDisplay ? visibleAnnouncements.slice(0, maxDisplay) : visibleAnnouncements;

  const handleOpenCreate = () => {
    // If user cannot post general, default targetLG to their own LG
    if (!canPostGeneral && currentUser.lgId) {
      setTargetLG(currentUser.lgId);
    } else {
      setTargetLG('ALL');
    }
    setTitle('');
    setContent('');
    setPriority('NORMAL');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    // Enforce that local users can never post to 'ALL'
    const finalTargetLG = !canPostGeneral ? currentUser.lgId || 'ALL' : targetLG;

    setIsSubmitting(true);
    try {
      const newAnnouncement: Announcement = {
        id: `ann-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        targetLG: finalTargetLG,
        priority,
        authorId: currentUser.id,
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.email || currentUser.id,
      };

      await dataService.saveAnnouncement(newAnnouncement);
      setIsCreateOpen(false);
    } catch (err) {
      console.error('Error creating announcement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this announcement?')) {
      try {
        await dataService.deleteAnnouncement(id);
      } catch (err) {
        console.error('Error deleting announcement:', err);
      }
    }
  };

  const getLGName = (id: string) => {
    if (id === 'ALL') return 'State-wide (All LGs)';
    const found = lgs.find((l) => l.id === id);
    return found ? found.name : id;
  };

  return (
    <div className="space-y-3.5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Official Bulletins & Announcements</span>
              {visibleAnnouncements.length > 0 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full">
                  {visibleAnnouncements.length}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500">
              {isUserScoped
                ? `Directives for ${currentUser.lgName} & General State Executive Notices`
                : 'State-wide Leadership & Chapter Broadcast Center'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Notices
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('STATE_GENERAL')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                activeFilter === 'STATE_GENERAL'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              State General
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('LOCAL_LG')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                activeFilter === 'LOCAL_LG'
                  ? 'bg-white text-purple-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isUserScoped ? 'My Chapter' : 'Chapter Specific'}
            </button>
          </div>

          {canPost && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Bulletin</span>
            </button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      {displayedList.length === 0 ? (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-1.5 shadow-2xs">
          <Bell className="w-7 h-7 mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-700">No active bulletins right now</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            {isUserScoped
              ? 'New notices from the State President, State Executives, or your LG President will be posted here.'
              : 'Post a state-wide general announcement or chapter directive using the button above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedList.map((item) => {
            const isGeneral = item.targetLG === 'ALL';
            const isUrgent = item.priority === 'URGENT';
            const canDelete =
              currentUser.id === item.authorId ||
              isSuperAdminEmail(currentUser.email) ||
              currentRole === 'STATE_PRESIDENT';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUrgent
                    ? 'bg-rose-50/60 border-rose-200/90 shadow-2xs'
                    : isGeneral
                    ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    {/* Header Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isGeneral ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/80">
                          <Globe className="w-2.5 h-2.5" />
                          <span>General Notice • State Directorate</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-200/80">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>Chapter Notice • {getLGName(item.targetLG)}</span>
                        </span>
                      )}

                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>Urgent Directive</span>
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-sm text-slate-900 tracking-tight pt-0.5">
                      {item.title}
                    </h3>

                    {/* Content */}
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pt-1">
                      {item.content}
                    </p>

                    {/* Author Attribution */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <Shield className="w-3 h-3 text-emerald-600" />
                        <span>{item.authorName}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                        {ROLE_LABELS[item.authorRole] || item.authorRole}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Delete notice"
                      aria-label="Delete notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Publish Official Announcement"
          subtitle={
            canPostGeneral
              ? 'Broadcast general announcements statewide or address a specific Local Government chapter'
              : `Publish an official bulletin directly to ${currentUser.lgName}`
          }
          maxWidth="lg"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Announcement Headline <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Schedule for Monthly General Clearance & Meeting"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Audience Scope <span className="text-rose-500">*</span>
                </label>
                {canPostGeneral ? (
                  <select
                    value={targetLG}
                    onChange={(e) => setTargetLG(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="ALL">🌐 General Post (All 18 Local Governments)</option>
                    <optgroup label="Specific Local Government Chapter">
                      {lgs.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <span>{currentUser.lgName} Chapter (Strictly Locked)</span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {canPostGeneral
                    ? 'General posts will be visible to all corps members across all local governments.'
                    : 'Your post is strictly confined to members of your local government chapter.'}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'NORMAL' | 'URGENT')}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="NORMAL">Standard Notice</option>
                  <option value="URGENT">⚠️ Urgent Directive / Alert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Announcement Body / Directive <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Detail meeting venue, agenda, required documents, call-up requirements, or important instructions..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Announcement'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
