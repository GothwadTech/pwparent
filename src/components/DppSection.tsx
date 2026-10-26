/**
 * Daily Practice Paper section — split out of OfflineAttendanceDashboardView.
 *
 * Markup unchanged. `dppTab` is local state because the parent never reads it.
 *
 * NOTE: the DPP counts in here are still the built-in sample figures. The batch
 * model tracks attendance, tests, syllabus and marks — it does NOT model DPPs,
 * so there is no real source to read from yet. Wiring this needs a
 * `batches/{id}/dpps` subcollection first; until then the numbers shown are the
 * component's own defaults, and `StudentProfile.dppsDone` is the only real
 * figure available.
 */
import React, { useState } from 'react';
import { ArrowRight, Flame } from 'lucide-react';

interface DppSectionProps {
  onOpenSubjectDetails: (subjectArea: 'lectures' | 'dpp' | 'tests') => void;
}

export const DppSection: React.FC<DppSectionProps> = ({ onOpenSubjectDetails }) => {
  const [dppTab, setDppTab] = useState<'objective' | 'subjective'>('subjective');

  return (
      <section className="space-y-3">
        {/* Header with DPP title & 3-day streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📋</span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Daily Practice Paper <span className="text-neutral-400 font-normal text-xs">(DPP)</span>
            </h2>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame size={14} className="fill-amber-400 text-amber-500 shrink-0" />
            <span className="text-xs font-bold tracking-tight">3 day streak</span>
          </div>
        </div>

        {/* DPP Container Card */}
        <div className="bg-[#151624] border border-[#2b2d42] rounded-3xl p-5 shadow-lg space-y-4">
          {/* Segmented control: Objective | Subjective (Subjective active as in screenshot) */}
          <div className="p-1 rounded-xl bg-[#1c1d2e] border border-[#2e3047] grid grid-cols-2 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDppTab('objective')}
              className={`py-2 rounded-lg transition-all text-center ${
                dppTab === 'objective'
                  ? 'bg-[#6254F6] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Objective
            </button>
            <button
              type="button"
              onClick={() => setDppTab('subjective')}
              className={`py-2 rounded-lg transition-all text-center ${
                dppTab === 'subjective'
                  ? 'bg-[#2b2c44] text-white shadow-sm border border-[#434568]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Subjective
            </button>
          </div>

          {/* DPP Stats Breakdown */}
          {dppTab === 'subjective' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300 font-medium">Total DPPs Attempted</span>
                <span className="text-sm font-bold text-white">42/50</span>
              </div>

              {/* Progress bar */}
              <div className="relative w-full h-1.5 bg-[#202135] rounded-full overflow-hidden">
                <div className="w-[84%] h-full bg-gradient-to-r from-indigo-500 to-[#6254F6] rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#23253b] text-center">
                <div className="py-1 border-r border-[#23253b]">
                  <div className="text-lg font-bold text-emerald-400">88.4%</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Subjective Accuracy</div>
                </div>
                <div className="py-1">
                  <div className="text-lg font-bold text-white">128</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Questions Checked</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300 font-medium">Total DPPs Attempted</span>
                <span className="text-sm font-bold text-white">68/88</span>
              </div>

              <div className="relative w-full h-1.5 bg-[#202135] rounded-full overflow-hidden">
                <div className="w-[77%] h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#23253b] text-center">
                <div className="py-1 border-r border-[#23253b]">
                  <div className="text-lg font-bold text-white">92.0%</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Objective Accuracy</div>
                </div>
                <div className="py-1">
                  <div className="text-lg font-bold text-white">410</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">MCQs Solved</div>
                </div>
              </div>
            </div>
          )}

          {/* Subject details button */}
          <button
            type="button"
            onClick={() => onOpenSubjectDetails('dpp')}
            className="w-full mt-2 py-2.5 rounded-xl bg-[#202237] hover:bg-[#282a44] border border-[#363857] flex items-center justify-center space-x-2 text-xs font-semibold text-neutral-200 transition-colors"
          >
            <span>DPP Subject Breakdown</span>
            <ArrowRight size={14} className="text-[#9F86FF]" />
          </button>
        </div>
      </section>
  );
};
