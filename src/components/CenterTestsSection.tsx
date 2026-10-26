/**
 * Classroom & centre tests — split out of OfflineAttendanceDashboardView.
 *
 * The summary card used to hardcode "3/4", "592/720" and "AIR 142". All three
 * are now derived from real results: tests attempted and best score come from
 * `batches/{id}/tests/{testId}/results/{studentId}`.
 *
 * Rank was REPLACED by attendance, not wired. A rank needs every student's
 * marks on the same paper, and the security rules deliberately let a parent read
 * only their own child's result — listing the class is admin-only. Inventing a
 * rank would be worse than omitting it, so the slot now shows the student's own
 * attendance percentage, which is real and which they are allowed to see.
 */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { BatchSummary } from '../hooks/useBatchView';
import type { OfflineTestRow } from './OfflineAttendanceDashboardView';

interface CenterTestsSectionProps {
  offlineTests: OfflineTestRow[];
  summary: BatchSummary;
  onViewAllTests: () => void;
}

export const CenterTestsSection: React.FC<CenterTestsSectionProps> = ({
  offlineTests,
  summary,
  onViewAllTests,
}) => {
  return (
      <section className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📑</span>
          <h2 className="text-base font-bold text-white tracking-tight">
            Classroom & Center Tests
          </h2>
        </div>

        {/* Tests Summary Card */}
        <div className="bg-[#151624] border border-[#2b2d42] rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-300 font-medium">Tests Attempted</span>
            <span className="text-sm font-bold text-white">
              {summary.testsAttempted}/{summary.testsTotal}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#23253b] text-center">
            <div className="py-1 border-r border-[#23253b]">
              <div className="text-lg font-bold text-white">{summary.bestScore || '—'}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Best Center Score</div>
            </div>
            <div className="py-1">
              {/* Rank is deliberately absent: computing it needs every student's
                  marks, and the rules let a parent read only their own child's
                  result. Showing an invented rank would be worse than none. */}
              <div className="text-lg font-bold text-indigo-400">
                {summary.attendancePercent || '—'}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Attendance</div>
            </div>
          </div>

          {/* Recent center tests timeline */}
          <div className="space-y-3 pt-1">
            <div className="text-xs font-bold text-neutral-300">Recent Center Tests</div>
            {offlineTests.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-2xl bg-[#1c1d2e] border border-[#2e3047] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{t.name}</span>
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-400 mt-0.5">
                    <span>{t.date}</span>
                    <span>•</span>
                    <span className="text-indigo-300 font-medium">{t.rank || '—'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-white block text-sm">{t.marks}</span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      t.status === 'ATTENDED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onViewAllTests}
            className="w-full mt-2 py-2.5 rounded-xl bg-[#202237] hover:bg-[#282a44] border border-[#363857] flex items-center justify-center space-x-2 text-xs font-semibold text-neutral-200 transition-colors"
          >
            <span>View All Center Tests</span>
            <ArrowRight size={14} className="text-[#9F86FF]" />
          </button>
        </div>
      </section>
  );
};
