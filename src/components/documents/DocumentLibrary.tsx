import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { CDSDocument, DocumentCategory } from '../../types';
import { canManageDocuments, canViewDocument } from '../../utils/permissions';
import { DocumentCard } from '../common/DocumentCard';
import { EmptyState } from '../common/EmptyState';
import { FilterBar } from '../common/FilterBar';
import { SearchBar } from '../common/SearchBar';
import { DocumentDetailModal } from './DocumentDetailModal';
import { DocumentUploadModal } from './DocumentUploadModal';
import { FolderLock, Plus } from 'lucide-react';

interface DocumentLibraryProps {
  documents: CDSDocument[];
}

const CATEGORIES: Array<'ALL' | DocumentCategory> = [
  'ALL',
  'Governance',
  'Executive Resources',
  'Training Materials',
  'Programme Guides',
  'Reports & Templates',
  'Forms',
  'Branding',
  'Other',
];

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ documents }) => {
  const { currentRole } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | DocumentCategory>('ALL');
  const [search, setSearch] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<CDSDocument | null>(null);

  // Filter based on category, search, and strict role permissions
  const visibleDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Access control
      if (!canViewDocument(currentRole, doc.visibility)) {
        return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) {
        return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.description.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [documents, selectedCategory, search, currentRole]);

  const canUpload = canManageDocuments(currentRole);

  const filterOptions = CATEGORIES.map((c) => ({
    id: c,
    label: c === 'ALL' ? 'All Documents' : c,
  }));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            CDS Document Library
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official DO-DEEL bye-laws, training syllabi, executive templates & brand guides
          </p>
        </div>

        {canUpload && (
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <FilterBar
        options={filterOptions}
        activeId={selectedCategory}
        onSelect={(id) => setSelectedCategory(id as any)}
      />

      {/* Search Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search documents by title, keyword, or category..."
      />

      {/* Document Grid */}
      {visibleDocuments.length === 0 ? (
        <EmptyState
          icon={FolderLock}
          title="No documents found"
          description="There are no documents matching your chosen category or search query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={(d) => setViewingDoc(d)}
              canManage={canUpload}
            />
          ))}
        </div>
      )}

      {/* Document View Modal */}
      {viewingDoc && (
        <DocumentDetailModal
          document={viewingDoc}
          isOpen={Boolean(viewingDoc)}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};
