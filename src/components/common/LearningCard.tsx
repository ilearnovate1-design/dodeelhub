import React from 'react';
import { LearningResource } from '../../types';
import { BookOpen, ExternalLink, FileText, Play, Youtube } from 'lucide-react';

interface LearningCardProps {
  resource: LearningResource;
  onClick: (resource: LearningResource) => void;
}

export const LearningCard: React.FC<LearningCardProps> = ({ resource, onClick }) => {
  const isYouTube = resource.type === 'YOUTUBE';

  return (
    <div
      onClick={() => onClick(resource)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(resource);
        }
      }}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-purple-300 transition-all p-3.5 shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between focus:outline-hidden focus:ring-2 focus:ring-purple-500/40"
    >
      <div>
        {/* Media Frame / Thumbnail */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 mb-3 shadow-inner">
          {resource.thumbnailUrl ? (
            <img
              src={resource.thumbnailUrl}
              alt={resource.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800">
              <FileText className="w-8 h-8 mb-1 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{resource.type}</span>
            </div>
          )}

          {isYouTube && (
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/15 transition-colors">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </div>
            </div>
          )}

          {resource.durationOrPages && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
              {resource.durationOrPages}
            </span>
          )}

          {isYouTube && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
              <Youtube className="w-3 h-3" />
              <span>YouTube</span>
            </span>
          )}
        </div>

        {/* Category Badge */}
        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
          {resource.category}
        </span>

        {/* Title */}
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors mt-2 line-clamp-2 leading-snug">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
          {resource.description}
        </p>
      </div>

      {/* Footer with publisher and Watch/Read button */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
          By {resource.publisherName}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick(resource);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-all ${
            isYouTube
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {isYouTube ? (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch</span>
            </>
          ) : (
            <>
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
