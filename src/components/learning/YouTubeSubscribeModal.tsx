import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LearningResource } from '../../types';
import { Modal } from '../common/Modal';
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Lock,
  Play,
  Sparkles,
  Youtube,
} from 'lucide-react';

interface YouTubeSubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingResource?: LearningResource | null;
  onSubscribed?: (resource?: LearningResource | null) => void;
}

export const YouTubeSubscribeModal: React.FC<YouTubeSubscribeModalProps> = ({
  isOpen,
  onClose,
  pendingResource,
  onSubscribed,
}) => {
  const { currentUser, markYouTubeSubscribed } = useAuth();
  const settings = dataService.getSettings();

  const channelUrl = settings.youtubeChannelUrl || 'https://www.youtube.com/@DODEEL-CDS';
  const channelName = settings.youtubeChannelName || 'DO-DEEL CDS Official Channel';
  // Standard YouTube URL query param that triggers the one-click subscribe confirmation popup
  const subscribeUrl = channelUrl.includes('?')
    ? `${channelUrl}&sub_confirmation=1`
    : `${channelUrl}?sub_confirmation=1`;

  const [hasClickedSubscribe, setHasClickedSubscribe] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirmSubscription = async () => {
    setIsVerifying(true);
    try {
      // Record subscription in profile and local storage
      await markYouTubeSubscribed();
      setIsSuccess(true);
      setTimeout(() => {
        setIsVerifying(false);
        setIsSuccess(false);
        onClose();
        if (onSubscribed) {
          onSubscribed(pendingResource || null);
        }
      }, 1400);
    } catch (err) {
      console.error('Failed to save subscription:', err);
      setIsVerifying(false);
      onClose();
      if (onSubscribed) {
        onSubscribed(pendingResource || null);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="YouTube Subscription Required"
      subtitle="Access requirement for DO-DEEL video masterclasses"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Banner with YouTube Theme */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 p-5 text-white shadow-md">
          <div className="absolute -right-6 -bottom-6 opacity-15 pointer-events-none">
            <Youtube className="w-36 h-36" />
          </div>

          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Youtube className="w-7 h-7 text-white fill-white" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full mb-1">
                Mandatory Requirement
              </span>
              <h3 className="text-base font-black leading-tight text-white">
                Subscribe to Unlock Video Content
              </h3>
              <p className="text-xs text-red-100 mt-1 leading-relaxed">
                All members are required to subscribe to the official{' '}
                <strong>{channelName}</strong> to stream masterclasses, tutorials, and recorded workshops.
              </p>
            </div>
          </div>
        </div>

        {/* Selected Video Preview (if user clicked a specific video) */}
        {pendingResource && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            {pendingResource.thumbnailUrl ? (
              <img
                src={pendingResource.thumbnailUrl}
                alt={pendingResource.title}
                className="w-16 h-10 object-cover rounded-lg shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-16 h-10 bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 fill-slate-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                Pending Unlock
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">
                {pendingResource.title}
              </p>
              <span className="text-[10px] text-slate-400">
                {pendingResource.category} • {pendingResource.durationOrPages || 'Video'}
              </span>
            </div>
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
        )}

        {/* Step-by-Step Instructions */}
        <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div className="flex-1">
              <p className="font-bold text-slate-800">
                Click &ldquo;Subscribe on YouTube&rdquo; below
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Our channel will open in YouTube. Hit the red <strong>Subscribe</strong> button (and turn on the bell icon).
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-2.5 flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div className="flex-1">
              <p className="font-bold text-slate-800">
                Return here & confirm your subscription
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Click &ldquo;I Have Subscribed&rdquo; to unlock all videos for{' '}
                <span className="font-semibold text-slate-700">
                  {currentUser?.fullName || 'your account'}
                </span>.
              </p>
            </div>
          </div>
        </div>

        {/* Success Confirmation State */}
        {isSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-emerald-900">
              Subscription Confirmed!
            </h4>
            <p className="text-xs text-emerald-700">
              Access unlocked. Launching your video player now...
            </p>
          </div>
        ) : (
          /* Action Buttons */
          <div className="space-y-2 pt-1">
            <a
              href={subscribeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setHasClickedSubscribe(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-black shadow-sm transition-all transform active:scale-[0.99] cursor-pointer"
            >
              <Youtube className="w-4 h-4 fill-white" />
              <span>Step 1: Subscribe on YouTube Channel</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
            </a>

            <button
              type="button"
              onClick={handleConfirmSubscription}
              disabled={isVerifying}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                hasClickedSubscribe
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isVerifying ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Verifying subscription...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Step 2: I Have Subscribed — Unlock Videos</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Bell className="w-3 h-3" />
                <span>Subscription gives free lifetime access</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
              >
                Browse documents only
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
