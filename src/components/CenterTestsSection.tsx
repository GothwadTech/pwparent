/**
 * Test section of the offline dashboard — measured off the reference.
 *
 * 20px paper icon + 16px extrabold "Test", the shared lavender roll-up, the
 * Subject Details pill, then "Recent Tests" as a timeline: a 2px indigo rail
 * with an 8px dot per test, cards indented to the right of it carrying the
 * status pill, the date • mode row, lavender Score/Rank tiles when the result
 * is in, and a centred View Details row.
 *
 * The rail runs from the first dot to the last card, exactly as in the
 * reference. A RESULT_AWAITING test shows the indigo notice line and no tiles;
 * a MISSED test shows nothing but its header — never an invented score.
 */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import {IconTestPaper} from './icons/AppIcons';
import type { BatchSummary } from '../hooks/useBatchView';
import type { OfflineTestRow } from './OfflineAttendanceDashboardView';
import { SummaryRollup, SubjectDetailsPill } from './SummaryRollup';
import { ResultAwaitingLine, StatusPill, TestDateRow, TestScoreTiles, ViewDetailsRow } from './testCards';
import { ACCENT, CARD_BORDER, TEXT_PRIMARY } from '../lib/uiTheme';

interface CenterTestsSectionProps {
  offlineTests: OfflineTestRow[];
  summary: BatchSummary;
  onViewAllTests: () => void;
  onOpenTest: (testId: string) => void;
  onOpenSubjectDetails: () => void;
}

export const CenterTestsSection: React.FC<CenterTestsSectionProps> = ({
  offlineTests, summary, onViewAllTests, onOpenTest, onOpenSubjectDetails,
}) => (
  <section className="px-4 pt-4 pb-6">
    <div className="flex items-center space-x-2">
      <IconTestPaper size={20} />
      <h2 className="text-[16px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
        Test
      </h2>
    </div>

    <div className="mt-3">
      <SummaryRollup
        label="Total Tests Attempted"
        numerator={summary.testsAttempted}
        denominator={summary.testsTotal}
        dividerLabel="In Attempted Tests"
        leftValue={summary.avgScorePercent || '0%'}
        leftLabel="Avg. Score"
        rightValue={summary.avgAccuracyPercent || '0%'}
        rightLabel="Accuracy"
      />
    </div>

    <SubjectDetailsPill onClick={onOpenSubjectDetails} />

    <h3 className="text-[16px] font-extrabold tracking-tight mt-6" style={{ color: TEXT_PRIMARY }}>
      Recent Tests
    </h3>

    {offlineTests.length > 0 && (
      <div className="relative mt-4 ml-1 pl-4">
        {/* The rail: first dot to last card, behind the dots. */}
        <span className="absolute left-0 top-5 bottom-8 w-[2px]" style={{ background: ACCENT }} />
        <div className="space-y-5">
          {offlineTests.map((t) => (
            <div key={t.id} className="relative">
              <span
                className="absolute -left-[4.5px] top-6 w-2 h-2 rounded-full"
                style={{ background: ACCENT }}
              />
              <div className="bg-white border rounded-xl px-4 py-3.5" style={{ borderColor: CARD_BORDER }}>
                <div className="flex items-start justify-between space-x-2">
                  <span className="text-[15px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
                    {t.name}
                  </span>
                  <StatusPill status={t.status} />
                </div>

                <TestDateRow test={t} className="mt-1.5" />

                {t.status === 'RESULT_AWAITING' && <ResultAwaitingLine />}
                {t.status === 'ATTEMPTED' && (
                  <>
                    <TestScoreTiles test={t} />
                    <ViewDetailsRow onClick={() => onOpenTest(t.id)} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    <button
      type="button"
      onClick={onViewAllTests}
      className="w-full py-3.5 rounded-xl flex items-center justify-center space-x-3 mt-6"
      style={{ background: '#E4E9F8' }}
    >
      <span className="text-[15px] font-extrabold" style={{ color: TEXT_PRIMARY }}>View All Tests</span>
      <span
        className="w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center"
        style={{ borderColor: TEXT_PRIMARY }}
      >
        <ArrowRight size={12} style={{ color: TEXT_PRIMARY }} />
      </span>
    </button>
  </section>
);
