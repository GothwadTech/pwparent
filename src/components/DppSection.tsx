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

const IconClipboardExact: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect x="4" y="3" width="16" height="19" rx="2.5" fill="#F59E0B" />
    <rect x="6" y="5.5" width="12" height="14.5" rx="1.5" fill="#FFFFFF" />
    <rect x="8.5" y="1.5" width="7" height="3" rx="1.5" fill="#94A3B8" stroke="#64748B" strokeWidth="0.8" />
    <line x1="8.5" y1="9" x2="15.5" y2="9" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="8.5" y1="12" x2="15.5" y2="12" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="8.5" y1="15" x2="13.5" y2="15" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const DppSection: React.FC<DppSectionProps> = ({ summary, onOpenSubjectDetails }) => (
  <section className="px-4.5 pt-4 pb-5 bg-white">
    <div className="flex items-center space-x-2">
      <IconClipboardExact size={22} />
      <h2 className="text-[18px] font-bold text-[#111827] tracking-tight ml-1">
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
