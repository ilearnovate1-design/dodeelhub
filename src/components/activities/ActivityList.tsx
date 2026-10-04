import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, LocalGovernment, Member } from '../../types';
import { formatDate } from '../../utils/formatters';
import { canCreateActivity, canMarkAttendance, isScopedToLG } from '../../utils/permissions';
import { ActivityCard } from '../common/ActivityCard';
import { EmptyState } from '../common/EmptyState';
import { FilterBar } from '../common/FilterBar';
import { SearchBar } from '../common/SearchBar';
import { ActivityDetailModal } from './ActivityDetailModal';
import { ActivityFormModal } from './ActivityFormModal';
import { AttendanceModal } from './AttendanceModal';
import { Calendar, Plus, UserCheck } from 'lucide-react';

interface ActivityListProps {
  activities: Activity[];
  members: Member[];
  lgs: LocalGovernment[];
  initialActivity?: Activity | null;
  initialAttendanceActivity?: Activity | null;
  attendanceModeOnly?: boolean;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  members,
  lgs,
  initialActivity,
  initialAttendanceActivity,
  attendanceModeOnly = false,
}) => {
  const { currentUser, currentRole } = useAuth();

  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'ALL'>(
    attendanceModeOnly ? 'ALL' : 'UPCOMING'
  );
  const [search, setSearch] = useState('');
  const [selectedLg, setSelectedLg] = useState('ALL');

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    initialActivity || null
  );
  const [attendanceActivity, setAttendanceActivity] = useState<Activity | null>(
    initialAttendanceActivity || null
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  React.useEffect(() => {
    if (initialAttendanceActivity) {
      setAttendanceActivity(initialAttendanceActivity);
    }
  }, [initialAttendanceActivity]);

  const isLGScoped = isScopedToLG(currentRole);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // LG scoping
      if (isLGScoped && act.lgId !== 'ALL' && act.lgId !== currentUser.lgId) {
        return false;
      }
      if (!isLGScoped && selectedLg !== 'ALL' && act.lgId !== selectedLg) {
        return false;
      }

      // Tab filter
      if (activeTab === 'UPCOMING' && act.status !== 'UPCOMING') return false;
      if (activeTab === 'COMPLETED' && act.status !== 'COMPLETED') return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          act.location.toLowerCase().includes(q) ||
          act.organizerName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [activities, activeTab, selectedLg, search, isLGScoped, currentUser.lgId]);

  // Personal attendance history
  const personalAttendanceHistory = useMemo(() => {
    const list: Array<{ activity: Activity; status: 'PRESENT' | 'ABSENT' }> = [];
    activities.forEach((act) => {
      const rec = act.attendanceRecords.find((r) => r.memberId === currentUser.id);
      if (rec) {
        list.push({ activity: act, status: rec.status });
      }
    });
    return list;
  }, [activities, currentUser.id]);

  const canCreate = canCreateActivity(currentRole);
  const canMark = canMarkAttendance(currentRole);

  const filterTabs = [
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'COMPLETED', label: 'Past / Completed' },
    { id: 'ALL', label: 'All Activities' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {attendanceModeOnly ? 'Activity Attendance Register' : 'Activities & Attendance'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            CDS Thursday meetings, community outreach, and 1-tap member roll call
          </p>
        </div>

        {canCreate && !attendanceModeOnly && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Activity</span>
          </button>
        )}
      </div>

      {/* Member Attendance History Card */}
      {currentRole === 'MEMBER' && personalAttendanceHistory.length > 0 && (
        <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                My Attendance History
              </h3>
            </div>
            <span className="text-[11px] font-bold bg-emerald-800 px-2 py-0.5 rounded text-emerald-100">
              {personalAttendanceHistory.filter((h) => h.status === 'PRESENT').length} of{' '}
              {personalAttendanceHistory.length} Sessions Attended
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
            {personalAttendanceHistory.map(({ activity, status }) => (
              <div
                key={activity.id}
                className="bg-emerald-950/60 border border-emerald-700/50 p-2.5 rounded-xl shrink-0 text-xs min-w-[170px]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-emerald-300">{formatDate(activity.date)}</span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                      status === 'PRESENT' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <p className="font-semibold text-white truncate text-[11px]">{activity.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <FilterBar
          options={filterTabs}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as any)}
        />

        <div className="flex items-center gap-2">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search activity..."
            className="sm:w-60"
          />

          {!isLGScoped && (
            <select
              value={selectedLg}
              onChange={(e) => setSelectedLg(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium"
            >
              <option value="ALL">All LGs</option>
              {lgs.map((lg) => (
                <option key={lg.id} value={lg.id}>
                  {lg.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Activity Cards List */}
      {filteredActivities.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No activities found"
          description="Check back soon or create a new session above."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredActivities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              onClick={setSelectedActivity}
              onMarkAttendance={(a) => setAttendanceActivity(a)}
              canMarkAttendance={canMark}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          isOpen={Boolean(selectedActivity)}
          onClose={() => setSelectedActivity(null)}
          onOpenAttendance={(act) => setAttendanceActivity(act)}
          members={members}
        />
      )}

      {attendanceActivity && (
        <AttendanceModal
          activity={attendanceActivity}
          isOpen={Boolean(attendanceActivity)}
          onClose={() => setAttendanceActivity(null)}
          members={members}
        />
      )}

      <ActivityFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        lgs={lgs}
      />
    </div>
  );
};
