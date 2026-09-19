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
    <div className="w-full px-4 pt-3 pb-2.5 flex items-center justify-between bg-[#0e0f16] border-b border-[#1c1d29]/40 z-30 select-none">
      {/* Batch dropdown pill selector */}
      <button
        type="button"
        onClick={onOpenBatchSelector}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#141522] border border-[#2b2d40] hover:border-[#4d4f6c] transition-colors max-w-[260px]"
        title="Select Batch"
      >
        <span className="text-xs font-bold text-white tracking-wide truncate">
          {selectedBatchName}
        </span>
        <ChevronDown size={15} className="text-neutral-400 shrink-0" />
      </button>

      {/* Student Profile Avatar & Name */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex flex-col items-center group focus:outline-none"
        title="Open Profile"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#3a3c56] group-hover:ring-[#8E75FF] transition-all flex items-center justify-center bg-[#181a29]">
          <StudentAvatar type="boy" size={32} />
        </div>
        <span className="text-[10.5px] font-semibold text-neutral-300 group-hover:text-white mt-0.5 tracking-tight">
          {activeStudent.name.split(' ')[0]}
        </span>
      </button>
    </div>
  );
};
