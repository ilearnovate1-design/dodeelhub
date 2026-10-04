import React from 'react';
import { CDSDocument } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Lock,
  Share2,
  Tag,
  User,
} from 'lucide-react';

interface DocumentDetailModalProps {
  document: CDSDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document: doc,
  isOpen,
  onClose,
}) => {
  if (!doc) return null;

  const handleDownload = () => {
    // Open file url in new tab or trigger download
    window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doc.title}
      subtitle={`DO-DEEL CDS Official Document • ${doc.category}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Document Metadata Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {doc.category}
            </span>
            {doc.version && (
              <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {doc.version}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {doc.visibility !== 'ALL' ? (
              <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3 text-amber-700" />
                {doc.visibility === 'EXECUTIVES_ONLY' ? 'Executive Access' : 'Leadership Access'}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                Public to All Members
              </span>
            )}
          </div>
        </div>

        {/* File Format & Size Highlight Box */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
              {doc.fileType}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{doc.title}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {doc.fileSize} • Uploaded {formatDate(doc.uploadDate)} by {doc.uploadedByName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>

        {/* Full Document Description */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Document Overview & Purpose
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
            {doc.description}
          </p>
        </div>

        {/* Verification & Usage Details */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Uploaded By</span>
            <span className="font-semibold text-slate-800">{doc.uploadedByName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Publication Date</span>
            <span className="font-semibold text-slate-800">{formatDate(doc.uploadDate)}</span>
          </div>
        </div>

        {/* Action Buttons: VIEW → DOWNLOAD */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2"
          >
            Close
          </button>

          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors border border-slate-200"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>Open Link</span>
          </a>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Document</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
