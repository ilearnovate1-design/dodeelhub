import React from 'react';
import { CDSDocument } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Download, Eye, FileText, Lock } from 'lucide-react';

interface DocumentCardProps {
  document: CDSDocument;
  onView?: (doc: CDSDocument) => void;
  canManage?: boolean;
  onDelete?: (doc: CDSDocument) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  onView,
  canManage = false,
  onDelete,
}) => {
  const handleCardClick = () => {
    if (onView) {
      onView(doc);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all p-4 shadow-2xs hover:shadow-xs flex flex-col justify-between cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {doc.category}
            </span>
            {doc.version && (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {doc.version}
              </span>
            )}
          </div>

          {doc.visibility !== 'ALL' && (
            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
              <Lock className="w-2.5 h-2.5" />
              {doc.visibility === 'EXECUTIVES_ONLY' ? 'Exec Only' : 'Leadership'}
            </span>
          )}
        </div>

        <div className="flex items-start gap-3 mt-1">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {doc.fileType}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
              {doc.title}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {doc.fileSize} • Uploaded {formatDate(doc.uploadDate)}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
          {doc.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
          By {doc.uploadedByName}
        </span>

        {/* VIEW → DOWNLOAD buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onView) onView(doc);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>

          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xs transition-colors text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>
    </div>
  );
};
