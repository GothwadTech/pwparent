import React, { useState } from 'react';
import { StudentProfile, MainTabId, BatchOption, AnnouncementItem } from '../types';
import type { AllTestsRow } from './AllTestsModal';
import type { CalendarDay, OfflineTestRow } from './OfflineAttendanceDashboardView';
import type { SubjectProgress } from './SubjectDetailsModal';
import type { BatchSummary } from '../hooks/useBatchView';
import { MainTopBar } from './MainTopBar';
import { AppBottomNav } from './AppBottomNav';
import { StudentDashboardView } from './StudentDashboardView';
import { OfflineAttendanceDashboardView } from './OfflineAttendanceDashboardView';
import { AnnouncementsView } from './AnnouncementsView';
import { SupportHelpCentreView } from './SupportHelpCentreView';
import { BatchSelectModal } from './BatchSelectModal';
import { SubjectDetailsModal } from './SubjectDetailsModal';
import { AllTestsModal } from './AllTestsModal';

/**
 * Rendered only when no `batches` prop is supplied at all — i.e. a call site
 * that has not been wired yet. A configured build always passes the real list,
 * and an EMPTY real list shows the "no batch allotted" state below instead.
 * That distinction matters: falling back to sample batches when the parent has
 * genuinely been allotted to none would be exactly the invented-data behaviour
 * this app is built to avoid.
 */
const FALLBACK_BATCHES: BatchOption[] = [
  { id: 'mission-30', name: 'MISSION 30 NEET 2026', batchType: 'online' },
  { id: 'lakshya-jee', name: 'Lakshya JEE Mains 2.0', batchType: 'offline' },
  { id: 'neet-mindmap', name: 'NEET Mind Map 2025', batchType: 'online' },
  { id: 'vidyapeeth-neet', name: 'Vidyapeeth NEET 2026', batchType: 'offline' },
];

interface ChildDashboardScreenProps {
  student: StudentProfile;
  onBack: () => void;
  onOpenProfile: () => void;
  customLogoUrl?: string | null;
  onOpenLogoCustomizer: () => void;
  /**
   * Optional announcement feed from the Backend facade. When omitted,
   * AnnouncementsView renders its own built-in demo list.
   */
  announcements?: AnnouncementItem[];

  /**
   * The batches this student is actually allotted to, from
   * `batches/{id}/members/{parentUid}`. Arrives asynchronously, which is why the
   * selected batch is derived rather than held in initial state.
   */
  batches?: BatchOption[];
  /** Controlled selection — App.tsx owns it so switching students keeps sense. */
  selectedBatchId?: string | null;
  onSelectBatch?: (batch: BatchOption) => void;

  /** Real data for the selected batch, all optional and all shape-matched. */
  calendarDays?: CalendarDay[];
  offlineTests?: OfflineTestRow[];
  allTests?: AllTestsRow[];
  subjects?: SubjectProgress[];
  /** Attempted/total, best score and attendance — all derived, never typed. */
  summary?: BatchSummary;
}

export const ChildDashboardScreen: React.FC<ChildDashboardScreenProps> = ({
  student,
  onBack,
  onOpenProfile,
  customLogoUrl,
  onOpenLogoCustomizer,
  announcements,
  batches,
  selectedBatchId,
  onSelectBatch,
  calendarDays,
  offlineTests,
  allTests,
  subjects,
  summary,
}) => {
  const [activeTab, setActiveTab] = useState<MainTabId>('dashboard');
  const [localBatchId, setLocalBatchId] = useState<string | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Subject details bottom sheet
  const [subjectDetailsArea, setSubjectDetailsArea] = useState<'lectures' | 'dpp' | 'tests' | null>(null);

  // All tests bottom sheet
  const [isAllTestsOpen, setIsAllTestsOpen] = useState(false);

  const batchOptions = batches ?? FALLBACK_BATCHES;

  /**
   * Selection is derived, not stored: `batches` arrives after first render, so
   * `useState(batchOptions[0])` would freeze on the wrong (or absent) batch.
   * Parent-controlled id wins, then this component's own pick, then the first.
   */
  const selectedBatch =
    batchOptions.find((b) => b.id === (selectedBatchId ?? localBatchId)) ?? batchOptions[0] ?? null;

  const chooseBatch = (batch: BatchOption) => {
    setLocalBatchId(batch.id);
    onSelectBatch?.(batch);
  };

  return (
    <div className="relative w-full h-full bg-[#090a10] text-white flex flex-col overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Main Top Bar (Fixed at top, never scrolls) */}
      <header className="shrink-0 z-30 w-full bg-[#0e0f16] border-b border-[#1c1d29]/50">
        <MainTopBar
          selectedBatchName={selectedBatch?.name ?? 'No batch'}
          onOpenBatchSelector={() => setIsBatchModalOpen(true)}
          activeStudent={student}
          onOpenProfile={onOpenProfile}
        />
      </header>

      {/* 2. Main Content View according to active bottom tab - flex-1 min-h-0 container */}
      <main className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
        {!selectedBatch ? (
          /* Real, empty state. Reaches here only when `batches` was supplied and
             came back empty — this student is not in any batch yet. */
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <p className="text-base font-bold mb-2">No batch allotted yet</p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {student.name || 'This student'} has not been added to any batch. Attendance, tests and marks all come
              from the batch, so there is nothing to show until an administrator allots one.
            </p>
          </div>
        ) : activeTab === 'dashboard' ? (
          selectedBatch.batchType === 'offline' ? (
            <OfflineAttendanceDashboardView
              student={student}
              batchName={selectedBatch.name}
              onOpenSubjectDetails={(area) => setSubjectDetailsArea(area)}
              onViewAllTests={() => setIsAllTestsOpen(true)}
              calendarDays={calendarDays}
              offlineTests={offlineTests}
              summary={summary}
            />
          ) : (
            <StudentDashboardView
              student={student}
              batchName={selectedBatch.name}
              onOpenSubjectDetails={(area) => setSubjectDetailsArea(area)}
              onViewAllTests={() => setIsAllTestsOpen(true)}
            />
          )
        ) : activeTab === 'announcements' ? (
          <AnnouncementsView customLogoUrl={customLogoUrl} items={announcements} />
        ) : (
          <SupportHelpCentreView
            onContactUs={() => {
              alert('Physics Wallah Support Ticket has been initiated for ' + selectedBatch.name);
            }}
          />
        )}
      </main>

      {/* 3. Bottom 3-tab navigation bar (Fixed at bottom, never scrolls) */}
      <footer className="shrink-0 z-30 w-full bg-[#0d0e15] border-t border-[#1a1c2a]">
        <AppBottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
        />
      </footer>

      {/* 4. Batch Select Modal matching Screenshot_20260918_181001.jpg */}
      <BatchSelectModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        options={batchOptions}
        selectedBatchId={selectedBatch?.id ?? ''}
        onSelectBatch={chooseBatch}
      />

      {/* 5. Subject Details Modal for Lectures / DPP / Tests */}
      <SubjectDetailsModal
        isOpen={subjectDetailsArea !== null}
        onClose={() => setSubjectDetailsArea(null)}
        area={subjectDetailsArea || 'lectures'}
        batchName={selectedBatch?.name ?? ''}
        subjects={subjects}
      />

      {/* 6. All Tests View Modal */}
      <AllTestsModal
        isOpen={isAllTestsOpen}
        onClose={() => setIsAllTestsOpen(false)}
        batchName={selectedBatch?.name ?? ''}
        tests={allTests}
      />
    </div>
  );
};
