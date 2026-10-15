import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import {
  LocalGovernment,
  Member,
  SocialActionType,
  WeeklySocialCampaign,
  WeeklySocialSubmission,
} from '../../types';
import { ManageSocialCampaignModal } from './ManageSocialCampaignModal';
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  Heart,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  Youtube,
  Linkedin,
  Twitter,
  Instagram,
} from 'lucide-react';

interface SocialEngagementManagerProps {
  members: Member[];
  lgs: LocalGovernment[];
}

export const SocialEngagementManager: React.FC<SocialEngagementManagerProps> = ({
  members,
  lgs,
}) => {
  const { currentUser, currentRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUBMISSIONS' | 'LEADERBOARD'>('OVERVIEW');
  const [selectedLgFilter, setSelectedLgFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchMember, setSearchMember] = useState('');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<WeeklySocialCampaign | null>(null);
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);

  const campaigns = dataService.getSocialCampaigns();
  const activeCampaign = dataService.getActiveSocialCampaign();
  const submissions = dataService.getSocialSubmissions();

  // Filter submissions for active campaign
  const activeSubmissions = useMemo(() => {
    if (!activeCampaign) return submissions;
    return submissions.filter(
      (s) => s.campaignId === activeCampaign.id || s.weekNumber === activeCampaign.weekNumber
    );
  }, [submissions, activeCampaign]);

  // Overall compliance stats
  const totalCorpsMembers = members.length || 1;
  const submittedMemberIds = useMemo(() => {
    return new Set(activeSubmissions.map((s) => s.userId));
  }, [activeSubmissions]);

  const completedCount = submittedMemberIds.size;
  const complianceRate = Math.min(100, Math.round((completedCount / totalCorpsMembers) * 100));

  // Action counts
  const totalLikes = activeSubmissions.filter((s) => s.actionsCompleted.includes('LIKE')).length;
  const totalComments = activeSubmissions.filter((s) => s.actionsCompleted.includes('COMMENT')).length;
  const totalShares = activeSubmissions.filter((s) => s.actionsCompleted.includes('SHARE')).length;
  const verifiedCount = activeSubmissions.filter((s) => s.status === 'VERIFIED').length;
  const pendingCount = activeSubmissions.filter((s) => s.status === 'SUBMITTED').length;

  // LG Performance Leaderboard
  const lgLeaderboard = useMemo(() => {
    return lgs.map((lg) => {
      const lgMembers = members.filter((m) => m.lgId === lg.id);
      const lgTotal = lgMembers.length || 0;
      const lgCompleted = lgMembers.filter((m) => submittedMemberIds.has(m.id)).length;
      const rate = lgTotal > 0 ? Math.round((lgCompleted / lgTotal) * 100) : 0;
      return {
        lgId: lg.id,
        lgName: lg.name,
        totalMembers: lgTotal,
        completedMembers: lgCompleted,
        rate,
      };
    }).sort((a, b) => b.rate - a.rate || b.completedMembers - a.completedMembers);
  }, [lgs, members, submittedMemberIds]);

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return activeSubmissions.filter((s) => {
      if (selectedLgFilter !== 'ALL' && s.userLgId !== selectedLgFilter) return false;
      if (selectedStatusFilter !== 'ALL' && s.status !== selectedStatusFilter) return false;
      if (searchMember.trim()) {
        const q = searchMember.toLowerCase();
        return (
          s.userName.toLowerCase().includes(q) ||
          s.userLgName.toLowerCase().includes(q) ||
          (s.proofDescription && s.proofDescription.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeSubmissions, selectedLgFilter, selectedStatusFilter, searchMember]);

  const handleVerify = async (id: string, status: 'VERIFIED' | 'FLAGGED') => {
    await dataService.verifySocialSubmission(
      id,
      status,
      undefined,
      currentUser?.fullName || 'VP Growth & Engagement'
    );
  };

  const handleCopyBroadcastReminder = () => {
    if (!activeCampaign) return;
    const text = `🚨 *DO-DEEL CDS WEEKLY SOCIAL MEDIA ENGAGEMENT* 🚨\n\nAll corps members are REQUIRED to carry out this week's social media activity (${activeCampaign.weekNumber}) to boost our visibility.\n\n📌 *Directive:* ${activeCampaign.title}\n🔗 *Target Link:* ${activeCampaign.targetUrl}\n✅ *Required Tasks:* Like ❤️, Comment 💬, Share / Repost 🔄\n${activeCampaign.suggestedHashtags ? `🏷️ *Hashtags:* ${activeCampaign.suggestedHashtags.join(' ')}\n` : ''}\n👉 Log in to the DO-DEEL Portal to submit your activity proof!\n\n_Managed by Office of the VP Growth & Visibility_`;

    navigator.clipboard.writeText(text);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full">
                📢 Social Media Engagement Engine
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                Managed by VP Growth
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Weekly Social Engagement Command
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Mandatory weekly like, comment, and share activity across all corps members to amplify DO-DEEL visibility, drive digital impact, and track participation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyBroadcastReminder}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {copiedBroadcast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Reminder Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy WhatsApp Nudge</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCampaignToEdit(null);
                setIsManageModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Weekly Directive</span>
            </button>
          </div>
        </div>

        {/* 5 Social Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-slate-100 text-xs">
          {/* Compliance Rate */}
          <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-1 text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Weekly Compliance</span>
            </div>
            <p className="text-2xl font-black text-emerald-950 mt-1">{complianceRate}%</p>
            <span className="text-[10px] text-emerald-700 font-medium">
              {completedCount} of {totalCorpsMembers} corps active
            </span>
          </div>

          {/* Likes */}
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
            <div className="flex items-center gap-1 text-rose-700">
              <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              <span className="text-[10px] font-bold uppercase">Likes Logged</span>
            </div>
            <p className="text-2xl font-black text-rose-950 mt-1">{totalLikes}</p>
            <span className="text-[10px] text-rose-700">Upvotes recorded</span>
          </div>

          {/* Comments */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
            <div className="flex items-center gap-1 text-blue-700">
              <MessageSquare className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
              <span className="text-[10px] font-bold uppercase">Comments</span>
            </div>
            <p className="text-2xl font-black text-blue-950 mt-1">{totalComments}</p>
            <span className="text-[10px] text-blue-700">Feedback left</span>
          </div>

          {/* Shares */}
          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
            <div className="flex items-center gap-1 text-purple-700">
              <Share2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase">Shares & Reposts</span>
            </div>
            <p className="text-2xl font-black text-purple-950 mt-1">{totalShares}</p>
            <span className="text-[10px] text-purple-700">Amplify visibility</span>
          </div>

          {/* Submissions Verified */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1 text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase">Audited Status</span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{verifiedCount}</p>
            <span className="text-[10px] text-slate-500">
              {pendingCount} pending review
            </span>
          </div>
        </div>
      </div>

      {/* Active Campaign Card */}
      {activeCampaign ? (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-sm border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">
                  Current Active Directive: {activeCampaign.weekNumber}
                </span>
                <span className="text-[10px] text-slate-400">
                  Runs {activeCampaign.startDate} to {activeCampaign.endDate}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {activeCampaign.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeCampaign.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400 font-bold">Mandatory:</span>
                {activeCampaign.requiredActions.map((act) => (
                  <span
                    key={act}
                    className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/15"
                  >
                    {act}
                  </span>
                ))}
                {activeCampaign.suggestedHashtags && (
                  <span className="text-[11px] text-indigo-300 font-mono">
                    {activeCampaign.suggestedHashtags.join(' ')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <a
                href={activeCampaign.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <span>View Target Post</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setCampaignToEdit(activeCampaign);
                  setIsManageModalOpen(true);
                }}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Edit Directive
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <div>
            <p className="font-black">No active weekly social campaign set.</p>
            <p className="text-amber-700 mt-0.5">
              Launch a weekly directive so all members are required to like, comment & share.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
          >
            Launch Campaign
          </button>
        </div>
      )}

      {/* Tabs Switcher: Overview / Submissions Review / LG Leaderboard */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Submissions Audit ({activeSubmissions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'LEADERBOARD'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>LG Chapters Leaderboard</span>
        </button>
      </div>

      {/* View: Submissions Audit Table */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search corps member by name, LG or comment..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedLgFilter}
                onChange={(e) => setSelectedLgFilter(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-medium"
              >
                <option value="ALL">All Local Governments ({lgs.length})</option>
                {lgs.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    {lg.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Pending Audit ({pendingCount})</option>
                <option value="VERIFIED">Verified ({verifiedCount})</option>
                <option value="FLAGGED">Flagged</option>
              </select>
            </div>
          </div>

          {/* Submissions Table / Cards */}
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
              No engagement submissions found matching your filters.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 truncate">
                        {sub.userName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {sub.userRole}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {sub.userLgName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {sub.proofDescription || 'Verified like, comment and social share for this week.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      {sub.actionsCompleted.map((act) => (
                        <span
                          key={act}
                          className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded"
                        >
                          {act === 'LIKE' && <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />}
                          {act === 'COMMENT' && <MessageSquare className="w-3 h-3 fill-blue-500 text-blue-500" />}
                          {act === 'SHARE' && <Share2 className="w-3 h-3 text-emerald-500" />}
                          <span>{act}</span>
                        </span>
                      ))}

                      {sub.proofUrl && (
                        <a
                          href={sub.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                        >
                          <span>Proof Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <span className="text-slate-400 text-[10px]">
                        Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Audit Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    {sub.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerify(sub.id, 'VERIFIED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        Verify Proof
                      </button>
                    )}

                    {sub.status !== 'FLAGGED' && (
                      <button
                        type="button"
                        onClick={() => handleVerify(sub.id, 'FLAGGED')}
                        className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        Flag
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View: LG Chapters Leaderboard */}
      {activeTab === 'LEADERBOARD' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Local Government Chapter Social Compliance Leaderboard
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by weekly completion rate across all 18 Local Governments in Ondo State.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lgLeaderboard.map((item, index) => (
              <div
                key={item.lgId}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      index === 0
                        ? 'bg-amber-400 text-amber-950 shadow-2xs'
                        : index === 1
                        ? 'bg-slate-300 text-slate-800'
                        : index === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {item.lgName}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {item.completedMembers} of {item.totalMembers} corps members engaged
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-black ${
                      item.rate >= 80
                        ? 'text-emerald-700'
                        : item.rate >= 50
                        ? 'text-amber-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {item.rate}%
                  </span>
                  <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.rate >= 80
                          ? 'bg-emerald-500'
                          : item.rate >= 50
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Weekly Campaign */}
      <ManageSocialCampaignModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        campaignToEdit={campaignToEdit}
      />
    </div>
  );
};
