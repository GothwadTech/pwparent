import React, { useState } from 'react';
import { StudentProfile, MainTabId, BatchOption, AnnouncementItem } from '../types';
import { MainTopBar } from './MainTopBar';
import { AppBottomNav } from './AppBottomNav';
import { StudentDashboardView } from './StudentDashboardView';
import { OfflineAttendanceDashboardView } from './OfflineAttendanceDashboardView';
import { AnnouncementsView } from './AnnouncementsView';
import { SupportHelpCentreView } from './SupportHelpCentreView';
import { BatchSelectModal } from './BatchSelectModal';
import { SubjectDetailsModal } from './SubjectDetailsModal';
import { AllTestsModal } from './AllTestsModal';

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
}

export const ChildDashboardScreen: React.FC<ChildDashboardScreenProps> = ({
  student,
  onBack,
  onOpenProfile,
  customLogoUrl,
  onOpenLogoCustomizer,
  announcements,
}) => {
  const [activeTab, setActiveTab] = useState<MainTabId>('dashboard');

  const batchOptions: BatchOption[] = [
    { id: 'mission-30', name: 'MISSION 30 NEET 2026', batchType: 'online' },
    { id: 'lakshya-jee', name: 'Lakshya JEE Mains 2.0', batchType: 'offline' },
    { id: 'neet-mindmap', name: 'NEET Mind Map 2025', batchType: 'online' },
    { id: 'vidyapeeth-neet', name: 'Vidyapeeth NEET 2026', batchType: 'offline' },
  ];

  const [selectedBatch, setSelectedBatch] = useState<BatchOption>(batchOptions[0]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Subject details bottom sheet
  const [subjectDetailsArea, setSubjectDetailsArea] = useState<'lectures' | 'dpp' | 'tests' | null>(null);

  // All tests bottom sheet
  const [isAllTestsOpen, setIsAllTestsOpen] = useState(false);

  return (
    <div className="relative w-full h-full bg-[#090a10] text-white flex flex-col overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Main Top Bar (Fixed at top, never scrolls) */}
      <header className="shrink-0 z-30 w-full bg-[#0e0f16] border-b border-[#1c1d29]/50">
        <MainTopBar
          selectedBatchName={selectedBatch.name}
          onOpenBatchSelector={() => setIsBatchModalOpen(true)}
          activeStudent={student}
          onOpenProfile={onOpenProfile}
        />
      </header>

      {/* 2. Main Content View according to active bottom tab - flex-1 min-h-0 container */}
      <main className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'dashboard' && (
          selectedBatch.batchType === 'offline' ? (
            <OfflineAttendanceDashboardView
              student={student}
              batchName={selectedBatch.name}
              onOpenSubjectDetails={(area) => setSubjectDetailsArea(area)}
              onViewAllTests={() => setIsAllTestsOpen(true)}
            />
          ) : (
            <StudentDashboardView
              student={student}
              batchName={selectedBatch.name}
              onOpenSubjectDetails={(area) => setSubjectDetailsArea(area)}
              onViewAllTests={() => setIsAllTestsOpen(true)}
            />
          )
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsView customLogoUrl={customLogoUrl} items={announcements} />
        )}

        {activeTab === 'support' && (
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
        selectedBatchId={selectedBatch.id}
        onSelectBatch={(batch) => setSelectedBatch(batch)}
      />

      {/* 5. Subject Details Modal for Lectures / DPP / Tests */}
      <SubjectDetailsModal
        isOpen={subjectDetailsArea !== null}
        onClose={() => setSubjectDetailsArea(null)}
        area={subjectDetailsArea || 'lectures'}
        batchName={selectedBatch.name}
      />

      {/* 6. All Tests View Modal */}
      <AllTestsModal
        isOpen={isAllTestsOpen}
        onClose={() => setIsAllTestsOpen(false)}
        batchName={selectedBatch.name}
      />
    </div>
  );
};
