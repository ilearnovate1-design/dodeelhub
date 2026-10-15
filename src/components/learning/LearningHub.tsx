import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LearningCategory, LearningResource } from '../../types';
import { canPublishLearning } from '../../utils/permissions';
import { EmptyState } from '../common/EmptyState';
import { FilterBar } from '../common/FilterBar';
import { LearningCard } from '../common/LearningCard';
import { SearchBar } from '../common/SearchBar';
import { LearningPlayerModal } from './LearningPlayerModal';
import { LearningPublishModal } from './LearningPublishModal';
import { YouTubeSubscribeModal } from './YouTubeSubscribeModal';
import {
  Bell,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Lock,
  Plus,
  Sparkles,
  Youtube,
} from 'lucide-react';

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
  const { currentRole, isYouTubeSubscribed } = useAuth();
  const settings = dataService.getSettings();

  const channelUrl = settings.youtubeChannelUrl || 'https://www.youtube.com/@DODEEL-CDS';
  const channelName = settings.youtubeChannelName || 'DO-DEEL CDS Official Channel';

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | LearningCategory>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [activeResource, setActiveResource] = useState<LearningResource | null>(
    initialResource || null
  );
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [pendingResource, setPendingResource] = useState<LearningResource | null>(null);

  React.useEffect(() => {
    if (initialResource) {
      if (initialResource.type === 'YOUTUBE' && !isYouTubeSubscribed) {
        setPendingResource(initialResource);
        setIsSubscribeModalOpen(true);
      } else {
        setActiveResource(initialResource);
      }
    }
  }, [initialResource, isYouTubeSubscribed]);

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

  const handleResourceClick = (resource: LearningResource) => {
    if (resource.type === 'YOUTUBE' && !isYouTubeSubscribed) {
      setPendingResource(resource);
      setIsSubscribeModalOpen(true);
    } else {
      setActiveResource(resource);
    }
  };

  const handleSubscribed = (resource?: LearningResource | null) => {
    if (resource) {
      setActiveResource(resource);
      setPendingResource(null);
    }
  };

  const canPublish = canPublishLearning(currentRole);

  const filterOptions = CATEGORIES.map((c) => ({
    id: c,
    label: c === 'ALL' ? 'All Subjects' : c,
  }));

  const youtubeVideoCount = learning.filter((r) => r.type === 'YOUTUBE').length;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header & Publish Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              DO-DEEL Learning Hub
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
              Capacity Building
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Curated YouTube masterclasses, employability workshops, entrepreneurship & leadership guides
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={channelUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors"
          >
            <Youtube className="w-4 h-4 fill-red-600 text-red-600" />
            <span className="hidden xs:inline">Our Channel</span>
            <ExternalLink className="w-3 h-3 text-red-400" />
          </a>

          {canPublish && (
            <button
              type="button"
              onClick={() => setIsPublishOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Resource</span>
            </button>
          )}
        </div>
      </div>

      {/* Mandatory YouTube Subscription Banner */}
      {!isYouTubeSubscribed ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-4 sm:p-5 text-white shadow-sm border border-red-500/20">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-4 pointer-events-none">
            <Youtube className="w-44 h-44 text-white fill-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                <Youtube className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                    Mandatory Requirement
                  </span>
                  <span className="text-[11px] text-red-100 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>{youtubeVideoCount} Video Masterclasses Locked</span>
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-white mt-1">
                  Subscribe to Our YouTube Channel to Access All Videos
                </h2>
                <p className="text-xs text-red-100 mt-0.5 leading-relaxed">
                  All users are required to subscribe to <strong>{channelName}</strong> to stream masterclasses, tutorials, and practical workshops linked on this platform.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPendingResource(null);
                  setIsSubscribeModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-red-700 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Youtube className="w-4 h-4 fill-red-600 text-red-600" />
                <span>Subscribe to Unlock</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs text-emerald-850">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-emerald-950">
                YouTube Channel Subscription Verified
              </p>
              <p className="text-[11px] text-emerald-700">
                You have unrestricted access to all DO-DEEL video masterclasses, tutorials, and recorded workshop sessions.
              </p>
            </div>
          </div>
          <a
            href={channelUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100/50 text-emerald-800 font-bold rounded-xl border border-emerald-300 text-[11px] transition-colors shrink-0"
          >
            <Youtube className="w-3.5 h-3.5 text-red-600 fill-red-600" />
            <span>Visit Channel</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>
        </div>
      )}

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
          className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-medium cursor-pointer shadow-2xs"
        >
          <option value="ALL">All Media Types</option>
          <option value="YOUTUBE">YouTube Videos ({youtubeVideoCount})</option>
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
              isYouTubeSubscribed={isYouTubeSubscribed}
              onClick={handleResourceClick}
            />
          ))}
        </div>
      )}

      {/* Video / Resource Player Modal */}
      {activeResource && (
        <LearningPlayerModal
          resource={activeResource}
          isOpen={Boolean(activeResource)}
          onClose={() => setActiveResource(null)}
        />
      )}

      {/* YouTube Subscription Requirement Modal */}
      <YouTubeSubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => {
          setIsSubscribeModalOpen(false);
          setPendingResource(null);
        }}
        pendingResource={pendingResource}
        onSubscribed={handleSubscribed}
      />

      {/* Publish Resource Modal */}
      <LearningPublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
      />
    </div>
  );
};
