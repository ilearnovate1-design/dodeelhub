import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import {
  SocialActionType,
  SocialPlatform,
  WeeklySocialCampaign,
} from '../../types';
import { Modal } from '../common/Modal';
import {
  Check,
  Megaphone,
  Plus,
  Sparkles,
  Youtube,
  Linkedin,
  Twitter,
  Instagram,
} from 'lucide-react';

interface ManageSocialCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignToEdit?: WeeklySocialCampaign | null;
  onSaved?: () => void;
}

const CAMPAIGN_PRESETS = [
  {
    title: 'YouTube Masterclass Boost',
    platform: 'YOUTUBE' as SocialPlatform,
    url: 'https://www.youtube.com/watch?v=k2P_amNDC2g',
    desc: 'All corps members are required to watch, like, leave a comment with key takeaways, and share our weekly masterclass link.',
    actions: ['LIKE', 'COMMENT', 'SHARE'] as SocialActionType[],
    comment: 'Proud DO-DEEL CDS member advancing digital literacy and skills in Ondo State! 🚀 Inspiring masterclass.',
    hashtags: ['#DODEEL', '#NYSC', '#DigitalLiteracy', '#YouthEmpowerment'],
  },
  {
    title: 'LinkedIn Professional Visibility Push',
    platform: 'LINKEDIN' as SocialPlatform,
    url: 'https://www.linkedin.com/feed/',
    desc: 'Share DO-DEEL employability achievements on LinkedIn with professional commentary and tag the CDS community.',
    actions: ['LIKE', 'COMMENT', 'SHARE'] as SocialActionType[],
    comment: 'Excited to drive sustainable community development with DO-DEEL CDS! #NYSC #Employability',
    hashtags: ['#DODEEL', '#NYSC', '#Leadership', '#FutureOfWork'],
  },
  {
    title: 'X/Twitter Grassroots Visibility Storm',
    platform: 'TWITTER' as SocialPlatform,
    url: 'https://twitter.com/',
    desc: 'Amplify our state-wide digital literacy initiatives with quotes, retweets, and active engagement under our official hashtags.',
    actions: ['LIKE', 'COMMENT', 'SHARE'] as SocialActionType[],
    comment: 'Transforming local governments through grassroots digital training with DO-DEEL CDS! 💡',
    hashtags: ['#DODEEL', '#NYSC', '#TechEmpowerment', '#OndoState'],
  },
  {
    title: 'Instagram Community Reel Engagement',
    platform: 'INSTAGRAM' as SocialPlatform,
    url: 'https://instagram.com/',
    desc: 'Engage with our latest CDS project highlight reel by dropping a comment, liking, and reposting to your story.',
    actions: ['LIKE', 'COMMENT', 'SHARE'] as SocialActionType[],
    comment: 'Community impact in action with DO-DEEL CDS Ondo State! 🔥',
    hashtags: ['#DODEEL', '#NYSC', '#CommunityImpact'],
  },
];

