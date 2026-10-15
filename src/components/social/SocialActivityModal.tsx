import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import {
  SocialActionType,
  SocialPlatform,
  WeeklySocialCampaign,
  WeeklySocialSubmission,
} from '../../types';
import { Modal } from '../common/Modal';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
  Youtube,
} from 'lucide-react';

interface SocialActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: WeeklySocialCampaign;
  existingSubmission?: WeeklySocialSubmission | null;
  onSubmitted?: () => void;
}

export const SocialActivityModal: React.FC<SocialActivityModalProps> = ({
  isOpen,
  onClose,
  campaign,
  existingSubmission,
  onSubmitted,
}) => {
  const { currentUser } = useAuth();

  const [completedActions, setCompletedActions] = useState<SocialActionType[]>(
    existingSubmission?.actionsCompleted || ['LIKE', 'COMMENT', 'SHARE']
  );
  const [platform, setPlatform] = useState<SocialPlatform>(
    existingSubmission?.platform || campaign.targetPlatform || 'YOUTUBE'
  );
  const [proofUrl, setProofUrl] = useState(existingSubmission?.proofUrl || '');
  const [proofDescription, setProofDescription] = useState(
    existingSubmission?.proofDescription || ''
  );
  const [hasVisitedLink, setHasVisitedLink] = useState(false);
  const [isCopiedComment, setIsCopiedComment] = useState(false);
  const [isCopiedHashtags, setIsCopiedHashtags] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!currentUser) return null;

  const toggleAction = (action: SocialActionType) => {
    if (completedActions.includes(action)) {
      setCompletedActions(completedActions.filter((a) => a !== action));
    } else {
      setCompletedActions([...completedActions, action]);
    }
  };

  const handleCopyComment = () => {
    if (campaign.suggestedComment) {
      navigator.clipboard.writeText(campaign.suggestedComment);
      setIsCopiedComment(true);
      setTimeout(() => setIsCopiedComment(false), 2000);
    }
  };

  const handleCopyHashtags = () => {
    if (campaign.suggestedHashtags && campaign.suggestedHashtags.length > 0) {
      navigator.clipboard.writeText(campaign.suggestedHashtags.join(' '));
      setIsCopiedHashtags(true);
      setTimeout(() => setIsCopiedHashtags(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (completedActions.length === 0) return;

    setIsSubmitting(true);
    try {
      await dataService.submitSocialActivity({
        id: existingSubmission?.id,
        campaignId: campaign.id,
        weekNumber: campaign.weekNumber,
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        userLgId: currentUser.lgId,
        userLgName: currentUser.lgName,
        actionsCompleted: completedActions,
        platform,
        proofUrl: proofUrl.trim(),
        proofDescription: proofDescription.trim(),
        status: 'SUBMITTED',
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsSubmitting(false);
        onClose();
        if (onSubmitted) onSubmitted();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit social engagement:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${campaign.weekNumber} Social Media Engagement`}
      subtitle="Complete your weekly like, comment & share activity managed by VP Growth"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campaign Info Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-4 sm:p-5 rounded-2xl text-white shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              {campaign.weekNumber} Campaign Directive
            </span>
            <span className="text-[10px] text-indigo-200 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Managed by VP Growth
            </span>
          </div>

          <h3 className="text-base font-black leading-snug">{campaign.title}</h3>
          <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
            {campaign.description}
          </p>

          <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-indigo-200">
                Target Post:
              </span>
              <a
                href={campaign.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setHasVisitedLink(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
              >
                <Youtube className="w-3.5 h-3.5 fill-white" />
                <span>Open & Engage on Post</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {hasVisitedLink && (
              <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Link opened</span>
              </span>
            )}
          </div>
        </div>

        {/* Suggested Tools (Templates & Hashtags) */}
        {(campaign.suggestedComment || (campaign.suggestedHashtags && campaign.suggestedHashtags.length > 0)) && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Quick Resources for Commenting & Sharing
            </span>

            {campaign.suggestedComment && (
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                    Suggested Comment Template:
                  </span>
                  <p className="text-slate-700 italic text-[11px]">
                    &ldquo;{campaign.suggestedComment}&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyComment}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md shrink-0 flex items-center gap-1 transition-colors"
                >
                  {isCopiedComment ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {campaign.suggestedHashtags && campaign.suggestedHashtags.length > 0 && (
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1">
                  {campaign.suggestedHashtags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleCopyHashtags}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md shrink-0 flex items-center gap-1 transition-colors"
                >
                  {isCopiedHashtags ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Tags</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Actions Checkboxes */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-900 block">
            Select the Actions You Carried Out <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* LIKE */}
            <button
              type="button"
              onClick={() => toggleAction('LIKE')}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                completedActions.includes('LIKE')
                  ? 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-400/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  completedActions.includes('LIKE')
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="text-xs font-bold block">1. Liked Post</span>
                <span className="text-[10px] text-slate-500">Upvoted / Thumbs up</span>
              </div>
            </button>

            {/* COMMENT */}
            <button
              type="button"
              onClick={() => toggleAction('COMMENT')}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                completedActions.includes('COMMENT')
                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-400/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  completedActions.includes('COMMENT')
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <MessageSquare className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="text-xs font-bold block">2. Commented</span>
                <span className="text-[10px] text-slate-500">Left feedback</span>
              </div>
            </button>

            {/* SHARE */}
            <button
              type="button"
              onClick={() => toggleAction('SHARE')}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                completedActions.includes('SHARE')
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-400/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  completedActions.includes('SHARE')
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">3. Shared / Repost</span>
                <span className="text-[10px] text-slate-500">Status / Group / Feed</span>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Proof Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Platform Engaged
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
            >
              <option value="YOUTUBE">YouTube</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="TWITTER">X (Twitter)</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="TIKTOK">TikTok</option>
              <option value="OTHER">Other / WhatsApp Status</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Proof Link (Optional)
            </label>
            <input
              type="url"
              placeholder="e.g. Link to your comment or shared post"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Engagement Notes or Comment Excerpt
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary: e.g. 'Liked the YouTube masterclass, commented as @corps_tech and shared to our LG CDS group.'"
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 resize-none"
            />
          </div>
        </div>

        {/* Success Feedback */}
        {isSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-black text-emerald-950">
              Weekly Activity Submitted!
            </p>
            <p className="text-xs text-emerald-700">
              Your engagement was registered for {currentUser.fullName} ({currentUser.lgName}).
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={completedActions.length === 0 || isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Weekly Engagement</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
};
