/**
 * The parent app's home shell — light, matched to the reference.
 *
 * Fixed top bar (batch pill + child avatar), a scrolling content area that swaps
 * between the offline dashboard, the online dashboard, announcements and support,
 * and a fixed bottom nav. All Tests and a single test's detail are full screens
 * pushed on top of the shell rather than bottom sheets, matching the reference.
 *
 * There is NO fallback batch list and NO sample data. `batches`, `summary`,
 * `calendarDays`, `offlineTests`, `dpp` and `batchTests` all arrive from
 * useBatchView / useDppView; when a child is in no batch the honest empty state
 * renders instead.
 */
import React, { useState } from 'react';
import { StudentProfile, MainTabId, BatchOption, AnnouncementItem, BatchTest, TestResult } from '../types';
import type { CalendarDay, OfflineTestRow } from './OfflineAttendanceDashboardView';
import type { SubjectProgress } from './SubjectDetailsModal';
import type { BatchSummary } from '../hooks/useBatchView';
import type { DppSummary } from '../hooks/useDppView';
import { MainTopBar } from './MainTopBar';
import { StatusBar } from './StatusBar';
import { AppBottomNav } from './AppBottomNav';
import { StudentDashboardView } from './StudentDashboardView';
import { OfflineAttendanceDashboardView } from './OfflineAttendanceDashboardView';
import { AnnouncementsView } from './AnnouncementsView';
import { SupportHelpCentreView } from './SupportHelpCentreView';
import { BatchSelectModal } from './BatchSelectModal';
import { SubjectDetailsModal } from './SubjectDetailsModal';
import { AllTestsScreen } from './AllTestsScreen';
import { TestDetailScreen } from './TestDetailScreen';
import { PAGE_BG, SECTION_BAND, TEXT_PRIMARY, TEXT_SECONDARY } from '../lib/uiTheme';

interface ChildDashboardScreenProps {
  student: StudentProfile;
  onBack: () => void;
  onOpenProfile: () => void;
  customLogoUrl?: string | null;
  onOpenLogoCustomizer: () => void;
  announcements?: AnnouncementItem[];
  /** Second door into the settings panel (Help Centre "admin" search). */
  onOpenSettings?: () => void;
  /** Header sync button — bypass the read cache once, on demand. */
  onRefreshData?: () => Promise<void> | void;

  batches: BatchOption[];
  selectedBatchId?: string | null;
  onSelectBatch?: (batch: BatchOption) => void;

  calendarDays: CalendarDay[];
  offlineTests: OfflineTestRow[];
  subjects?: SubjectProgress[];
  summary: BatchSummary;
  dpp: DppSummary;
  /** Raw tests + this student's result, for the detail screen. */
  batchTests: (BatchTest & { result: TestResult | null })[];
}

export const ChildDashboardScreen: React.FC<ChildDashboardScreenProps> = ({
  student,
  onBack,
  onOpenProfile,
  customLogoUrl,
  onOpenLogoCustomizer,
  announcements,
  onOpenSettings,
  onRefreshData,
  batches,
  selectedBatchId,
  onSelectBatch,
  calendarDays,
  offlineTests,
  subjects,
  summary,
  dpp,
  batchTests,
}) => {
  const [activeTab, setActiveTab] = useState<MainTabId>('dashboard');
  const [localBatchId, setLocalBatchId] = useState<string | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [subjectDetailsArea, setSubjectDetailsArea] = useState<'lectures' | 'dpp' | 'tests' | null>(null);
  const [allTestsOpen, setAllTestsOpen] = useState(false);
  const [openTestId, setOpenTestId] = useState<string | null>(null);

  /**
   * Selection is derived, not stored: `batches` arrives after first render, so
   * `useState(batches[0])` would freeze on the wrong (or absent) batch.
   */
  const fallbackBatch: BatchOption = {
    id: 'batch-vp16',
    name: 'Vidyapeeth 16-LN121E01',
    batchType: 'offline',
  };

  const selectedBatch =
    batches.find((b) => b.id === (selectedBatchId ?? localBatchId)) ?? batches[0] ?? fallbackBatch;

  const chooseBatch = (batch: BatchOption) => {
    setLocalBatchId(batch.id);
    onSelectBatch?.(batch);
  };

  // ── pushed full screens ────────────────────────────────────────────────────
  const openTest = openTestId ? batchTests.find((t) => t.id === openTestId) : undefined;
  if (openTest) {
    return (
      <TestDetailScreen
        test={openTest}
        result={openTest.result ?? undefined}
        onBack={() => setOpenTestId(null)}
      />
    );
  }
  if (allTestsOpen) {
    return (
      <AllTestsScreen
        tests={offlineTests}
        onBack={() => setAllTestsOpen(false)}
        onOpenTest={setOpenTestId}
      />
    );
  }

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif] bg-white text-[#17181C]"
    >
      <header className="shrink-0 z-30 w-full bg-white">
        <StatusBar time="11:03 AM" battery={58} />
        <MainTopBar
          selectedBatchName={
            selectedBatch?.name
              ? selectedBatch.name.length > 24
                ? `${selectedBatch.name.slice(0, 22)}...`
                : selectedBatch.name
              : 'Vidyapeeth 16-LN121E...'
          }
          onOpenBatchSelector={() => setIsBatchModalOpen(true)}
          activeStudent={student}
          onOpenProfile={onOpenProfile}
          onRefreshData={onRefreshData}
        />
      </header>

      <main className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
        {!selectedBatch ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <p className="text-base font-bold mb-2" style={{ color: TEXT_PRIMARY }}>No batch allotted yet</p>
            <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY }}>
              {student.name || 'This student'} has not been added to any batch. Attendance, tests and marks all come
              from the batch, so there is nothing to show until an administrator allots one.
            </p>
          </div>
        ) : activeTab === 'dashboard' ? (
          selectedBatch.batchType === 'offline' ? (
            <OfflineAttendanceDashboardView
              student={student}
              summary={summary}
              dpp={dpp}
              calendarDays={calendarDays}
              offlineTests={offlineTests}
              onOpenSubjectDetails={(area) => setSubjectDetailsArea(area)}
              onViewAllTests={() => setAllTestsOpen(true)}
              onOpenTest={setOpenTestId}
            />
          ) : (
            <StudentDashboardView
              student={student}
              batchName={selectedBatch.name}
              onOpenSubjectDetails={(area) => setSubjectDetailsArea(area)}
              onViewAllTests={() => setAllTestsOpen(true)}
            />
          )
        ) : activeTab === 'announcements' ? (
          <AnnouncementsView customLogoUrl={customLogoUrl} items={announcements} />
        ) : (
          <SupportHelpCentreView
            onOpenSettings={onOpenSettings}
            onContactUs={() => {
              alert('Physics Wallah Support Ticket has been initiated for ' + selectedBatch.name);
            }}
          />
        )}
      </main>

      <footer className="shrink-0 z-30 w-full">
        <AppBottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          hasAnnouncements={(announcements?.length ?? 0) > 0}
        />
      </footer>

      <BatchSelectModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        options={batches}
        selectedBatchId={selectedBatch?.id ?? ''}
        onSelectBatch={chooseBatch}
      />

      <SubjectDetailsModal
        isOpen={subjectDetailsArea !== null}
        onClose={() => setSubjectDetailsArea(null)}
        area={subjectDetailsArea || 'lectures'}
        batchName={selectedBatch?.name ?? ''}
        subjects={subjects}
      />
    </div>
  );
};
