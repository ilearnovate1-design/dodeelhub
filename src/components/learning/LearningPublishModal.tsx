import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LearningCategory, LearningResource, LearningType } from '../../types';
import { extractYouTubeId, getYouTubeThumbnail } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Play, Sparkles, Youtube } from 'lucide-react';

interface LearningPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LearningPublishModal: React.FC<LearningPublishModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const [type, setType] = useState<LearningType>('YOUTUBE');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LearningCategory>('Digital Literacy');
  const [durationOrPages, setDurationOrPages] = useState('25 mins');

  // Auto-extracted YouTube details
  const youtubeVideoId = type === 'YOUTUBE' ? extractYouTubeId(url) : null;
  const autoThumbnail = youtubeVideoId ? getYouTubeThumbnail(youtubeVideoId) : undefined;

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (type === 'YOUTUBE') {
      const id = extractYouTubeId(newUrl);
      if (id && !title) {
        setTitle('DO-DEEL Learning: Digital Skills Masterclass');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    if (type === 'YOUTUBE' && !youtubeVideoId) return;

    const newResource: LearningResource = {
      id: `learn-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      type,
      url: url.trim(),
      youtubeVideoId: youtubeVideoId || undefined,
      thumbnailUrl: autoThumbnail,
      category,
      durationOrPages: durationOrPages.trim(),
      publishedBy: currentUser.id,
      publisherName: currentUser.fullName,
      publisherRole: currentUser.role,
      createdAt: new Date().toISOString(),
    };

    dataService.saveLearning(newResource);
    onClose();
    // Reset
    setTitle('');
    setUrl('');
    setDescription('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Learning Resource"
      subtitle="Authorized: CDS Coordinator, State President, VP Growth"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resource Type */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'YOUTUBE', label: 'YouTube Video' },
            { id: 'PDF', label: 'PDF Guide' },
            { id: 'EXTERNAL_URL', label: 'Article / Link' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id as LearningType)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                type === t.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* URL Input */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            {type === 'YOUTUBE' ? 'YouTube Video URL' : 'Resource URL / PDF Link'}{' '}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="url"
            required
            placeholder={
              type === 'YOUTUBE'
                ? 'https://www.youtube.com/watch?v=... or https://youtu.be/...'
                : 'https://example.com/guide.pdf'
            }
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />

          {type === 'YOUTUBE' && url.trim().length > 5 && !youtubeVideoId && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              ⚠️ Invalid YouTube URL. Please paste a standard YouTube video link (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...).
            </p>
          )}
        </div>

        {/* YouTube Live Thumbnail Preview */}
        {type === 'YOUTUBE' && autoThumbnail && (
          <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl flex items-center gap-3">
            <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-slate-900 shrink-0">
              <img src={autoThumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-4 h-4 fill-white text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                ✓ Valid YouTube Video (ID: {youtubeVideoId})
              </span>
              <p className="text-xs text-slate-600 mt-1 truncate">
                Preview verified. Videos are embedded securely without downloading or hosting.
              </p>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Resource Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Masterclass: Essential Digital Literacy & Productivity"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Category & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as LearningCategory)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Digital Literacy">Digital Literacy</option>
              <option value="Employability">Employability</option>
              <option value="Entrepreneurship">Entrepreneurship</option>
              <option value="Leadership">Leadership</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Web Development">Web Development</option>
              <option value="Data Analysis">Data Analysis</option>
              <option value="Community Impact">Community Impact</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Duration or Pages
            </label>
            <input
              type="text"
              placeholder="e.g. 35 mins or 18 Pages"
              value={durationOrPages}
              onChange={(e) => setDurationOrPages(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="Summarize key takeaways, prerequisites, and learning objectives..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            Publish Learning Resource
          </button>
        </div>
      </form>
    </Modal>
  );
};
