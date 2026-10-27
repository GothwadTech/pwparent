/**
 * Top bar of the parent app — light, matched to the reference.
 *
 * Left: the batch selector as a bordered white pill with a chevron (it opens the
 * batch picker; the batch is always chosen, never typed). Right: the child's
 * avatar with their name beneath, opening the profile.
 */
import React, { useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { StudentAvatar } from './StudentAvatar';
import { StudentProfile } from '../types';
import { CARD_BORDER, HEADER_BG, TEXT_PRIMARY, TEXT_SECONDARY } from '../lib/uiTheme';

interface MainTopBarProps {
  selectedBatchName: string;
  onOpenBatchSelector: () => void;
  activeStudent: StudentProfile;
  onOpenProfile: () => void;
  /** The circular sync button: bypass the cache and re-read everything once. */
  onRefreshData?: () => Promise<void> | void;
}

export const MainTopBar: React.FC<MainTopBarProps> = ({
  selectedBatchName,
  onOpenBatchSelector,
  activeStudent,
  onOpenProfile,
  onRefreshData,
}) => {
  const [syncing, setSyncing] = useState(false);

  const runSync = async () => {
    if (syncing || !onRefreshData) return;
    setSyncing(true);
    try {
      await onRefreshData();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className="w-full px-4 pt-1.5 pb-2.5 flex items-center justify-between z-30 select-none bg-white"
    >
      {/* Batch dropdown selector */}
      <button
        type="button"
        onClick={onOpenBatchSelector}
        className="flex items-center justify-between space-x-2 px-3.5 py-2.5 rounded-lg bg-white border border-[#E5E7EB] max-w-[245px] hover:bg-neutral-50 active:scale-98 transition-all shadow-2xs"
        title="Select Batch"
      >
        <span className="text-[14px] font-medium text-[#17181C] truncate tracking-tight">
          {selectedBatchName}
        </span>
        <ChevronDown size={17} className="text-[#374151] shrink-0 ml-1" />
      </button>

      {/* Sync (left of avatar) + student avatar + name */}
      <div className="flex items-center space-x-1.5">
        {onRefreshData && (
          <button
            type="button"
            onClick={() => void runSync()}
            aria-label="Refresh data"
            title="Sync now"
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#5345E6] active:scale-95 transition-all opacity-40 hover:opacity-100"
          >
            <RefreshCw
              size={13}
              className={syncing ? 'animate-spin' : ''}
              style={{ color: syncing ? '#5345E6' : undefined }}
            />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center focus:outline-none cursor-pointer group active:scale-95 transition-transform"
          title="Open Profile"
        >
          <div className="h-[38px] w-[38px] rounded-full overflow-hidden flex items-center justify-center bg-[#BAE6FD]">
            <StudentAvatar type="boy" size={38} />
          </div>
          <span className="text-[12px] font-medium text-[#17181C] mt-0.5 tracking-tight">
            {activeStudent.name || 'No Name'}
          </span>
        </button>
      </div>
    </div>
  );
};
