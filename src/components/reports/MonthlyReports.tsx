import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, LocalGovernment, MonthlyReport, Task } from '../../types';
import { formatDate } from '../../utils/formatters';
import { canSubmitReport, isScopedToLG, ROLE_LABELS } from '../../utils/permissions';
import { EmptyState } from '../common/EmptyState';
import { KPIStat } from '../common/KPIStat';
import { SearchBar } from '../common/SearchBar';
import { ReportDetailModal } from './ReportDetailModal';
import { ReportSubmitModal } from './ReportSubmitModal';
import { CheckCircle2, FileText, Send, Users } from 'lucide-react';

interface MonthlyReportsProps {
  reports: MonthlyReport[];
  lgs: LocalGovernment[];
  tasks: Task[];
  activities: Activity[];
  initialReport?: MonthlyReport | null;
}

export const MonthlyReports: React.FC<MonthlyReportsProps> = ({
  reports,
  lgs,
  tasks,
  activities,
  initialReport,
}) => {
  const { currentUser, currentRole } = useAuth();

  if (!currentUser) return null;

  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedLg, setSelectedLg] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [activeReport, setActiveReport] = useState<MonthlyReport | null>(
    initialReport || null
  );
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  React.useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport);
    }
  }, [initialReport]);

  const isLGScoped = isScopedToLG(currentRole);

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      // Scoping
      if (isLGScoped && rep.lgId !== currentUser.lgId) return false;
      if (!isLGScoped && selectedLg !== 'ALL' && rep.lgId !== selectedLg) return false;

      // Month
      if (selectedMonth !== 'ALL' && rep.month !== selectedMonth) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          rep.submitterName.toLowerCase().includes(q) ||
          rep.lgName.toLowerCase().includes(q) ||
          rep.results.toLowerCase().includes(q) ||
          rep.month.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [reports, isLGScoped, currentUser.lgId, selectedLg, selectedMonth, search]);

  // Aggregation totals
  const totalBeneficiaries = useMemo(() => {
    return filteredReports.reduce((sum, r) => sum + (r.beneficiariesReached || 0), 0);
  }, [filteredReports]);

  const totalActivitiesCompleted = useMemo(() => {
    return filteredReports.reduce((sum, r) => sum + (r.activitiesCompleted || 0), 0);
  }, [filteredReports]);

  const canSubmit = canSubmitReport(currentRole);
  const monthsAvailable = Array.from(new Set(reports.map((r) => r.month)));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header & Submit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Monthly CDS Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational summaries aggregated by LG, Executive, and Month • Printable
          </p>
        </div>

        {canSubmit && (
          <button
            type="button"
            onClick={() => setIsSubmitOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Submit Monthly Report</span>
          </button>
        )}
      </div>

      {/* Aggregate Overview Metrics with KPIStat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KPIStat
          label="Reports Logged"
          value={filteredReports.length}
          subtext="Verified submissions"
          icon={FileText}
          variant="emerald"
        />
        <KPIStat
          label="Activities Delivered"
          value={totalActivitiesCompleted}
          subtext="Executed in chapters"
          icon={CheckCircle2}
          variant="blue"
        />
        <KPIStat
          label="Beneficiaries Reached"
          value={totalBeneficiaries}
          subtext="Youth & community"
          icon={Users}
          variant="purple"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2.5">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search report results, submitters, or chapters..."
        />

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium"
          >
            <option value="ALL">All Months</option>
            {monthsAvailable.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

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
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No monthly reports found"
          description="Submit a new report above or adjust your search filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              onClick={() => setActiveReport(rep)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveReport(rep);
                }
              }}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all p-4 shadow-2xs cursor-pointer flex flex-col justify-between focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {rep.lgName}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {rep.month}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {rep.status}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                  {rep.month} Operations & Impact Review
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted by {rep.submitterName} ({ROLE_LABELS[rep.submitterRole]})
                </p>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {rep.results}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-3 p-2 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Assigned</span>
                    <strong className="text-slate-800">{rep.activitiesAssigned}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Completed</span>
                    <strong className="text-emerald-700">{rep.activitiesCompleted}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Beneficiaries</span>
                    <strong className="text-purple-700">{rep.beneficiariesReached}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px] truncate">{formatDate(rep.submittedAt)}</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <span>View Full Report</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {activeReport && (
        <ReportDetailModal
          report={activeReport}
          isOpen={Boolean(activeReport)}
          onClose={() => setActiveReport(null)}
        />
      )}

      <ReportSubmitModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        lgs={lgs}
        tasks={tasks}
        activities={activities}
      />
    </div>
  );
};
