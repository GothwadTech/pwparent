import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, ArrowRight } from 'lucide-react';
import {IconBook, IconClipboard, IconTestPaper} from './icons/AppIcons';
import { StudentProfile } from '../types';

interface StudentDashboardViewProps {
  student: StudentProfile;
  batchName: string;
  onOpenSubjectDetails: (subjectArea: 'lectures' | 'dpp' | 'tests') => void;
  onViewAllTests: () => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  student,
  batchName,
  onOpenSubjectDetails,
  onViewAllTests,
}) => {
  const [weekRange, setWeekRange] = useState('14 Sep-20 Sep');

  // Fallback sample rows, used only when the backend has no test records for
  // this student yet (first paint, or a student the Admin Panel hasn't filled in).
  const fallbackTests = [
    { id: '17', name: 'MISSION 30 : Test 17', date: '19-6-2026', mode: 'Online', status: 'MISSED', marks: '' },
    { id: '16', name: 'MISSION 30 : Test 16', date: '17-6-2026', mode: 'Online', status: 'MISSED', marks: '' },
    { id: '15', name: 'MISSION 30 : Test 15', date: '15-6-2026', mode: 'Online', status: 'MISSED', marks: '' },
    { id: '14', name: 'MISSION 30 : Test 14', date: '13-6-2026', mode: 'Online', status: 'MISSED', marks: '' },
  ];

  /** Real records from Firestore / the demo store, mapped to what this view renders. */
  const recentTests =
    student.tests && student.tests.length > 0
      ? student.tests.map((t) => ({
          id: t.id,
          name: t.title,
          date: t.date,
          mode: t.mode,
          status: t.status,
          marks:
            t.status === 'ATTEMPTED' && typeof t.marksObtained === 'number' && typeof t.marksTotal === 'number'
              ? `${t.marksObtained}/${t.marksTotal}`
              : typeof t.scorePercent === 'number'
                ? `${t.scorePercent}%`
                : '',
        }))
      : fallbackTests;

  // Test scorecard figures. Derived by the Admin Panel (see src/lib/admin.ts
  // recomputeStudent), so they can never contradict the list below.
  const testsAttempted = student.testsCompleted;
  const testsTotal = student.testsTotal ?? recentTests.length;
  const testsProgress = testsTotal > 0 ? Math.min(100, Math.round((testsAttempted / testsTotal) * 100)) : 0;
  const avgScore = student.avgScorePercent ?? 0;
  const avgAccuracy = student.accuracyPercent ?? 0;

  return (
    <div className="flex-1 px-4 pt-3 pb-8 overflow-y-auto space-y-6 select-none">
      {/* ---------------- 1. LECTURES SECTION (Screenshot_20260918_180905.jpg) ---------------- */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2">
          <IconBook size={18} />
          <h2 className="text-base font-bold text-[#17181C] tracking-tight">
            Lectures
          </h2>
        </div>

        {/* Lectures Completed Progress Card */}
        <div className="bg-[#F1F2F4]/90 border border-[#E4E6EB]/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-700">
              Lectures Completed
            </span>
            <span className="text-base font-bold text-[#17181C]">0/0</span>
          </div>

          {/* Progress track with end yellow dot */}
          <div className="relative w-full h-1 bg-white rounded-full my-3">
            <div className="absolute right-0 -top-0.5 w-2 h-2 rounded-full bg-amber-400" />
          </div>

          {/* Sub metrics */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E4E6EB]/50 text-center">
            <div className="pr-2 border-r border-[#E4E6EB]/50">
              <div className="text-base font-bold text-[#17181C]">0/0</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">
                Chapters Completed
              </div>
            </div>
            <div className="pl-2">
              <div className="text-base font-bold text-[#17181C]">0h 0m</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">
                Total Watch Time
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Report Card */}
        <div className="bg-[#FFFFFF] border border-[#E4E6EB] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-neutral-700">Weekly Report</span>
            <div className="flex items-center space-x-1.5 text-neutral-600">
              <button
                type="button"
                className="hover:text-neutral-900 transition-colors"
                onClick={() => setWeekRange('7 Sep-13 Sep')}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-medium text-neutral-700">
                {weekRange}
              </span>
              <button
                type="button"
                className="hover:text-neutral-900 transition-colors"
                onClick={() => setWeekRange('14 Sep-20 Sep')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="text-center my-2">
            <div className="text-lg font-bold text-[#b4a4ff]">0h 0m</div>
            <div className="text-[11px] text-neutral-600">Today</div>
          </div>

          {/* Weekly Bar Grid (Mon - Sun) */}
          <div className="mt-4 space-y-2">
            <div className="relative h-24 flex flex-col justify-between text-[10px] text-neutral-500">
              <div className="border-b border-dashed border-[#E4E6EB] w-full pb-0.5 flex justify-between">
                <span>16m</span>
              </div>
              <div className="border-b border-dashed border-[#E4E6EB] w-full pb-0.5 flex justify-between">
                <span>12m</span>
              </div>
              <div className="border-b border-dashed border-[#E4E6EB] w-full pb-0.5 flex justify-between">
                <span>8m</span>
              </div>
              <div className="border-b border-dashed border-[#E4E6EB] w-full pb-0.5 flex justify-between">
                <span>4m</span>
              </div>
              <div className="border-b border-[#E4E6EB] w-full pb-0.5 flex justify-between">
                <span>0m</span>
              </div>
            </div>

            {/* Days labels */}
            <div className="grid grid-cols-7 text-center text-[10px] text-neutral-600 font-medium pt-1">
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
              <span>SUN</span>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-2 pt-2 text-[10px] text-neutral-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#9F86FF]" />
              <span>Total Watch Time</span>
            </div>
          </div>
        </div>

        {/* Subject Details Button */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => onOpenSubjectDetails('lectures')}
            className="px-4 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F1F2F4] border border-[#E4E6EB] text-xs font-semibold text-neutral-800 hover:text-neutral-900 flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <span>Subject Details</span>
            <Play size={10} className="fill-current" />
          </button>
        </div>
      </section>

      {/* ---------------- 2. DAILY PRACTICE PAPER (Screenshot_20260918_180910.jpg) ---------------- */}
      <section className="space-y-3 pt-2 border-t border-[#E4E6EB]">
        <div className="flex items-center space-x-2">
          <IconClipboard size={18} />
          <h2 className="text-base font-bold text-[#17181C] tracking-tight">
            Daily Practice Paper
          </h2>
        </div>

        {/* DPP Stats Card */}
        <div className="bg-[#F1F2F4]/90 border border-[#E4E6EB]/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-700">
              Total DPP&apos;s Attempted
            </span>
            <span className="text-base font-bold text-[#17181C]">0/0</span>
          </div>

          {/* Progress bar */}
          <div className="relative w-full h-1 bg-white rounded-full my-3">
            <div className="absolute right-0 -top-0.5 w-2 h-2 rounded-full bg-amber-400" />
          </div>

          <div className="text-center text-[10px] text-[#5A4BDA] font-medium my-1">
            In Attempted DPP&apos;s
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E4E6EB]/50 text-center">
            <div className="pr-2 border-r border-[#E4E6EB]/50">
              <div className="text-base font-bold text-[#17181C]">0%</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">
                Questions Attempted
              </div>
            </div>
            <div className="pl-2">
              <div className="text-base font-bold text-[#17181C]">0.0%</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">
                Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Monthly DPP Performance Card */}
        <div className="bg-[#FFFFFF] border border-[#E4E6EB] rounded-2xl p-4">
          <div className="text-xs font-semibold text-neutral-700 mb-6">
            Monthly DPP Performance
          </div>

          {/* Months and 0 0 metrics */}
          <div className="grid grid-cols-4 text-center py-2">
            {['Jun', 'Jul', 'Aug', 'Sep'].map((month) => (
              <div key={month} className="flex flex-col items-center">
                <div className="flex items-center space-x-2 text-xs font-bold text-neutral-700 mb-2">
                  <span>0</span>
                  <span>0</span>
                </div>
                <div className="w-12 h-0.5 bg-[#F1F2F4] mb-2 rounded-full" />
                <span className="text-[11px] text-neutral-600 font-medium">
                  {month}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 pt-4 border-t border-[#E4E6EB] text-[10px] text-neutral-600">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-500" />
              <span>Total DPPs Assigned</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#A088FF]" />
              <span>Attempted DPPs</span>
            </div>
          </div>
        </div>

        {/* Subject Details Button */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => onOpenSubjectDetails('dpp')}
            className="px-4 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F1F2F4] border border-[#E4E6EB] text-xs font-semibold text-neutral-800 hover:text-neutral-900 flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <span>Subject Details</span>
            <Play size={10} className="fill-current" />
          </button>
        </div>
      </section>

      {/* ---------------- 3. TEST SECTION (Screenshot_20260918_180910.jpg & 180913.jpg) ---------------- */}
      <section className="space-y-3 pt-2 border-t border-[#E4E6EB]">
        <div className="flex items-center space-x-2">
          <IconTestPaper size={18} />
          <h2 className="text-base font-bold text-[#17181C] tracking-tight">
            Test
          </h2>
        </div>

        {/* Test Stats Card */}
        <div className="bg-[#F1F2F4]/90 border border-[#E4E6EB]/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-700">
              Total Tests Attempted
            </span>
            <span className="text-base font-bold text-[#17181C]">
              {testsAttempted}/{testsTotal}
            </span>
          </div>

          <div className="relative w-full h-1 bg-white rounded-full my-3">
            <div
              className="h-full bg-[#5A4BDA] rounded-full transition-all duration-500"
              style={{ width: `${testsProgress}%` }}
            />
            <div className="absolute right-0 -top-0.5 w-2 h-2 rounded-full bg-amber-400" />
          </div>

          <div className="text-center text-[10px] text-[#5A4BDA] font-medium my-1">
            In Attempted Tests
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E4E6EB]/50 text-center">
            <div className="pr-2 border-r border-[#E4E6EB]/50">
              <div className="text-base font-bold text-[#17181C]">{avgScore}%</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">
                Avg. Score
              </div>
            </div>
            <div className="pl-2">
              <div className="text-base font-bold text-[#17181C]">{avgAccuracy}%</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">
                Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Subject Details Button */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => onOpenSubjectDetails('tests')}
            className="px-4 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F1F2F4] border border-[#E4E6EB] text-xs font-semibold text-neutral-800 hover:text-neutral-900 flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <span>Subject Details</span>
            <Play size={10} className="fill-current" />
          </button>
        </div>
      </section>

      {/* ---------------- 4. RECENT TESTS (Screenshot_20260918_180913.jpg) ---------------- */}
      <section className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-[#17181C] tracking-tight">
          Recent Tests
        </h3>

        {/* Timeline List matching screenshot */}
        <div className="relative pl-6 space-y-3">
          {/* Vertical connecting line */}
          <div className="absolute left-2.5 top-3 bottom-4 w-0.5 bg-[#4F3E8C]" />

          {recentTests.map((test) => (
            <div key={test.id} className="relative">
              {/* Timeline Node Dot */}
              <div className="absolute -left-6 top-4 w-3 h-3 rounded-full bg-[#5A4BDA] border-2 border-[#E4E6EB]" />

              {/* Test Card */}
              <div className="bg-[#FFFFFF] border border-[#E4E6EB] rounded-xl p-3.5 flex items-center justify-between hover:border-[#E4E6EB] transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-[#17181C]">
                    {test.name}
                  </h4>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    {test.date} &bull; {test.mode}
                    {test.marks ? ` \u2022 ${test.marks}` : ''}
                  </p>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-md border text-[10px] font-bold tracking-wider ${
                    test.status === 'ATTEMPTED'
                      ? 'bg-[#D8F0DE] border-green-900/40 text-[#7CE8A8]'
                      : 'bg-[#FBE0E5] border-red-900/40 text-[#FF7A7A]'
                  }`}
                >
                  {test.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* View All Tests Button matching screenshot */}
        <button
          type="button"
          onClick={onViewAllTests}
          className="w-full py-3 rounded-xl bg-[#FFFFFF] border border-[#E4E6EB] hover:bg-[#FFFFFF] text-neutral-800 hover:text-neutral-900 font-semibold text-xs flex items-center justify-center space-x-2 transition-all mt-3"
        >
          <span>View All Tests</span>
          <ArrowRight size={14} />
        </button>
      </section>
    </div>
  );
};
