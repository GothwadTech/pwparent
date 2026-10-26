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
      className="w-full px-4 pt-3 pb-3 flex items-center justify-between z-30 select-none"
      style={{ background: HEADER_BG }}
    >
      {/* Batch dropdown pill selector */}
      <button
        type="button"
        onClick={onOpenBatchSelector}
        className="flex items-center space-x-2.5 px-4 py-3 rounded-lg bg-white border max-w-[220px]"
        style={{ borderColor: CARD_BORDER }}
        title="Select Batch"
      >
        <span className="text-[14px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>
          {selectedBatchName}
        </span>
        <ChevronDown size={16} style={{ color: TEXT_PRIMARY }} className="shrink-0" />
      </button>

      {/* Sync (left of the avatar) + student avatar + name */}
      <div className="flex items-center space-x-3">
        {onRefreshData && (
          <button
            type="button"
            onClick={() => void runSync()}
            aria-label="Refresh data"
            title="Sync now — cache bypass karke Firestore se ek baar padho"
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            <RefreshCw
              size={17}
              className={syncing ? 'animate-spin' : ''}
              style={{ color: syncing ? '#5747D6' : TEXT_SECONDARY }}
            />
          </button>
        )}
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex flex-col items-center focus:outline-none"
        title="Open Profile"
      >
        <div
          className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-white border"
          style={{ borderColor: CARD_BORDER }}
        >
          <StudentAvatar type="boy" size={30} />
        </div>
        <span className="text-[12px] mt-1" style={{ color: TEXT_PRIMARY }}>
          {activeStudent.name || 'No Name'}
        </span>
      </button>
      </div>
    </div>
  );
};
