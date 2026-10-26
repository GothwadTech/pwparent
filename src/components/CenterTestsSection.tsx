/**
 * Test section of the offline dashboard — matched to the reference look.
 *
 * A lavender roll-up (attempted/total, progress bar, and the two "in attempted
 * tests" percentages), a Subject Details pill, then the recent-tests timeline: a
 * purple rail with a dot per test, cards carrying the status pill and, when the
 * result is in, two lavender Score/Rank tiles.
 *
 * A test whose result is not announced yet shows the purple "result has not been
 * announced yet" line and a disabled View Details — never a fabricated score.
 */
import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import type { BatchSummary } from '../hooks/useBatchView';
import type { OfflineTestRow } from './OfflineAttendanceDashboardView';
import {
  ACCENT, CARD_BORDER, FIGURE, PROGRESS_FILL, PROGRESS_TRACK, SUMMARY_BG,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TILE_BG, statusPillClasses,
} from '../lib/uiTheme';

interface CenterTestsSectionProps {
  offlineTests: OfflineTestRow[];
  summary: BatchSummary;
  onViewAllTests: () => void;
  onOpenTest: (testId: string) => void;
  onOpenSubjectDetails: () => void;
}

export const CenterTestsSection: React.FC<CenterTestsSectionProps> = ({
  offlineTests, summary, onViewAllTests, onOpenTest, onOpenSubjectDetails,
}) => {
  const fillPercent = summary.testsTotal > 0
    ? Math.round((summary.testsAttempted / summary.testsTotal) * 100)
    : 0;

  return (
    <section className="px-3 pt-3 space-y-3">
      <div className="flex items-center space-x-2">
        <span className="text-[15px] leading-none">📑</span>
        <h2 className="text-[14px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
          Test
        </h2>
      </div>

      {/* Lavender roll-up */}
      <div className="rounded-2xl p-3.5 space-y-3" style={{ background: SUMMARY_BG }}>
        <div className="flex items-center justify-between">
          <span className="text-[12px]" style={{ color: TEXT_PRIMARY }}>Total Tests Attempted</span>
          <span className="text-[15px] font-extrabold" style={{ color: TEXT_PRIMARY }}>
            {summary.testsAttempted}
            <span className="text-[12px] font-bold">/{summary.testsTotal}</span>
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
          <span className="text-[12px] font-bold" style={{ color: ACCENT }}>In Attempted Tests</span>
          <span className="flex-1 h-px" style={{ background: '#C9C4F0' }} />
        </div>

        <div className="grid grid-cols-2 text-center">
          <div className="border-r" style={{ borderColor: '#C9C4F0' }}>
            <div className="text-[20px] font-extrabold" style={{ color: FIGURE }}>
              {summary.avgScorePercent || '0%'}
            </div>
            <div className="text-[12px] mt-1" style={{ color: TEXT_PRIMARY }}>Avg. Score</div>
          </div>
          <div>
            <div className="text-[20px] font-extrabold" style={{ color: FIGURE }}>
              {summary.avgAccuracyPercent || '0%'}
            </div>
            <div className="text-[12px] mt-1" style={{ color: TEXT_PRIMARY }}>Accuracy</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenSubjectDetails}
        className="mx-auto flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-[#F1F2F4]"
      >
        <span className="text-[12px] font-extrabold" style={{ color: TEXT_PRIMARY }}>Subject Details</span>
        <Play size={11} fill={TEXT_PRIMARY} style={{ color: TEXT_PRIMARY }} />
      </button>

      {/* Recent tests timeline */}
      <div className="space-y-2 pt-2">
        <h3 className="text-[13px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
          Recent Tests
        </h3>

        <div className="relative pl-5">
          <span className="absolute left-[5px] top-2 bottom-2 w-[8px]" style={{ background: ACCENT }} />
          <div className="space-y-3">
            {offlineTests.map((t) => {
              const awaiting = t.status === 'RESULT_AWAITING';
              const pill = statusPillClasses(t.status);
              return (
                <div key={t.id} className="relative">
                  <span
                    className="absolute -left-5 top-6 w-3 h-3 rounded-full"
                    style={{ background: ACCENT }}
                  />
                  <div className="bg-white border rounded-xl p-3" style={{ borderColor: CARD_BORDER }}>
                    <div className="flex items-start justify-between">
                      <span className="text-[13px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
                        {t.name}
                      </span>
                      <span
                        className="text-[10px] font-extrabold tracking-wide px-2.5 py-1.5 rounded-md"
                        style={{ background: pill.bg, color: pill.text }}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mt-1.5 text-[12px]" style={{ color: TEXT_SECONDARY }}>
                      <span>{t.date}</span>
                      <span>•</span>
                      <span>{t.mode}</span>
                    </div>

                    {awaiting ? (
                      <p className="text-[12px] mt-2" style={{ color: FIGURE }}>
                        Result has not been announced yet
                      </p>
                    ) : t.status === 'ATTEMPTED' ? (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="rounded-lg px-2.5 py-2.5" style={{ background: TILE_BG }}>
                          <div className="text-[11px] font-semibold" style={{ color: TEXT_PRIMARY }}>Score</div>
                          <div className="text-[13px] font-extrabold" style={{ color: FIGURE }}>
                            {t.marks}
                            {t.scorePercent && (
                              <span className="text-[11px] font-bold ml-2" style={{ color: TEXT_PRIMARY }}>
                                {t.scorePercent}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="rounded-lg px-2.5 py-2.5" style={{ background: TILE_BG }}>
                          <div className="text-[11px] font-semibold" style={{ color: TEXT_PRIMARY }}>Rank</div>
                          <div className="text-[13px] font-extrabold" style={{ color: FIGURE }}>
                            {t.rank || '—'}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {t.status === 'ATTEMPTED' && (
                      <button
                        type="button"
                        onClick={() => onOpenTest(t.id)}
                        className="w-full flex items-center justify-center space-x-2 mt-2 py-1"
                      >
                        <span className="text-[12px]" style={{ color: TEXT_PRIMARY }}>View Details</span>
                        <Play size={10} fill={TEXT_PRIMARY} style={{ color: TEXT_PRIMARY }} />
                      </button>
                    )}
                    {awaiting && (
                      <div className="w-full flex items-center justify-center space-x-2 mt-2 py-1 opacity-40">
                        <span className="text-[12px]" style={{ color: TEXT_TERTIARY }}>View Details</span>
                        <Play size={10} fill={TEXT_TERTIARY} style={{ color: TEXT_TERTIARY }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAllTests}
          className="w-full py-3 rounded-xl flex items-center justify-center space-x-3"
          style={{ background: '#E4E9F8' }}
        >
          <span className="text-[12px] font-extrabold" style={{ color: TEXT_PRIMARY }}>View All Tests</span>
          <span
            className="w-6 h-6 rounded-full border flex items-center justify-center"
            style={{ borderColor: TEXT_PRIMARY }}
          >
            <ArrowRight size={12} style={{ color: TEXT_PRIMARY }} />
          </span>
        </button>
      </div>
    </section>
  );
};
