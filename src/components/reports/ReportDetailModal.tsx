import React from 'react';
import { MonthlyReport } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { ROLE_LABELS } from '../../utils/permissions';
import { Modal } from '../common/Modal';
import { ExternalLink, Printer } from 'lucide-react';

interface ReportDetailModalProps {
  report: MonthlyReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${report.month} Monthly Operations Report`}
      subtitle={`DO-DEEL CDS • ${report.lgName} (${report.state})`}
      maxWidth="2xl"
    >
      <div className="space-y-5 print:p-6 print:m-0">
        {/* Top Header / Print Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="text-[11px] text-slate-500 block">Submitted By</span>
            <span className="text-sm font-bold text-slate-900">{report.submitterName}</span>
            <span className="text-xs text-slate-500 block">
              {ROLE_LABELS[report.submitterRole]} • {formatDateTime(report.submittedAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              Status: {report.status}
            </span>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors print:hidden shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Activities Assigned</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{report.activitiesAssigned}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Activities Completed</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{report.activitiesCompleted}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Beneficiaries Reached</span>
            <p className="text-xl font-black text-purple-700 mt-0.5">{report.beneficiariesReached}</p>
          </div>
        </div>

        {/* 8 Structured Report Sections */}
        <div className="space-y-4 text-xs">
          {/* Section 3: Evidence */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1 text-emerald-800">
              3. Submitted Evidence & Documentation
            </h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 break-all flex items-start gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{report.evidence}</span>
            </div>
          </div>

          {/* Section 4: Results */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
              4. Achievements & Measurable Results
            </h4>
            <p className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
              {report.results}
            </p>
          </div>

          {/* Section 6: Challenges */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
              6. Operational Challenges
            </h4>
            <p className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
              {report.challenges || 'No challenges specified.'}
            </p>
          </div>

          {/* Section 7: Outstanding Tasks */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
              7. Outstanding Tasks & Roll-overs
            </h4>
            <p className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
              {report.outstandingTasks || 'All assigned responsibilities concluded.'}
            </p>
          </div>

          {/* Section 8: Next Month's Plan */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1 text-indigo-800">
              8. Next Month Implementation Plan
            </h4>
            <p className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-slate-800 leading-relaxed font-medium">
              {report.nextMonthPlan}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
