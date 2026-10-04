import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Activity, Member } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Check, CheckCircle2, Search, UserCheck, Users, X } from 'lucide-react';

interface AttendanceModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  activity,
  isOpen,
  onClose,
  members,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const [search, setSearch] = useState('');

  // Relevant members for this activity (if activity is for an LG, show that LG's members; else show all)
  const eligibleMembers = members.filter((m) => {
    if (!activity) return false;
    if (activity.lgId === 'ALL') return true;
    return m.lgId === activity.lgId;
  });

  // Local state for attendance records mapping memberId -> 'PRESENT' | 'ABSENT'
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});

  // Initialize or re-sync when activity opens
  React.useEffect(() => {
    if (activity) {
      const initialMap: Record<string, 'PRESENT' | 'ABSENT'> = {};
      // Existing records
      activity.attendanceRecords.forEach((r) => {
        initialMap[r.memberId] = r.status;
      });
      // Any missing eligible members default to PRESENT if unmarked
      eligibleMembers.forEach((m) => {
        if (!initialMap[m.id]) {
          initialMap[m.id] = 'PRESENT';
        }
      });
      setAttendanceMap(initialMap);
    }
  }, [activity]);

  if (!activity) return null;

  const handleToggle = (memberId: string, status: 'PRESENT' | 'ABSENT') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [memberId]: status,
    }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const newMap: Record<string, 'PRESENT' | 'ABSENT'> = {};
    eligibleMembers.forEach((m) => {
      newMap[m.id] = status;
    });
    setAttendanceMap(newMap);
  };

  const handleSave = () => {
    const records = Object.entries(attendanceMap).map(([memberId, status]) => {
      const mem = members.find((m) => m.id === memberId);
      return {
        memberId,
        memberName: mem ? mem.fullName : 'Member',
        status,
      };
    });

    dataService.recordBulkAttendance(activity.id, records, currentUser.fullName);
    onClose();
  };

  const filteredMembers = eligibleMembers.filter((m) =>
    m.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;
  const totalMarked = eligibleMembers.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Activity Attendance"
      subtitle={`${activity.title} • ${formatDate(activity.date)} (${activity.lgName})`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Attendance Summary Bar */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Attendance Summary
            </span>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {presentCount} Present
              </span>
              <span className="font-bold text-rose-700 flex items-center gap-1">
                <X className="w-3.5 h-3.5 text-rose-600" />
                {absentCount} Absent
              </span>
              <span className="text-slate-400">Total: {totalMarked} members</span>
            </div>
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll('PRESENT')}
              className="text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              className="text-[11px] font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Member Roll Call List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {filteredMembers.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No matching members found.</p>
          ) : (
            filteredMembers.map((m) => {
              const currentStatus = attendanceMap[m.id] || 'PRESENT';
              const isPresent = currentStatus === 'PRESENT';

              return (
                <div
                  key={m.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {m.fullName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.fullName}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {m.role.replace('_', ' ')} • {m.stateCode || m.lgName}
                      </p>
                    </div>
                  </div>

                  {/* Present / Absent Segmented Toggle */}
                  <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleToggle(m.id, 'PRESENT')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        isPresent
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>Present</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(m.id, 'ABSENT')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        !isPresent
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <X className="w-3 h-3" />
                      <span>Absent</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <p className="text-[11px] text-slate-500">
            Recorded by: <strong className="text-slate-800">{currentUser.fullName}</strong>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-slate-600 hover:text-slate-800 px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Save Attendance</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
