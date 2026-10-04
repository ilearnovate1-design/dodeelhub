import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LearningCategory, LearningResource } from '../../types';
import { canPublishLearning } from '../../utils/permissions';
import { EmptyState } from '../common/EmptyState';
import { FilterBar } from '../common/FilterBar';
import { LearningCard } from '../common/LearningCard';
import { SearchBar } from '../common/SearchBar';
import { LearningPlayerModal } from './LearningPlayerModal';
import { LearningPublishModal } from './LearningPublishModal';
import { BookOpen, Plus } from 'lucide-react';

interface LearningHubProps {
  learning: LearningResource[];
  initialResource?: LearningResource | null;
}

const CATEGORIES: Array<'ALL' | LearningCategory> = [
  'ALL',
  'Digital Literacy',
  'Employability',
  'Entrepreneurship',
  'Leadership',
  'Digital Marketing',
  'Web Development',
  'Data Analysis',
  'Community Impact',
  'Other',
];

export const LearningHub: React.FC<LearningHubProps> = ({
  learning,
  initialResource,
}) => {
  const { currentRole } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | LearningCategory>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [activeResource, setActiveResource] = useState<LearningResource | null>(
    initialResource || null
  );
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  React.useEffect(() => {
    if (initialResource) {
      setActiveResource(initialResource);
    }
  }, [initialResource]);

  const filteredResources = useMemo(() => {
    return learning.filter((r) => {
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
      if (selectedType !== 'ALL' && r.type !== selectedType) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [learning, selectedCategory, selectedType, search]);

  const canPublish = canPublishLearning(currentRole);

  const filterOptions = CATEGORIES.map((c) => ({
    id: c,
    label: c === 'ALL' ? 'All Subjects' : c,
  }));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header & Publish Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            DO-DEEL Learning Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Curated YouTube masterclasses, employability workshops, entrepreneurship & leadership guides
          </p>
        </div>

        {canPublish && (
          <button
            type="button"
            onClick={() => setIsPublishOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Resource</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <FilterBar
        options={filterOptions}
        activeId={selectedCategory}
        onSelect={(id) => setSelectedCategory(id as any)}
      />

      {/* Search and Media Type Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search learning topics, skills, tutorials..."
        />

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-medium"
        >
          <option value="ALL">All Media Types</option>
          <option value="YOUTUBE">YouTube Videos</option>
          <option value="PDF">PDF Handbooks</option>
          <option value="EXTERNAL_URL">External Guides</option>
        </select>
      </div>

      {/* Resource Cards Grid */}
      {filteredResources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No learning resources found"
          description="Try choosing another subject category or adjusting your search keyword."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredResources.map((res) => (
            <LearningCard
              key={res.id}
              resource={res}
              onClick={setActiveResource}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {activeResource && (
        <LearningPlayerModal
          resource={activeResource}
          isOpen={Boolean(activeResource)}
          onClose={() => setActiveResource(null)}
        />
      )}

      <LearningPublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
      />
    </div>
  );
};
