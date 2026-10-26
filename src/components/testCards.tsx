/**
 * The pieces a test card is built from — shared by the dashboard timeline and
 * the All Tests screen so the two can never drift apart.
 *
 *   StatusPill       ATTEMPTED / MISSED / RESULT_AWAITING chip
 *   TestScoreTiles   the lavender Score + Rank pair, shown only when attempted
 *   ViewDetailsRow   the centred "View Details ▶" affordance
 *
 * A test whose result is not announced shows the indigo "Result has not been
 * announced yet" line and NO tiles — a placeholder score would be a fabrication.
 */
import React from 'react';
import type { OfflineTestRow } from './OfflineAttendanceDashboardView';
import { FIGURE, TEXT_PRIMARY, TEXT_SECONDARY, TILE_BG, statusPillClasses } from '../lib/uiTheme';

export const StatusPill: React.FC<{ status: OfflineTestRow['status'] }> = ({ status }) => {
  const pill = statusPillClasses(status);
  return (
    <span
      className="text-[10px] font-extrabold tracking-wide px-2.5 py-1.5 rounded-md shrink-0"
      style={{ background: pill.bg, color: pill.text }}
    >
      {status}
    </span>
  );
};

export const TestDateRow: React.FC<{ test: OfflineTestRow; className?: string }> = ({ test, className = '' }) => (
  <div className={`flex items-center space-x-2 text-[13px] ${className}`} style={{ color: TEXT_SECONDARY }}>
    <span>{test.date}</span>
    <span className="text-[10px]">•</span>
    <span>{test.mode}</span>
  </div>
);

export const TestScoreTiles: React.FC<{ test: OfflineTestRow }> = ({ test }) => (
  <div className="grid grid-cols-2 gap-3 mt-3">
    <div className="rounded-lg px-3 py-2.5" style={{ background: TILE_BG }}>
      <div className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>Score</div>
      <div className="mt-0.5 text-[17px] leading-none font-extrabold" style={{ color: FIGURE }}>
        {test.marks || '—'}
        {test.scorePercent && (
          <span className="text-[12px] font-extrabold ml-2" style={{ color: TEXT_PRIMARY }}>
            {test.scorePercent}
          </span>
        )}
      </div>
    </div>
    <div className="rounded-lg px-3 py-2.5" style={{ background: TILE_BG }}>
      <div className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>Rank</div>
      <div className="mt-0.5 text-[17px] leading-none font-extrabold" style={{ color: FIGURE }}>
        {test.rank || '—'}
      </div>
    </div>
  </div>
);

export const ResultAwaitingLine: React.FC = () => (
  <p className="text-[12px] mt-2" style={{ color: '#4433CC' }}>
    Result has not been announced yet
  </p>
);

export const ViewDetailsRow: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center space-x-2 mt-2.5 py-1"
  >
    <span className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>View Details</span>
    <svg width="8" height="10" viewBox="0 0 9 11" aria-hidden="true">
      <path d="M0.5 0.5 L8 5.5 L0.5 10.5 Z" fill={TEXT_PRIMARY} />
    </svg>
  </button>
);
