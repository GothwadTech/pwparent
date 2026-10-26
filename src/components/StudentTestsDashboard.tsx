import React from 'react';
import { Play, ArrowRight, ArrowUpRight } from 'lucide-react';

interface StudentTestsDashboardProps {
  onOpenSubjectDetails: () => void;
  onViewAllTests?: () => void;
}

export const StudentTestsDashboard: React.FC<StudentTestsDashboardProps> = ({
  onOpenSubjectDetails,
  onViewAllTests,
}) => {
  const tests = [
    { id: '17', title: 'MISSION 30 : Test 17', date: '19-6-2026', mode: 'Online', status: 'MISSED' },
    { id: '16', title: 'MISSION 30 : Test 16', date: '17-6-2026', mode: 'Online', status: 'MISSED' },
    { id: '15', title: 'MISSION 30 : Test 15', date: '15-6-2026', mode: 'Online', status: 'MISSED' },
    { id: '14', title: 'MISSION 30 : Test 14', date: '13-6-2026', mode: 'Online', status: 'MISSED' },
  ];

  return (
    <div className="space-y-6 pt-2 pb-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Test Section Header */}
      <div className="flex items-center space-x-2 text-[17px] font-bold text-[#17181C]">
        <span>📑</span>
        <span>Test</span>
      </div>

      {/* Total Tests Attempted Card matching Screenshot_20260918_180910.jpg */}
      <div className="bg-[#F1F2F4] border border-[#E4E6EB] rounded-2xl p-4.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-700">
            Total Tests Attempted
          </span>
          <span className="text-base font-extrabold text-[#17181C]">
            0<span className="text-xs font-medium text-neutral-600">/17</span>
          </span>
        </div>

        {/* Progress Bar with indicator dot */}
        <div className="mt-3 relative w-full h-1 bg-[#1a172e] rounded-full overflow-visible">
          <div className="w-0 h-full bg-[#5747D6] rounded-full" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-[#facc15] shadow-xs" />
        </div>

        {/* Avg. Score & Accuracy */}
        <div className="mt-4 text-center">
          <div className="text-[11px] font-semibold text-[#5747D6] mb-2 uppercase tracking-wide">
            In Attempted Tests
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-black text-[#17181C]">0%</div>
              <div className="text-[11px] font-medium text-neutral-700 mt-0.5">
                Avg. Score
              </div>
            </div>
            <div className="border-l border-[#E4E6EB]">
              <div className="text-lg font-black text-[#17181C]">0%</div>
              <div className="text-[11px] font-medium text-neutral-700 mt-0.5">
                Accuracy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Subject Details Pill Button */}
      <div className="flex justify-center -mt-2">
        <button
          type="button"
          onClick={onOpenSubjectDetails}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#171826] hover:bg-[#F1F2F4] border border-[#E4E6EB] text-xs font-semibold text-neutral-800 transition-all shadow-xs group"
        >
          <span>Subject Details</span>
          <Play
            size={10}
            className="fill-current text-[#5747D6] group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>

      {/* Recent Tests Section matching Screenshot_20260918_180933.jpg */}
      <div className="space-y-4 pt-2">
        <h3 className="text-[15px] font-bold text-[#17181C] tracking-tight">
          Recent Tests
        </h3>

        {/* Vertical Timeline container */}
        <div className="relative pl-6 space-y-3.5">
          {/* Vertical purple line */}
          <div className="absolute top-4 bottom-4 left-2 w-0.5 bg-[#5D4CB8]" />

          {tests.map((test) => (
            <div key={test.id} className="relative group">
              {/* Timeline node circle */}
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#F4F5F7] border-2 border-[#5747D6] flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5747D6]" />
              </div>

              {/* Test Card */}
              <div className="bg-[#12131f] border border-[#212338] hover:border-[#383b58] rounded-xl p-3.5 flex items-center justify-between transition-all shadow-xs">
                <div>
                  <h4 className="text-[13px] font-bold text-[#17181C] tracking-tight">
                    {test.title}
                  </h4>
                  <div className="text-[11px] text-neutral-600 mt-0.5 flex items-center space-x-1.5">
                    <span>{test.date}</span>
                    <span>•</span>
                    <span>{test.mode}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <span className="px-2.5 py-1 rounded-md bg-[#42151c] text-[#F87171] text-[10px] font-bold tracking-wider">
                  {test.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* View All Tests Button matching Screenshot_20260918_180933.jpg */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onViewAllTests}
            className="w-full py-3.5 px-4 rounded-xl bg-[#191c2b] hover:bg-[#23273c] border border-[#2c3049] text-[#17181C] font-bold text-xs flex items-center justify-center space-x-2 transition-all group active:scale-[0.99]"
          >
            <span>View All Tests</span>
            <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight size={10} strokeWidth={2.5} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
