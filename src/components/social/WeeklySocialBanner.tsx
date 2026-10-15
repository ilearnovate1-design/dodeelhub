import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import {
  WeeklySocialCampaign,
  WeeklySocialSubmission,
} from '../../types';
import { SocialActivityModal } from './SocialActivityModal';
import {
  CheckCircle2,
  ExternalLink,
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
  Youtube,
  Linkedin,
  Twitter,
  Instagram,
  AlertCircle,
} from 'lucide-react';

interface WeeklySocialBannerProps {
  onRefresh?: () => void;
}

export const WeeklySocialBanner: React.FC<WeeklySocialBannerProps> = ({ onRefresh }) => {
  const { currentUser } = useAuth();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  if (!currentUser) return null;

  const activeCampaign = dataService.getActiveSocialCampaign();
  if (!activeCampaign) return null;

  const isCompleted = dataService.hasMemberCompletedWeeklySocial(
    currentUser.id,
    activeCampaign.id
  );

  const mySubmissions = dataService.getMemberWeeklySubmissions(currentUser.id);
  const currentSubmission = mySubmissions.find(
    (s) => s.campaignId === activeCampaign.id || s.weekNumber === activeCampaign.weekNumber
  );

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'YOUTUBE':
        return <Youtube className="w-4 h-4 text-red-600 fill-red-600" />;
      case 'LINKEDIN':
        return <Linkedin className="w-4 h-4 text-blue-600 fill-blue-600" />;
      case 'TWITTER':
        return <Twitter className="w-4 h-4 text-sky-500 fill-sky-500" />;
      case 'INSTAGRAM':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      default:
        return <Share2 className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <>
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
          isCompleted
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50/40 border-emerald-200'
            : 'bg-gradient-to-r from-amber-50 via-rose-50/50 to-orange-50/40 border-amber-300/80 ring-1 ring-amber-400/20'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Content */}
          <div className="flex items-start gap-3.5 max-w-3xl">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-200 text-amber-900 border border-amber-300'
                  }`}
                >
                  {activeCampaign.weekNumber} Social Engagement
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  Managed by VP Growth
                </span>
                {isCompleted ? (
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Completed & Verified</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Weekly Action Required</span>
                  </span>
                )}
              </div>

              <h2 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                {activeCampaign.title}
              </h2>

              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {activeCampaign.description}
              </p>

              {/* Action checklist badges */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-[11px] font-bold text-slate-500">
                  Required weekly activities:
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/90 border border-slate-200 text-rose-700 px-2 py-0.5 rounded-lg shadow-2xs">
                  <Heart className="w-3 h-3 fill-rose-600 text-rose-600" />
                  <span>Like</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/90 border border-slate-200 text-blue-700 px-2 py-0.5 rounded-lg shadow-2xs">
                  <MessageSquare className="w-3 h-3 fill-blue-600 text-blue-600" />
                  <span>Comment</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/90 border border-slate-200 text-emerald-700 px-2 py-0.5 rounded-lg shadow-2xs">
                  <Share2 className="w-3 h-3 text-emerald-600" />
                  <span>Share / Repost</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <a
              href={activeCampaign.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-2xs transition-colors shrink-0"
            >
              {getPlatformIcon(activeCampaign.targetPlatform)}
              <span>Open Target Post</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400/30 active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'View / Update Proof' : 'Submit Activity Proof'}</span>
            </button>
          </div>
        </div>
      </div>

      <SocialActivityModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        campaign={activeCampaign}
        existingSubmission={currentSubmission}
        onSubmitted={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};
