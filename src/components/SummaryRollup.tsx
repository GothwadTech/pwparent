/**
 * The lavender roll-up card the reference repeats in the DPP and Test sections.
 *
 * One component so both sections stay pixel-identical to each other and to the
 * screenshots: label left, `n/total` right (big numerator, small denominator),
 * a 5px progress track with the amber end-cap dot the reference always shows at
 * the far right, then the "In Attempted …" divider and the two deep-indigo
 * figures split by a hairline.
 *
 * Figures are props only — zeros render as zeros, never as sample data.
 */
import React from 'react';
import { FIGURE, PROGRESS_FILL, PROGRESS_TRACK, SUMMARY_BG, TEXT_PRIMARY } from '../lib/uiTheme';

interface SummaryRollupProps {
  /** e.g. "Total DPP's Attempted" */
  label: string;
  numerator: number;
  denominator: number;
  /** e.g. "In Attempted DPP's" */
  dividerLabel: string;
  leftValue: string;
  leftLabel: string;
  rightValue: string;
  rightLabel: string;
}

export const SummaryRollup: React.FC<SummaryRollupProps> = ({
  label,
  numerator,
  denominator,
  dividerLabel,
  leftValue,
  leftLabel,
  rightValue,
  rightLabel,
}) => {
  const fillPercent = denominator > 0
    ? Math.min(100, Math.round((numerator / denominator) * 100))
    : 0;

  return (
    <div className="rounded-2xl px-4 py-4" style={{ background: SUMMARY_BG }}>
      <div className="flex items-center justify-between">
        <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{label}</span>
        <span className="text-[22px] leading-none font-extrabold" style={{ color: TEXT_PRIMARY }}>
          {numerator}
          <span className="text-[13px] font-bold">/{denominator}</span>
        </span>
      </div>

      {/* Track + fill + the amber dot the reference pins to the far end */}
      <div className="relative w-full h-[5px] rounded-full mt-3" style={{ background: PROGRESS_TRACK }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: PROGRESS_FILL, width: `${fillPercent}%` }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full"
          style={{ background: PROGRESS_FILL }}
        />
      </div>

      <div className="flex items-center space-x-3 mt-4">
        <span className="flex-1 h-px" style={{ background: '#C9C4F0' }} />
        <span className="text-[13px] font-bold" style={{ color: '#5A4BDA' }}>{dividerLabel}</span>
        <span className="flex-1 h-px" style={{ background: '#C9C4F0' }} />
      </div>

      <div className="grid grid-cols-2 text-center mt-3">
        <div className="border-r" style={{ borderColor: '#C9C4F0' }}>
          <div className="text-[22px] leading-none font-extrabold" style={{ color: FIGURE }}>
            {leftValue}
          </div>
          <div className="text-[13px] mt-2" style={{ color: TEXT_PRIMARY }}>{leftLabel}</div>
        </div>
        <div>
          <div className="text-[22px] leading-none font-extrabold" style={{ color: FIGURE }}>
            {rightValue}
          </div>
          <div className="text-[13px] mt-2" style={{ color: TEXT_PRIMARY }}>{rightLabel}</div>
        </div>
      </div>
    </div>
  );
};

/** The grey "Subject Details ▶" pill both sections centre under the roll-up. */
export const SubjectDetailsPill: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="mx-auto flex items-center space-x-2 px-4 py-2.5 rounded-lg mt-4"
    style={{ background: '#F1F2F4' }}
  >
    <span className="text-[13px] font-extrabold" style={{ color: TEXT_PRIMARY }}>Subject Details</span>
    <svg width="9" height="11" viewBox="0 0 9 11" aria-hidden="true">
      <path d="M0.5 0.5 L8 5.5 L0.5 10.5 Z" fill={TEXT_PRIMARY} />
    </svg>
  </button>
);
