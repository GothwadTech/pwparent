/**
 * All Tests — a full screen, matched to the reference.
 *
 * Header with a back chevron, an Objective/Subjective segmented control whose
 * active half is charcoal, the first-attempt note, then one white card per test
 * carrying its status pill and, when the result is in, lavender Score/Rank tiles
 * and a View Details row.
 *
 * The empty state is the reference's own: a neutral inset panel with the scroll
 * illustration and "No tests found". No sample rows are ever injected.
 */
import React, { useState } from 'react';
import { ChevronLeft, Play } from 'lucide-react';
import type { OfflineTestRow } from './OfflineAttendanceDashboardView';
import { NoTestsIllustration } from './illustrations/NoTestsIllustration';
import {
  CARD_BORDER, FIGURE, HEADER_BG, INSET_BG, SEGMENT_ACTIVE, TEXT_PRIMARY,
  TEXT_SECONDARY, TILE_BG, statusPillClasses,
} from '../lib/uiTheme';

interface AllTestsScreenProps {
  tests: OfflineTestRow[];
  onBack: () => void;
  onOpenTest: (testId: string) => void;
}

export const AllTestsScreen: React.FC<AllTestsScreenProps> = ({ tests, onBack, onOpenTest }) => {
  const [tab, setTab] = useState<'Objective' | 'Subjective'>('Objective');
  const rows = tests.filter((t) => t.paperType === tab);

  return (
    <div className="w-full h-full flex flex-col select-none font-['Plus_Jakarta_Sans',sans-serif]" style={{ background: '#F4F5F7' }}>
      <header className="shrink-0 px-4 pt-4 pb-4 flex items-center space-x-4" style={{ background: HEADER_BG }}>
        <button type="button" onClick={onBack} aria-label="Back" className="p-1">
          <ChevronLeft size={26} strokeWidth={2.6} style={{ color: TEXT_PRIMARY }} />
        </button>
        <h1 className="text-[21px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
          All Tests
        </h1>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-8 space-y-4">
        {/* Objective / Subjective */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white border" style={{ borderColor: CARD_BORDER }}>
          {(['Objective', 'Subjective'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="py-3.5 rounded-lg text-[15px] font-bold transition-colors"
              style={
                tab === t
                  ? { background: SEGMENT_ACTIVE, color: '#FFFFFF' }
                  : { color: TEXT_SECONDARY }
              }
            >
              {t}
            </button>
          ))}
        </div>

        <p className="text-[14px]" style={{ color: TEXT_PRIMARY }}>
          *Results are shown on the basis of First Attempt.
        </p>

        {rows.length === 0 ? (
          <div className="rounded-xl px-6 py-12 flex flex-col items-center" style={{ background: INSET_BG }}>
            <NoTestsIllustration />
            <p className="text-[16px] mt-6" style={{ color: TEXT_PRIMARY }}>No tests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((t) => {
              const pill = statusPillClasses(t.status);
              return (
                <div key={t.id} className="bg-white border rounded-xl p-4" style={{ borderColor: CARD_BORDER }}>
                  <div className="flex items-start justify-between">
                    <span className="text-[18px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
                      {t.name}
                    </span>
                    <span
                      className="text-[11px] font-extrabold tracking-wide px-2.5 py-1.5 rounded-md"
                      style={{ background: pill.bg, color: pill.text }}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mt-1 text-[14px]" style={{ color: TEXT_SECONDARY }}>
                    <span>{t.date}</span>
                    <span>•</span>
                    <span>{t.mode}</span>
                  </div>

                  {t.status === 'ATTEMPTED' && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="rounded-lg px-3 py-2.5" style={{ background: TILE_BG }}>
                        <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>Score</div>
                        <div className="text-[18px] font-extrabold" style={{ color: FIGURE }}>
                          {t.marks}
                          {t.scorePercent && (
                            <span className="text-[13px] font-bold ml-2" style={{ color: TEXT_PRIMARY }}>
                              {t.scorePercent}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-lg px-3 py-2.5" style={{ background: TILE_BG }}>
                        <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>Rank</div>
                        <div className="text-[18px] font-extrabold" style={{ color: FIGURE }}>{t.rank || '—'}</div>
                      </div>
                    </div>
                  )}

                  {t.status === 'RESULT_AWAITING' && (
                    <p className="text-[14px] mt-3" style={{ color: FIGURE }}>
                      Result has not been announced yet
                    </p>
                  )}

                  {t.status === 'ATTEMPTED' && (
                    <button
                      type="button"
                      onClick={() => onOpenTest(t.id)}
                      className="w-full flex items-center justify-center space-x-2 mt-3 py-1"
                    >
                      <span className="text-[15px]" style={{ color: TEXT_PRIMARY }}>View Details</span>
                      <Play size={11} fill={TEXT_PRIMARY} style={{ color: TEXT_PRIMARY }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
