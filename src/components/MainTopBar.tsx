/**
 * Top bar of the parent app — light, matched to the reference PW Parent app.
 *
 * Left: the batch selector as a soft grey pill (opens the batch picker).
 * Right: the child's avatar with their name beneath (opens the profile).
 */
import React, { useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { StudentAvatar } from './StudentAvatar';
import { StudentProfile } from '../types';

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
    <div className="w-full px-4 pt-2.5 pb-2 flex items-center justify-between z-30 select-none bg-white">
      {/* Batch dropdown selector — soft flat grey pill without dark border */}
      <button
        type="button"
        onClick={onOpenBatchSelector}
        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#F1F3F6] max-w-[245px] hover:bg-[#E5E7EB] active:scale-98 transition-all"
        title="Select Batch"
      >
        <span className="text-[12.5px] font-medium text-[#1F2937] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
          {selectedBatchName}
        </span>
        <ChevronDown size={14} className="text-[#6B7280] shrink-0 ml-1" />
      </button>

      {/* Sync + student avatar + name */}
      <div className="flex items-center space-x-1">
        {onRefreshData && (
          <button
            type="button"
            onClick={() => void runSync()}
            aria-label="Refresh data"
            title="Sync now"
            className="w-4 h-4 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#4F46E5] active:scale-95 transition-all opacity-0 hover:opacity-100"
          >
            <RefreshCw
              size={12}
              className={syncing ? 'animate-spin' : ''}
              style={{ color: syncing ? '#4F46E5' : undefined }}
            />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center focus:outline-none cursor-pointer group active:scale-95 transition-transform"
          title="Open Profile"
        >
          <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center bg-[#FDE8E8] border border-[#FECACA]">
            <StudentAvatar type="boy" size={28} />
          </div>
          <span className="text-[10px] font-medium text-[#6B7280] mt-0.5 tracking-tight leading-none max-w-[65px] truncate">
            {activeStudent.name || 'No Name'}
          </span>
        </button>
      </div>
    </div>
  );
};