export const ManageSocialCampaignModal: React.FC<ManageSocialCampaignModalProps> = ({
  isOpen,
  onClose,
  campaignToEdit,
  onSaved,
}) => {
  const { currentUser } = useAuth();

  const [weekNumber, setWeekNumber] = useState(
    campaignToEdit?.weekNumber || `Week ${Math.ceil(new Date().getDate() / 7) + 40}`
  );
  const [title, setTitle] = useState(campaignToEdit?.title || '');
  const [description, setDescription] = useState(campaignToEdit?.description || '');
  const [targetPlatform, setTargetPlatform] = useState<SocialPlatform>(
    campaignToEdit?.targetPlatform || 'YOUTUBE'
  );
  const [targetUrl, setTargetUrl] = useState(
    campaignToEdit?.targetUrl || 'https://www.youtube.com/@DODEEL-CDS'
  );
  const [requiredActions, setRequiredActions] = useState<SocialActionType[]>(
    campaignToEdit?.requiredActions || ['LIKE', 'COMMENT', 'SHARE']
  );
  const [suggestedComment, setSuggestedComment] = useState(
    campaignToEdit?.suggestedComment || ''
  );
  const [hashtagsStr, setHashtagsStr] = useState(
    campaignToEdit?.suggestedHashtags?.join(', ') || '#DODEEL, #NYSC, #DigitalSkills'
  );
  const [startDate, setStartDate] = useState(
    campaignToEdit?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    campaignToEdit?.endDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isActive, setIsActive] = useState(
    campaignToEdit !== undefined ? campaignToEdit?.isActive ?? true : true
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyPreset = (idx: number) => {
    const p = CAMPAIGN_PRESETS[idx];
    setTitle(p.title);
    setTargetPlatform(p.platform);
    setTargetUrl(p.url);
    setDescription(p.desc);
    setRequiredActions(p.actions);
    setSuggestedComment(p.comment);
    setHashtagsStr(p.hashtags.join(', '));
  };

  const toggleAction = (action: SocialActionType) => {
    if (requiredActions.includes(action)) {
      if (requiredActions.length > 1) {
        setRequiredActions(requiredActions.filter((a) => a !== action));
      }
    } else {
      setRequiredActions([...requiredActions, action]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetUrl.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const hashtags = hashtagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`));

      const campaign: WeeklySocialCampaign = {
        id: campaignToEdit?.id || `campaign-${Date.now()}`,
        weekNumber: weekNumber.trim(),
        title: title.trim(),
        description: description.trim(),
        targetPlatform,
        targetUrl: targetUrl.trim(),
        requiredActions,
        suggestedComment: suggestedComment.trim() || undefined,
        suggestedHashtags: hashtags.length > 0 ? hashtags : undefined,
        startDate,
        endDate,
        isActive,
        createdBy: campaignToEdit?.createdBy || currentUser.id,
        createdByName: campaignToEdit?.createdByName || currentUser.fullName,
        createdByRole: campaignToEdit?.createdByRole || currentUser.role,
        createdAt: campaignToEdit?.createdAt || new Date().toISOString(),
      };

      await dataService.saveSocialCampaign(campaign);
      setIsSubmitting(false);
      onClose();
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Failed to save campaign:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={campaignToEdit ? 'Edit Weekly Social Campaign' : 'Launch New Weekly Social Campaign'}
      subtitle="Configure weekly mandatory social media activity managed by VP Growth"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preset Templates */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Quick Campaign Presets
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CAMPAIGN_PRESETS.map((preset, idx) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => applyPreset(idx)}
                className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {preset.platform === 'YOUTUBE' && <Youtube className="w-3.5 h-3.5 text-red-600 fill-red-600" />}
                  {preset.platform === 'LINKEDIN' && <Linkedin className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />}
                  {preset.platform === 'TWITTER' && <Twitter className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />}
                  {preset.platform === 'INSTAGRAM' && <Instagram className="w-3.5 h-3.5 text-pink-600" />}
                  <span className="text-[10px] font-bold text-slate-700 group-hover:text-indigo-900 truncate">
                    {preset.platform}
                  </span>
                </div>
                <p className="text-[11px] font-black text-slate-900 line-clamp-1">
                  {preset.title}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Core Campaign Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Week Identifier <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Week 42"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Platform Target
            </label>
            <select
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value as SocialPlatform)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
            >
              <option value="YOUTUBE">YouTube</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="TWITTER">X (Twitter)</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="TIKTOK">TikTok</option>
              <option value="OTHER">Multi-Platform</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Active Status
            </label>
            <div className="flex items-center h-9">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Set as Active Weekly Campaign</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Campaign Directive Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Amplify DO-DEEL Digital Literacy Masterclass on YouTube & LinkedIn"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Target Post / Content URL <span className="text-rose-500">*</span>
          </label>
          <input
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Instructions for Corps Members
          </label>
          <textarea
            rows={2}
            placeholder="Explain what members are expected to do (e.g. watch video, comment takeaways, share with colleagues)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 resize-none"
          />
        </div>

        {/* Required Actions Selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Required Actions (Members must complete these)
          </label>
          <div className="flex flex-wrap gap-2">
            {(['LIKE', 'COMMENT', 'SHARE'] as SocialActionType[]).map((act) => {
              const selected = requiredActions.includes(act);
              return (
                <button
                  key={act}
                  type="button"
                  onClick={() => toggleAction(act)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  <span>{act === 'LIKE' ? 'Like' : act === 'COMMENT' ? 'Comment' : 'Share'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates & Hashtags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Suggested Comment (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Proud DO-DEEL corps member driving digital skills in Ondo State..."
              value={suggestedComment}
              onChange={(e) => setSuggestedComment(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2 text-slate-800 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Suggested Hashtags (Comma-separated)
            </label>
            <textarea
              rows={2}
              placeholder="#DODEEL, #NYSC, #DigitalLiteracy, #OndoState"
              value={hashtagsStr}
              onChange={(e) => setHashtagsStr(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2 text-slate-800 resize-none"
            />
          </div>
        </div>

        {/* Campaign Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              End Date / Deadline
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Saving Campaign...</span>
              </>
            ) : (
              <>
                <Megaphone className="w-4 h-4" />
                <span>{campaignToEdit ? 'Save Changes' : 'Deploy Weekly Campaign'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
