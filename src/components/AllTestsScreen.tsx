/**
 * All Tests — a full screen, measured off the reference.
 *
 * Header (22px back chevron + 17px extrabold title) over the neutral band, then
 * the Objective/Subjective segmented control: white bordered shell, active half
 * filled charcoal with white bold text. Under it the reference's own note line
 * ("*Results are shown on the basis of First Attempt."), then one white card per
 * test — title + status pill, date • mode, lavender Score/Rank tiles when the
 * result is in, the indigo notice line while it is not, and a centred View
 * Details row.
 *
 * The empty state is the reference's: a neutral inset panel with the scroll
 * illustration and "No tests found". No sample rows are ever injected.
 */
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { OfflineTestRow } from './OfflineAttendanceDashboardView';
import { NoTestsIllustration } from './illustrations/NoTestsIllustration';
import { ResultAwaitingLine, StatusPill, TestDateRow, TestScoreTiles, ViewDetailsRow } from './testCards';
import {
  CARD_BORDER, HEADER_BG, SECTION_BAND, SEGMENT_ACTIVE, TEXT_PRIMARY,
  TEXT_SECONDARY,
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
      <header className="shrink-0 px-4 pt-4 pb-3.5 flex items-center space-x-4" style={{ background: HEADER_BG }}>
        <button type="button" onClick={onBack} aria-label="Back" className="p-1 -ml-1">
          <ChevronLeft size={22} strokeWidth={2.6} style={{ color: TEXT_PRIMARY }} />
        </button>
        <h1 className="text-[17px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
          All Tests
        </h1>
      </header>
      <div className="shrink-0 h-3 w-full" style={{ background: SECTION_BAND }} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-8">
        {/* Objective / Subjective */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white border" style={{ borderColor: CARD_BORDER }}>
          {(['Objective', 'Subjective'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="py-3 rounded-lg text-[14px] font-bold transition-colors"
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

        {rows.length > 0 && (
          <p className="text-[12px] mt-3" style={{ color: TEXT_PRIMARY }}>
            *Results are shown on the basis of First Attempt.
          </p>
        )}

        {rows.length === 0 ? (
          <div className="rounded-xl px-4 py-12 mt-4 flex flex-col items-center" style={{ background: '#E9EBEE' }}>
            <NoTestsIllustration />
            <p className="text-[13px] mt-6" style={{ color: TEXT_PRIMARY }}>No tests found</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {rows.map((t) => (
              <div key={t.id} className="bg-white border rounded-xl px-4 py-3.5" style={{ borderColor: CARD_BORDER }}>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
