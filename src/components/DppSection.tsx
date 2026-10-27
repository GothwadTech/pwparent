/**
 * Daily Practice Paper section — measured off the reference screenshots.
 *
 * 20px clipboard icon + 16px extrabold heading, the shared lavender roll-up,
 * then the white monthly card: 14px title, paired 24px bars (light-blue assigned
 * / indigo attempted) with their value labels above and month names below, and
 * the centred two-square legend. Bars keep a 4px stub so a month with zero
 * attempts still shows WHERE its attempted bar would grow — exactly what the
 * reference renders for its 0-attempt months.
 *
 * All figures come from `useDppView`; an unrecorded batch shows honest zeros.
 */
import React from 'react';
import {IconClipboard} from './icons/AppIcons';
import type { DppSummary } from '../hooks/useDppView';
import { SummaryRollup, SubjectDetailsPill } from './SummaryRollup';
import {
  BAR_ASSIGNED, BAR_ATTEMPTED, CARD_BORDER, TEXT_PRIMARY,
} from '../lib/uiTheme';

interface DppSectionProps {
  summary: DppSummary;
  onOpenSubjectDetails: () => void;
}

/** One month's assigned+attempted pair, scaled to the tallest bar. */
const MonthBars: React.FC<{ monthly: DppSummary['monthly'] }> = ({ monthly }) => {
  const max = Math.max(1, ...monthly.map((m) => Math.max(m.assigned, m.attempted)));
  const heightOf = (value: number) => `${Math.max(4, (value / max) * 108)}px`;

  return (
    <div className="flex items-end justify-around pt-5 pb-1">
      {monthly.map((m) => (
        <div key={m.month} className="flex flex-col items-center">
          <div className="flex items-end space-x-1" style={{ height: 132 }}>
            <div className="flex flex-col items-center justify-end h-full">
              <span className="text-[12px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>
                {m.assigned}
              </span>
              <div className="w-6 rounded-t-[3px]" style={{ background: BAR_ASSIGNED, height: heightOf(m.assigned) }} />
            </div>
            <div className="flex flex-col items-center justify-end h-full">
              <span className="text-[12px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>
                {m.attempted}
              </span>
              <div className="w-6 rounded-t-[3px]" style={{ background: BAR_ATTEMPTED, height: heightOf(m.attempted) }} />
            </div>
          </div>
          <span className="text-[12px] mt-2" style={{ color: TEXT_PRIMARY }}>{m.month}</span>
        </div>
      ))}
    </div>
  );
};

export const DppSection: React.FC<DppSectionProps> = ({ summary, onOpenSubjectDetails }) => (
  <section className="px-4.5 pt-4 pb-5 bg-white">
    <div className="flex items-center space-x-2.5">
      <span className="text-[22px] leading-none select-none">📋</span>
      <h2 className="text-[20px] font-bold text-[#17181C] tracking-tight">
        Daily Practice Paper
      </h2>
    </div>

    <div className="mt-3">
      <SummaryRollup
        label="Total DPP's Attempted"
        numerator={summary.totalAttempted}
        denominator={summary.totalAssigned}
        dividerLabel="In Attempted DPP's"
        leftValue={`${summary.questionsAttemptedPercent}%`}
        leftLabel="Questions Attempted"
        rightValue={`${summary.accuracyPercent}%`}
        rightLabel="Accuracy"
      />
    </div>

    {summary.monthly.length > 0 && (
      <div className="bg-white border rounded-2xl px-4 pt-4 pb-3 mt-3" style={{ borderColor: CARD_BORDER }}>
        <h3 className="text-[14px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
          Monthly DPP Performance
        </h3>
        <MonthBars monthly={summary.monthly} />
        <div className="flex items-center justify-center space-x-6 pt-3 pb-1">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-[3px]" style={{ background: BAR_ASSIGNED }} />
            <span className="text-[11px]" style={{ color: TEXT_PRIMARY }}>Total DPPs Assigned</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-[3px]" style={{ background: BAR_ATTEMPTED }} />
            <span className="text-[11px]" style={{ color: TEXT_PRIMARY }}>Attempted DPPs</span>
          </div>
        </div>
      </div>
    )}

    <SubjectDetailsPill onClick={onOpenSubjectDetails} />
  </section>
);
