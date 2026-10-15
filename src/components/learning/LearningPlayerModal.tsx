import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LearningResource } from '../../types';
import { formatDate, getYouTubeEmbedUrl } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Lock,
  Play,
  Sparkles,
  Youtube,
} from 'lucide-react';

interface LearningPlayerModalProps {
  resource: LearningResource | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LearningPlayerModal: React.FC<LearningPlayerModalProps> = ({
  resource,
  isOpen,
  onClose,
}) => {
  const { isYouTubeSubscribed, markYouTubeSubscribed } = useAuth();
  const settings = dataService.getSettings();

  const [isVerifying, setIsVerifying] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  if (!resource) return null;

  const isYouTube = resource.type === 'YOUTUBE' && resource.youtubeVideoId;
  const channelUrl = settings.youtubeChannelUrl || 'https://www.youtube.com/@DODEEL-CDS';
  const channelName = settings.youtubeChannelName || 'DO-DEEL CDS Official Channel';
  const subscribeUrl = channelUrl.includes('?')
    ? `${channelUrl}&sub_confirmation=1`
    : `${channelUrl}?sub_confirmation=1`;

  const isLocked = isYouTube && !isYouTubeSubscribed && !justUnlocked;

  const handleConfirmSubscription = async () => {
    setIsVerifying(true);
    try {
      await markYouTubeSubscribed();
      setJustUnlocked(true);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resource.title}
      subtitle={`${resource.category} • Published by ${resource.publisherName}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Media Frame */}
        {isYouTube ? (
          isLocked ? (
            /* Locked Video Subscription Screen */
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 p-6 flex flex-col items-center justify-center text-center shadow-md border border-red-900/30">
              <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mb-3">
                <Youtube className="w-8 h-8 text-red-500 fill-red-500" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-[11px] font-bold mb-2">
                <Lock className="w-3 h-3" />
                <span>YouTube Subscription Required</span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-white max-w-md leading-snug">
                Subscribe to Watch Video Masterclasses
              </h3>
              <p className="text-xs text-slate-300 max-w-md mt-1 leading-relaxed">
                All members are required to subscribe to <strong>{channelName}</strong> to stream videos linked on this app.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5 w-full max-w-sm">
                <a
                  href={subscribeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Youtube className="w-4 h-4 fill-white" />
                  <span>1. Subscribe on YouTube</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>

                <button
                  type="button"
                  onClick={handleConfirmSubscription}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>2. I Have Subscribed</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-3">
                Once subscribed, all videos on DO-DEEL Learning Hub are unlocked instantly.
              </p>
            </div>
          ) : (
            /* Unlocked Video Iframe Player */
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md">
              <iframe
                src={getYouTubeEmbedUrl(resource.youtubeVideoId!)}
                title={resource.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          )
        ) : (
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{resource.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{resource.durationOrPages}</p>
            </div>
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Document / Resource</span>
            </a>
          </div>
        )}

        {/* Content Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                {resource.category}
              </span>
              {isYouTube && !isLocked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Channel Subscribed</span>
                </span>
              )}
            </div>
            <span className="text-slate-400">Published {formatDate(resource.createdAt)}</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {resource.description}
          </p>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>Publisher: <strong>{resource.publisherName}</strong></span>
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>{isYouTube ? 'Open on YouTube' : 'External Link'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

