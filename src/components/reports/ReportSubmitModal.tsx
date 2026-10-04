import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Activity, LocalGovernment, MonthlyReport, Task } from '../../types';
import { Modal } from '../common/Modal';
import { Sparkles } from 'lucide-react';

interface ReportSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  lgs: LocalGovernment[];
  tasks: Task[];
  activities: Activity[];
}

export const ReportSubmitModal: React.FC<ReportSubmitModalProps> = ({
  isOpen,
  onClose,
  lgs,
  tasks,
  activities,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const [month, setMonth] = useState('October 2026');
  const [lgId, setLgId] = useState(currentUser.lgId || 'lg-akure');
  const [activitiesAssigned, setActivitiesAssigned] = useState(0);
  const [activitiesCompleted, setActivitiesCompleted] = useState(0);
  const [evidence, setEvidence] = useState('');
  const [results, setResults] = useState('');
  const [beneficiariesReached, setBeneficiariesReached] = useState(0);
  const [challenges, setChallenges] = useState('');
  const [outstandingTasks, setOutstandingTasks] = useState('');
  const [nextMonthPlan, setNextMonthPlan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-aggregation logic
  useEffect(() => {
    if (isOpen) {
      const monthPrefix = month.split(' ')[0]; // e.g. "October"
      
      // 1. Filter tasks for this LG and month
      const lgTasks = tasks.filter(t => t.lgId === lgId);
      setActivitiesAssigned(lgTasks.length || 0);
      setActivitiesCompleted(lgTasks.filter(t => t.calculatedStatus === 'COMPLETED').length || 0);

      // 2. Count beneficiaries from activities in this LG
      const lgActivities = activities.filter(a => a.lgId === lgId && a.status === 'COMPLETED');
      const totalBeneficiaries = lgActivities.reduce((sum, a) => sum + (a.expectedAttendance || 0), 0);
      setBeneficiariesReached(totalBeneficiaries || 0);

      // 3. Pre-fill results with task titles for convenience
      if (!results) {
        const completedTaskTitles = lgTasks
          .filter(t => t.calculatedStatus === 'COMPLETED')
          .map(t => t.title)
          .join(', ');
        if (completedTaskTitles) {
          setResults(`Completed key responsibilities including: ${completedTaskTitles}.`);
        }
      }
    }
  }, [isOpen, month, lgId, tasks, activities, results]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!results.trim()) return;

    setIsSubmitting(true);

    // Simulate network delay for UX
    setTimeout(async () => {
      const selectedLG = lgs.find((l) => l.id === lgId) || {
        id: lgId,
        name: currentUser.lgName,
      };

      const newReport: MonthlyReport = {
        id: `rep-${Date.now()}`,
        month,
        year: 2026,
        monthIndex: month.includes('October') ? 9 : 8,
        submitterId: currentUser.id,
        submitterName: currentUser.fullName,
        submitterRole: currentUser.role,
        lgId: selectedLG.id,
        lgName: selectedLG.name,
        state: 'Ondo State',
        activitiesAssigned: Number(activitiesAssigned) || 0,
        activitiesCompleted: Number(activitiesCompleted) || 0,
        evidence: evidence.trim() || 'Verified attendance records and photo drive links submitted.',
        results: results.trim(),
        beneficiariesReached: Number(beneficiariesReached) || 0,
        challenges: challenges.trim() || 'None reported.',
        outstandingTasks: outstandingTasks.trim() || 'None.',
        nextMonthPlan: nextMonthPlan.trim(),
        submittedAt: new Date().toISOString(),
        status: 'SUBMITTED',
      };

      await dataService.saveReport(newReport);
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit CDS Monthly Report"
      subtitle="Complete the official 8-part DO-DEEL operational review"
      maxWidth="2xl"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className={`space-y-4 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Aggregation Alert */}
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-emerald-800 leading-tight">
            <strong>Smart Aggregation Active:</strong> Operational data for {lgId.replace('lg-', '').toUpperCase()} has been automatically pulled from the task engine and activity register to save you time.
          </p>
        </div>

        {/* Month & LG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Reporting Month <span className="text-rose-500">*</span>
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="October 2026">October 2026</option>
              <option value="September 2026">September 2026</option>
              <option value="August 2026">August 2026</option>
              <option value="November 2026">November 2026</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Local Government Chapter
            </label>
            <select
              value={lgId}
              onChange={(e) => setLgId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
            >
              {lgs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 1 & 2: Activities Assigned & Completed */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              1. Activities Assigned
            </label>
            <input
              type="number"
              min={0}
              required
              value={activitiesAssigned}
              onChange={(e) => setActivitiesAssigned(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              2. Activities Completed
            </label>
            <input
              type="number"
              min={0}
              required
              value={activitiesCompleted}
              onChange={(e) => setActivitiesCompleted(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              5. Beneficiaries Reached
            </label>
            <input
              type="number"
              min={0}
              required
              value={beneficiariesReached}
              onChange={(e) => setBeneficiariesReached(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 font-bold"
            />
          </div>
        </div>

        {/* Section 3: Evidence */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            3. Evidence Link / Documentation <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Google Drive link to pictures, attendance sign-ins, video recap..."
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Section 4: Results */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            4. Concrete Results Achieved <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            placeholder="Describe what was accomplished, training topics covered, skills mastered..."
            value={results}
            onChange={(e) => setResults(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Section 6: Challenges */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            6. Challenges Encountered
          </label>
          <textarea
            rows={2}
            placeholder="Logistics hurdles, equipment shortages, venue constraints, internet issues..."
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Section 7: Outstanding Tasks */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            7. Outstanding Tasks & Roll-overs
          </label>
          <input
            type="text"
            placeholder="Incomplete assignments and reasons for carry-over..."
            value={outstandingTasks}
            onChange={(e) => setOutstandingTasks(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Section 8: Next Month's Plan */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            8. Next Month's Implementation Plan <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            placeholder="Upcoming visits, scheduled bootcamps, target schools, KPI goals..."
            value={nextMonthPlan}
            onChange={(e) => setNextMonthPlan(e.target.value)}
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
            Submit Monthly Report
          </button>
        </div>
      </form>
    </Modal>
  );
};
