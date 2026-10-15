import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { CDSDocument, DocumentCategory, DocumentVisibility } from '../../types';
import { Modal } from '../common/Modal';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Governance');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('1.5 MB');
  const [fileType, setFileType] = useState('PDF');
  const [visibility, setVisibility] = useState<DocumentVisibility>('ALL');
  const [version, setVersion] = useState('v1.0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newDoc: CDSDocument = {
      id: `doc-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      fileUrl: fileUrl.trim() || 'https://example.com/dodeel-document.pdf',
      fileSize,
      fileType,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.fullName,
      visibility,
      version,
    };

    await dataService.saveDocument(newDoc);
    onClose();
    // Reset
    setTitle('');
    setDescription('');
    setFileUrl('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload CDS Official Document"
      subtitle="Publish guidelines, templates, bye-laws or brand assets"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Document Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. DO-DEEL Executive Operational SOP 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            placeholder="Document purpose, who should read it, and key summary..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Governance">Governance</option>
              <option value="Executive Resources">Executive Resources</option>
              <option value="Training Materials">Training Materials</option>
              <option value="Programme Guides">Programme Guides</option>
              <option value="Reports & Templates">Reports & Templates</option>
              <option value="Forms">Forms</option>
              <option value="Branding">Branding</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Access Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as DocumentVisibility)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Members & Executives</option>
              <option value="EXECUTIVES_ONLY">Executives & Group Leaders Only</option>
              <option value="LEADERSHIP_ONLY">State Leadership & Presidents Only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">File Type</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="XLSX">XLSX</option>
              <option value="ZIP">ZIP</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">File Size</label>
            <input
              type="text"
              placeholder="e.g. 2.4 MB"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Version</label>
            <input
              type="text"
              placeholder="v1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            File Storage URL / Link
          </label>
          <input
            type="url"
            placeholder="https://drive.google.com/... or cloud link"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
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
            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            Upload Document
          </button>
        </div>
      </form>
    </Modal>
  );
};
