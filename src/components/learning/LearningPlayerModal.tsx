import React from 'react';
import { LearningResource } from '../../types';
import { formatDate, getYouTubeEmbedUrl } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ExternalLink, FileText, Play, Youtube } from 'lucide-react';

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
  if (!resource) return null;

  const isYouTube = resource.type === 'YOUTUBE' && resource.youtubeVideoId;

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
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md">
            <iframe
              src={getYouTubeEmbedUrl(resource.youtubeVideoId!)}
              title={resource.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
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
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              {resource.category}
            </span>
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
                <span>External Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
