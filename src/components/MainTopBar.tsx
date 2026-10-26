/**
 * Top bar of the parent app — light, matched to the reference.
 *
 * Left: the batch selector as a bordered white pill with a chevron (it opens the
 * batch picker; the batch is always chosen, never typed). Right: the child's
 * avatar with their name beneath, opening the profile.
 */
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { StudentAvatar } from './StudentAvatar';
import { StudentProfile } from '../types';
import { CARD_BORDER, HEADER_BG, TEXT_PRIMARY, TEXT_SECONDARY } from '../lib/uiTheme';

interface MainTopBarProps {
  selectedBatchName: string;
  onOpenBatchSelector: () => void;
  activeStudent: StudentProfile;
  onOpenProfile: () => void;
}

export const MainTopBar: React.FC<MainTopBarProps> = ({
  selectedBatchName,
  onOpenBatchSelector,
  activeStudent,
  onOpenProfile,
}) => {
  return (
    <div
      className="w-full px-3 pt-3 pb-3 flex items-center justify-between z-30 select-none"
      style={{ background: HEADER_BG }}
    >
      {/* Batch dropdown pill selector */}
      <button
        type="button"
        onClick={onOpenBatchSelector}
        className="flex items-center space-x-2 px-3 py-2.5 rounded-lg bg-white border max-w-[208px]"
        style={{ borderColor: CARD_BORDER }}
        title="Select Batch"
      >
        <span className="text-[10px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>
          {selectedBatchName}
        </span>
        <ChevronDown size={12} style={{ color: TEXT_PRIMARY }} className="shrink-0" />
      </button>

      {/* Student avatar + name */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex flex-col items-center focus:outline-none"
        title="Open Profile"
      >
        <div
          className="h-9 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white border"
          style={{ borderColor: CARD_BORDER }}
        >
          <StudentAvatar type="boy" size={28} />
        </div>
        <span className="text-[9px] mt-1" style={{ color: TEXT_SECONDARY }}>
          {activeStudent.name || 'No Name'}
        </span>
      </button>
    </div>
  );
};
