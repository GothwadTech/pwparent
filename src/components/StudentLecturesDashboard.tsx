import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import {IconBook, IconClipboard} from './icons/AppIcons';

interface StudentLecturesDashboardProps {
  onOpenSubjectDetails: () => void;
}

export const StudentLecturesDashboard: React.FC<StudentLecturesDashboardProps> = ({
  onOpenSubjectDetails,
}) => {
  const [selectedWeek, setSelectedWeek] = useState('14 Sep-20 Sep');

  return (
    <div className="space-y-6 pb-6 select-none">
      {/* 1. Lectures Section matching Screenshot_20260918_180905.jpg */}
      <div className="space-y-3.5">
        {/* Section Heading */}
        <div className="flex items-center space-x-2 text-[17px] font-bold text-[#17181C]">
          <IconBook size={18} />
          <span>Lectures</span>
        </div>

        {/* Lectures Completed Card */}
        <div className="bg-[#F1F2F4] border border-[#E4E6EB] rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700">
              Lectures Completed
            </span>
            <span className="text-base font-extrabold text-[#17181C]">
              0<span className="text-xs font-medium text-neutral-600">/0</span>
            </span>
          </div>

          {/* Progress Bar with indicator dot */}
          <div className="mt-3 relative w-full h-1 bg-[#FFFFFF] rounded-full overflow-visible">
            <div className="w-0 h-full bg-[#5A4BDA] rounded-full" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-[#facc15] shadow-xs" />
          </div>

          {/* Chapters & Watch Time Metrics */}
          <div className="mt-5 pt-4 border-t border-[#E4E6EB] grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-black text-[#17181C]">0/0</div>
              <div className="text-[11px] font-medium text-neutral-700 mt-0.5">
                Chapters Completed
              </div>
            </div>
            <div className="border-l border-[#E4E6EB]">
              <div className="text-lg font-black text-[#17181C]">0h 0m</div>
              <div className="text-[11px] font-medium text-neutral-700 mt-0.5">
                Total Watch Time
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Report Card */}
        <div className="bg-[#FFFFFF] border border-[#E4E6EB] rounded-2xl p-4.5 shadow-sm">
          {/* Header with week navigation */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#17181C] text-[13px]">
              Weekly Report
            </span>
            <div className="flex items-center space-x-1.5 text-neutral-700">
              <button
                type="button"
                onClick={() => setSelectedWeek('7 Sep-13 Sep')}
                className="p-1 hover:text-neutral-900 transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-[11px] font-semibold">{selectedWeek}</span>
              <button
                type="button"
                onClick={() => setSelectedWeek('21 Sep-27 Sep')}
                className="p-1 hover:text-neutral-900 transition-colors"
                aria-label="Next week"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Today's watch time */}
          <div className="mt-3 text-center">
            <div className="text-2xl font-black text-[#5A4BDA]">0h 0m</div>
            <div className="text-[11px] font-medium text-neutral-600 mt-0.5">
              Today
            </div>
          </div>

          {/* Bar Chart Canvas with dashed lines */}
          <div className="mt-4 pt-2">
            <div className="relative h-28 flex flex-col justify-between">
              {/* Horizontal grid lines */}
              {['16m', '12m', '8m', '4m', '0m'].map((label, idx) => (
                <div key={label} className="flex items-center w-full">
                  <span className="text-[10px] text-neutral-500 w-7 shrink-0">
                    {label}
                  </span>
                  <div className="flex-1 border-b border-dashed border-[#E4E6EB] ml-1" />
                </div>
              ))}
            </div>

            {/* Days row */}
            <div className="mt-2 pl-8 pr-2 flex justify-between text-[10px] font-bold text-neutral-600">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                <span key={day} className="hover:text-neutral-800 transition-colors">
                  {day}
                </span>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center space-x-1.5 text-[10px] text-neutral-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#5A4BDA]" />
              <span>Total Watch Time</span>
            </div>
          </div>
        </div>

        {/* Centered Subject Details Pill Button */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onOpenSubjectDetails}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#F1F2F4] border border-[#E4E6EB] text-xs font-semibold text-neutral-800 transition-all shadow-xs group"
          >
            <span>Subject Details</span>
            <Play
              size={10}
              className="fill-current text-[#5A4BDA] group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </div>
      </div>

      {/* 2. Daily Practice Paper (DPP) Section matching Screenshot_20260918_180910.jpg */}
      <div className="space-y-3.5 pt-2">
        {/* Section Heading */}
        <div className="flex items-center space-x-2 text-[17px] font-bold text-[#17181C]">
          <IconClipboard size={18} />
          <span>Daily Practice Paper</span>
        </div>

        {/* Total DPP Attempted Card */}
        <div className="bg-[#F1F2F4] border border-[#E4E6EB] rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700">
              Total DPP&apos;s Attempted
            </span>
            <span className="text-base font-extrabold text-[#17181C]">
              0<span className="text-xs font-medium text-neutral-600">/88</span>
            </span>
          </div>

          {/* Progress Bar with indicator dot */}
          <div className="mt-3 relative w-full h-1 bg-[#FFFFFF] rounded-full overflow-visible">
            <div className="w-0 h-full bg-[#5A4BDA] rounded-full" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-[#facc15] shadow-xs" />
          </div>

          {/* Questions Attempted & Accuracy */}
          <div className="mt-4 text-center">
            <div className="text-[11px] font-semibold text-[#5A4BDA] mb-2 uppercase tracking-wide">
              In Attempted DPP&apos;s
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-black text-[#17181C]">0%</div>
                <div className="text-[11px] font-medium text-neutral-700 mt-0.5">
                  Questions Attempted
                </div>
              </div>
              <div className="border-l border-[#E4E6EB]">
                <div className="text-lg font-black text-[#17181C]">0.0%</div>
                <div className="text-[11px] font-medium text-neutral-700 mt-0.5">
                  Accuracy
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly DPP Performance Card */}
        <div className="bg-[#FFFFFF] border border-[#E4E6EB] rounded-2xl p-4.5 shadow-sm">
          <div className="text-[13px] font-bold text-[#17181C] mb-6">
            Monthly DPP Performance
          </div>

          {/* Months Bars Area */}
          <div className="h-28 flex items-end justify-around px-4 border-b border-[#E4E6EB] pb-2">
            {['Jun', 'Jul', 'Aug', 'Sep'].map((month) => (
              <div key={month} className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-1.5 text-[10px] text-neutral-600 font-bold">
                  <span>0</span>
                  <span>0</span>
                </div>
                <div className="flex items-end space-x-1 h-12">
                  <div className="w-3.5 h-1.5 bg-[#407BFF] rounded-xs" />
                  <div className="w-3.5 h-1.5 bg-[#9D86FF] rounded-xs" />
                </div>
                <span className="text-[11px] font-medium text-neutral-600">
                  {month}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center space-x-4 text-[10px] text-neutral-600">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#407BFF]" />
              <span>Total DPPs Assigned</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#9D86FF]" />
              <span>Attempted DPPs</span>
            </div>
          </div>
        </div>

        {/* Centered Subject Details Pill Button */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onOpenSubjectDetails}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#F1F2F4] border border-[#E4E6EB] text-xs font-semibold text-neutral-800 transition-all shadow-xs group"
          >
            <span>Subject Details</span>
            <Play
              size={10}
              className="fill-current text-[#5A4BDA] group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
