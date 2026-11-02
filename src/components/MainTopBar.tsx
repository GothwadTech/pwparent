/**
 * Top bar of the parent app — light, matched to the reference PW Parent app.
 *
 * Left: the batch selector as a soft grey pill (opens the batch picker).
 * Right: the child's avatar with their name beneath (opens the profile).
 *
 * The circular sync button that used to sit left of the avatar is GONE on the
 * owner's instruction — the header is now just selector + profile, and a touch
 * shorter (pt-2/pb-2) so more of the dashboard fits above the fold.
 */
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { StudentAvatar } from './StudentAvatar';
import { StudentProfile } from '../types';

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
    <div className="w-full px-4 pt-2 pb-2 flex items-center justify-between z-30 select-none bg-white">
      {/* Batch dropdown selector — white pill with hairline border, as in the reference */}
      <button
        type="button"
        onClick={onOpenBatchSelector}
        className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-white border border-[#E2E5EA] max-w-[245px] hover:bg-[#F7F8FA] active:scale-98 transition-all"
        title="Select Batch"
      >
        <span className="text-[14px] font-medium text-[#1F2937] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
          {selectedBatchName}
        </span>
        <ChevronDown size={16} className="text-[#3F4650] shrink-0 ml-1" strokeWidth={2} />
      </button>

      {/* Student avatar + name */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center focus:outline-none cursor-pointer group active:scale-95 transition-transform"
          title="Open Profile"
        >
          <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center bg-[#FDE8E8]">
            <StudentAvatar type="boy" size={34} />
          </div>
          <span className="text-[12px] font-medium text-[#1F2937] mt-1 tracking-tight leading-none max-w-[80px] truncate">
            {activeStudent.name || 'No Name'}
          </span>
        </button>
      </div>
    </div>
  );
};
