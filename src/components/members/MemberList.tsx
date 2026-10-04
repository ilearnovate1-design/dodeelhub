import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, LocalGovernment, Member, MembershipStatus, Task, UserRole } from '../../types';
import { isScopedToLG, ROLE_LABELS } from '../../utils/permissions';
import { EmptyState } from '../common/EmptyState';
import { MemberCard } from '../common/MemberCard';
import { SearchBar } from '../common/SearchBar';
import { MemberDetailModal } from './MemberDetailModal';
import { MemberFormModal } from './MemberFormModal';
import { Plus, Users } from 'lucide-react';

interface MemberListProps {
  members: Member[];
  lgs: LocalGovernment[];
  tasks: Task[];
  activities: Activity[];
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  lgs,
  tasks,
  activities,
}) => {
  const { currentUser, currentRole } = useAuth();

  if (!currentUser) return null;

  const [search, setSearch] = useState('');
  const [selectedLg, setSelectedLg] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isLGScoped = isScopedToLG(currentRole);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Scoping
      if (isLGScoped && m.lgId !== currentUser.lgId) return false;
      if (!isLGScoped && selectedLg !== 'ALL' && m.lgId !== selectedLg) return false;

      // Status
      if (selectedStatus !== 'ALL' && m.membershipStatus !== selectedStatus) return false;

      // Role
      if (selectedRole !== 'ALL' && m.role !== selectedRole) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = m.fullName.toLowerCase().includes(q);
        const matchesEmail = m.email.toLowerCase().includes(q);
        const matchesPhone = m.phone.toLowerCase().includes(q);
        const matchesCode = (m.stateCode || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCode) {
          return false;
        }
      }

      return true;
    });
  }, [
    members,
    isLGScoped,
    currentUser.lgId,
    selectedLg,
    selectedStatus,
    selectedRole,
    search,
  ]);

  const canAdd = currentRole !== 'MEMBER';

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header & Add Member Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Members Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Corps members, group leaders, and executive officers across local chapters
          </p>
        </div>

        {canAdd && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Member</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2.5">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, state code, phone..."
        />

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {!isLGScoped && (
            <select
              value={selectedLg}
              onChange={(e) => setSelectedLg(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium"
            >
              <option value="ALL">All Local Govs</option>
              {lgs.map((lg) => (
                <option key={lg.id} value={lg.id}>
                  {lg.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium"
          >
            <option value="ALL">All Roles</option>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="Try adjusting your search query, status or role filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMembers.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              onClick={setActiveMember}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {activeMember && (
        <MemberDetailModal
          member={activeMember}
          isOpen={Boolean(activeMember)}
          onClose={() => setActiveMember(null)}
          tasks={tasks}
          activities={activities}
        />
      )}

      <MemberFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        lgs={lgs}
      />
    </div>
  );
};
