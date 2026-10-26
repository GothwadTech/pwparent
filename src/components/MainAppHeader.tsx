import React from 'react';
import { ChevronDown } from 'lucide-react';
import { StudentAvatar } from './StudentAvatar';

interface MainAppHeaderProps {
  selectedBatch: string;
  studentName: string;
  onOpenBatchSelector: () => void;
  onOpenProfile: () => void;
}

export const MainAppHeader: React.FC<MainAppHeaderProps> = ({
  selectedBatch,
  studentName,
  onOpenBatchSelector,
  onOpenProfile,
}) => {
  return (
    <header className="w-full px-4 pt-3 pb-2.5 flex items-center justify-between bg-[#F4F5F7] border-b border-[#181a27] z-20">
      {/* Batch Selector Dropdown Pill */}
      <button
        type="button"
        onClick={onOpenBatchSelector}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-[#2b2e42] bg-[#121320] hover:bg-[#181a2b] transition-all text-left shadow-xs group"
        aria-label="Select Batch"
      >
        <span className="text-[13px] font-bold text-[#17181C] tracking-tight truncate max-w-[210px]">
          {selectedBatch}
        </span>
        <ChevronDown
          size={16}
          className="text-neutral-600 group-hover:text-neutral-900 transition-colors shrink-0"
        />
      </button>

      {/* Student Profile Button */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex flex-col items-center group focus:outline-none -mr-1"
        title="View Student Profile"
      >
        <div className="w-8 h-8 rounded-full ring-1 ring-[#8E75FF]/60 overflow-hidden group-hover:ring-[#8E75FF] transition-all">
          <StudentAvatar type="boy" size={32} />
        </div>
        <span className="text-[11px] font-semibold text-neutral-700 group-hover:text-neutral-900 mt-0.5 leading-none">
          {studentName}
        </span>
      </button>
    </header>
  );
};
