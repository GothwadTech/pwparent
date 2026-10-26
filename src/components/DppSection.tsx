/**
 * Daily Practice Paper section — matched to the reference look.
 *
 * A lavender roll-up card (attempted/assigned, a progress bar, and the two
 * "in attempted DPPs" percentages) above a white card holding the month-by-month
 * assigned-vs-attempted bar chart.
 *
 * All figures arrive as props from `useDppView`, which reads
 * `batches/{id}/dpp/{studentId}`. When the batch has no DPP record yet every
 * figure is 0 and the chart renders its empty grid — honest, not invented.
 */
import React from 'react';
import { Play } from 'lucide-react';
import type { DppSummary } from '../hooks/useDppView';
import {
  BAR_ASSIGNED, BAR_ATTEMPTED, CARD_BORDER, FIGURE, PROGRESS_FILL,
  PROGRESS_TRACK, SUMMARY_BG, TEXT_PRIMARY, TEXT_SECONDARY,
} from '../lib/uiTheme';

interface DppSectionProps {
  summary: DppSummary;
  onOpenSubjectDetails: () => void;
}

/** Month bars, scaled to the tallest value so short months stay visible. */
const MonthlyBars: React.FC<{ monthly: DppSummary['monthly'] }> = ({ monthly }) => {
  const max = Math.max(1, ...monthly.map((m) => Math.max(m.assigned, m.attempted)));

  return (
    <div className="flex items-end justify-around pt-4 pb-1.5" style={{ minHeight: 150 }}>
      {monthly.map((m) => (
        <div key={m.month} className="flex flex-col items-center">
          <div className="flex items-end space-x-1.5" style={{ height: 120 }}>
            <div className="flex flex-col items-center justify-end h-full">
              <span className="text-[8px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>{m.assigned}</span>
              <div className="w-6 rounded-t-sm" style={{ background: BAR_ASSIGNED, height: `${(m.assigned / max) * 100}%` }} />
            </div>
            <div className="flex flex-col items-center justify-end h-full">
              <span className="text-[8px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>{m.attempted}</span>
              <div className="w-6 rounded-t-sm" style={{ background: BAR_ATTEMPTED, height: `${(m.attempted / max) * 100}%` }} />
            </div>
          </div>
          <span className="text-[9px] mt-1.5" style={{ color: TEXT_PRIMARY }}>{m.month}</span>
        </div>
      ))}
    </div>
  );
};

export const DppSection: React.FC<DppSectionProps> = ({ summary, onOpenSubjectDetails }) => {
  const fillPercent = summary.totalAssigned > 0
    ? Math.round((summary.totalAttempted / summary.totalAssigned) * 100)
    : 0;

  return (
    <section className="px-3 pt-3 space-y-3">
      <div className="flex items-center space-x-2">
        <span className="text-[14px] leading-none">📋</span>
        <h2 className="text-[13px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
          Daily Practice Paper
        </h2>
      </div>

      {/* Lavender roll-up */}
      <div className="rounded-2xl p-3.5 space-y-3" style={{ background: SUMMARY_BG }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: TEXT_PRIMARY }}>Total DPP&apos;s Attempted</span>
          <span className="text-[15px] font-extrabold" style={{ color: TEXT_PRIMARY }}>
            {summary.totalAttempted}
            <span className="text-[10px] font-bold">/{summary.totalAssigned}</span>
          </span>
        </div>

        <div className="relative w-full h-1.5 rounded-full" style={{ background: PROGRESS_TRACK }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ background: PROGRESS_FILL, width: `${fillPercent}%` }}
          />
          <span
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{ background: PROGRESS_FILL, left: `calc(${fillPercent}% - 4px)` }}
          />
        </div>

        <div className="flex items-center space-x-3 pt-1">
          <span className="flex-1 h-px" style={{ background: '#C9C4F0' }} />
          <span className="text-[10px] font-bold" style={{ color: '#5747D6' }}>In Attempted DPP&apos;s</span>
          <span className="flex-1 h-px" style={{ background: '#C9C4F0' }} />
        </div>

        <div className="grid grid-cols-2 text-center">
          <div className="border-r" style={{ borderColor: '#C9C4F0' }}>
            <div className="text-[18px] font-extrabold" style={{ color: FIGURE }}>
              {summary.questionsAttemptedPercent}%
            </div>
            <div className="text-[10px] mt-1" style={{ color: TEXT_PRIMARY }}>Questions Attempted</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold" style={{ color: FIGURE }}>
              {summary.accuracyPercent}%
            </div>
            <div className="text-[10px] mt-1" style={{ color: TEXT_PRIMARY }}>Accuracy</div>
          </div>
        </div>
      </div>

      {/* Monthly bars */}
      {summary.monthly.length > 0 && (
        <div className="bg-white border rounded-2xl p-3.5" style={{ borderColor: CARD_BORDER }}>
          <h3 className="text-[11px] font-extrabold mb-1.5" style={{ color: TEXT_PRIMARY }}>
            Monthly DPP Performance
          </h3>
          <MonthlyBars monthly={summary.monthly} />
          <div className="flex items-center justify-center space-x-6 pt-2">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-sm" style={{ background: BAR_ASSIGNED }} />
              <span className="text-[9px]" style={{ color: TEXT_PRIMARY }}>Total DPPs Assigned</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-sm" style={{ background: BAR_ATTEMPTED }} />
              <span className="text-[9px]" style={{ color: TEXT_PRIMARY }}>Attempted DPPs</span>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onOpenSubjectDetails}
        className="mx-auto flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-[#F1F2F4]"
      >
        <span className="text-[10px] font-extrabold" style={{ color: TEXT_PRIMARY }}>Subject Details</span>
        <Play size={9} fill={TEXT_PRIMARY} style={{ color: TEXT_PRIMARY }} />
      </button>
    </section>
  );
};
