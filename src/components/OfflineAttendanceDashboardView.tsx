import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, ArrowRight } from 'lucide-react';
import { StudentProfile } from '../types';

interface OfflineAttendanceDashboardViewProps {
  student: StudentProfile;
  batchName: string;
  onOpenSubjectDetails: (subjectArea: 'lectures' | 'dpp' | 'tests') => void;
  onViewAllTests: () => void;
}

interface CalendarDay {
  dayNum: number;
  dayLabel: string;
  status: 'present' | 'absent' | 'no_class';
  dateStr: string;
  details: string;
}

export const OfflineAttendanceDashboardView: React.FC<OfflineAttendanceDashboardViewProps> = ({
  student,
  batchName,
  onOpenSubjectDetails,
  onViewAllTests,
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedDayNum, setSelectedDayNum] = useState<number>(12);
  const [dppTab, setDppTab] = useState<'objective' | 'subjective'>('subjective');

  const weeks = [
    { label: '8 Jun - 14 Jun', range: 'Current Week' },
    { label: '1 Jun - 7 Jun', range: 'Previous Week' },
  ];

  // Calendar days matching Screenshot_20260918_180122.jpg
  const calendarDays: CalendarDay[] = [
    { dayNum: 8, dayLabel: 'M', status: 'absent', dateStr: '8 June (Monday)', details: 'Absent • Offline Class marked absent' },
    { dayNum: 9, dayLabel: 'T', status: 'no_class', dateStr: '9 June (Tuesday)', details: 'No Class • Scheduled self-study day' },
    { dayNum: 10, dayLabel: 'W', status: 'present', dateStr: '10 June (Wednesday)', details: 'Present • Physics & Chemistry attended' },
    { dayNum: 11, dayLabel: 'T', status: 'present', dateStr: '11 June (Thursday)', details: 'Present • Mathematics & DPP discussion attended' },
    { dayNum: 12, dayLabel: 'F', status: 'present', dateStr: '12 June (Friday)', details: 'Present • Full day center attendance recorded' },
    { dayNum: 13, dayLabel: 'S', status: 'no_class', dateStr: '13 June (Saturday)', details: 'No Class • Weekend revision' },
    { dayNum: 14, dayLabel: 'S', status: 'no_class', dateStr: '14 June (Sunday)', details: 'No Class • Center weekly off' },
  ];

  const selectedDayInfo = calendarDays.find((d) => d.dayNum === selectedDayNum) || calendarDays[4];

  // Offline / Center tests
  const offlineTests = [
    { id: '1', name: 'Center Test 04 : Full Syllabus', date: '11-6-2026', mode: 'Center Offline', marks: '592/720', rank: 'AIR 142', status: 'ATTENDED' },
    { id: '2', name: 'Center Test 03 : Physics & Chem', date: '04-6-2026', mode: 'Center Offline', marks: '248/360', rank: 'AIR 198', status: 'ATTENDED' },
    { id: '3', name: 'Center Test 02 : Optics & Mechanics', date: '28-5-2026', mode: 'Center Offline', marks: '110/180', rank: 'AIR 220', status: 'ATTENDED' },
    { id: '4', name: 'Center Test 01 : Diagnostic Test', date: '14-5-2026', mode: 'Center Offline', marks: '0/720', rank: '--', status: 'MISSED' },
  ];

  return (
    <div className="flex-1 w-full px-4 pt-3 pb-8 overflow-y-auto space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ---------------- 1. ATTENDANCE SECTION (Exact clone of Screenshot_20260918_180122.jpg) ---------------- */}
      <section className="space-y-3">
        {/* Header row with Attendance title & 2-day streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📅</span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Attendance
            </h2>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame size={14} className="fill-amber-400 text-amber-500 shrink-0" />
            <span className="text-xs font-bold tracking-tight">2 day streak</span>
          </div>
        </div>

        {/* Main Attendance Card */}
        <div className="bg-[#151624] border border-[#2b2d42] rounded-3xl p-5 shadow-lg space-y-5">
          {/* Circular attendance percentage ring */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background track */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#222436"
                  strokeWidth="15"
                  fill="transparent"
                />
                {/* Active purple ring: 79% */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#6254F6"
                  strokeWidth="15"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - 0.79)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Text inside the ring */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  79%
                </span>
                <span className="text-xs text-neutral-400 font-medium mt-0.5">
                  Average attendance
                </span>
              </div>
            </div>
          </div>

          {/* 2 Stats columns below the ring */}
          <div className="grid grid-cols-2 gap-0 pt-2 border-t border-[#23253b] items-center text-center">
            <div className="py-2 border-r border-[#23253b]">
              <div className="text-2xl font-black text-white">100</div>
              <div className="text-xs text-neutral-400 font-medium mt-0.5">
                Total Study Days
              </div>
            </div>
            <div className="py-2">
              <div className="text-2xl font-black text-white">79</div>
              <div className="text-xs text-neutral-400 font-medium mt-0.5">
                Total Present Days
              </div>
            </div>
          </div>

          {/* Weekly Report Header & Calendar */}
          <div className="pt-3 border-t border-[#23253b] space-y-3.5">
            <div className="text-xs font-bold text-neutral-300">
              Weekly Report
            </div>

            {/* Date Range Navigation: < 8 Jun - 14 Jun > */}
            <div className="flex items-center justify-between px-2 text-neutral-300">
              <button
                type="button"
                onClick={() => setSelectedWeekIndex(selectedWeekIndex === 0 ? 1 : 0)}
                className="w-8 h-8 rounded-full border border-[#2e3047] flex items-center justify-center hover:bg-[#222438] active:scale-95 transition-all text-neutral-400"
                title="Previous Week"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-bold tracking-wide text-neutral-200">
                {weeks[selectedWeekIndex].label}
              </span>

              <button
                type="button"
                onClick={() => setSelectedWeekIndex(selectedWeekIndex === 1 ? 0 : 1)}
                className="w-8 h-8 rounded-full border border-[#2e3047] flex items-center justify-center hover:bg-[#222438] active:scale-95 transition-all text-neutral-400"
                title="Next Week"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 7 Days of the Week: M T W T F S S with dots & selected day capsule */}
            <div className="flex items-center justify-between gap-1 pt-1">
              {calendarDays.map((day) => {
                const isSelected = selectedDayNum === day.dayNum;

                // Status styling
                let borderStyle = 'border-[#2d2f45] bg-[#1a1b2c]/60';
                let dotColor = 'bg-neutral-500';
                let numTextColor = 'text-neutral-300';

                if (day.status === 'absent') {
                  borderStyle = 'border-red-500/40 bg-red-500/10';
                  dotColor = 'bg-red-400';
                  numTextColor = 'text-red-400';
                } else if (day.status === 'present') {
                  borderStyle = 'border-emerald-500/40 bg-emerald-500/10';
                  dotColor = 'bg-emerald-400';
                  numTextColor = 'text-emerald-300';
                }

                if (isSelected) {
                  // Pill capsule container covering both number and day label
                  return (
                    <button
                      key={day.dayNum}
                      type="button"
                      onClick={() => setSelectedDayNum(day.dayNum)}
                      className="flex flex-col items-center justify-between py-2 px-2.5 rounded-full border-2 border-indigo-400 bg-indigo-950/40 shadow-md shadow-indigo-950/50 min-w-[40px] transition-transform scale-105"
                      title={day.dateStr}
                    >
                      <span className="text-xs font-black text-white">{day.dayNum}</span>
                      <div className={`w-1.5 h-1.5 rounded-full my-1 ${dotColor}`} />
                      <span className="text-[11px] font-bold text-indigo-200">{day.dayLabel}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={day.dayNum}
                    type="button"
                    onClick={() => setSelectedDayNum(day.dayNum)}
                    className="flex flex-col items-center group cursor-pointer focus:outline-none"
                    title={day.dateStr}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl border flex flex-col items-center justify-center transition-all group-hover:border-neutral-400 ${borderStyle}`}
                    >
                      <span className={`text-xs font-bold ${numTextColor}`}>
                        {day.dayNum}
                      </span>
                      <div className={`w-1 h-1 rounded-full mt-0.5 ${dotColor}`} />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-400 mt-1.5">
                      {day.dayLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Attendance Legend: No Class | Present | Absent */}
            <div className="flex items-center justify-center space-x-5 pt-2 text-[11px] text-neutral-400">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-neutral-500" />
                <span>No Class</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Present</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span>Absent</span>
              </div>
            </div>

            {/* Selected Day Status Details Banner */}
            <div className="p-3 rounded-xl bg-[#1c1d2e] border border-[#2d2f48] text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-white block mb-0.5">{selectedDayInfo.dateStr}</span>
                <span className="text-neutral-400 text-[11px]">{selectedDayInfo.details}</span>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                  selectedDayInfo.status === 'present'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : selectedDayInfo.status === 'absent'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-neutral-700/40 text-neutral-300'
                }`}
              >
                {selectedDayInfo.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 2. DAILY PRACTICE PAPER (DPP) SECTION (Screenshot_20260918_180122.jpg) ---------------- */}
      <section className="space-y-3">
        {/* Header with DPP title & 3-day streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📋</span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Daily Practice Paper <span className="text-neutral-400 font-normal text-xs">(DPP)</span>
            </h2>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame size={14} className="fill-amber-400 text-amber-500 shrink-0" />
            <span className="text-xs font-bold tracking-tight">3 day streak</span>
          </div>
        </div>

        {/* DPP Container Card */}
        <div className="bg-[#151624] border border-[#2b2d42] rounded-3xl p-5 shadow-lg space-y-4">
          {/* Segmented control: Objective | Subjective (Subjective active as in screenshot) */}
          <div className="p-1 rounded-xl bg-[#1c1d2e] border border-[#2e3047] grid grid-cols-2 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDppTab('objective')}
              className={`py-2 rounded-lg transition-all text-center ${
                dppTab === 'objective'
                  ? 'bg-[#6254F6] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Objective
            </button>
            <button
              type="button"
              onClick={() => setDppTab('subjective')}
              className={`py-2 rounded-lg transition-all text-center ${
                dppTab === 'subjective'
                  ? 'bg-[#2b2c44] text-white shadow-sm border border-[#434568]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Subjective
            </button>
          </div>

          {/* DPP Stats Breakdown */}
          {dppTab === 'subjective' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300 font-medium">Total DPPs Attempted</span>
                <span className="text-sm font-bold text-white">42/50</span>
              </div>

              {/* Progress bar */}
              <div className="relative w-full h-1.5 bg-[#202135] rounded-full overflow-hidden">
                <div className="w-[84%] h-full bg-gradient-to-r from-indigo-500 to-[#6254F6] rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#23253b] text-center">
                <div className="py-1 border-r border-[#23253b]">
                  <div className="text-lg font-bold text-emerald-400">88.4%</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Subjective Accuracy</div>
                </div>
                <div className="py-1">
                  <div className="text-lg font-bold text-white">128</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Questions Checked</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300 font-medium">Total DPPs Attempted</span>
                <span className="text-sm font-bold text-white">68/88</span>
              </div>

              <div className="relative w-full h-1.5 bg-[#202135] rounded-full overflow-hidden">
                <div className="w-[77%] h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#23253b] text-center">
                <div className="py-1 border-r border-[#23253b]">
                  <div className="text-lg font-bold text-white">92.0%</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Objective Accuracy</div>
                </div>
                <div className="py-1">
                  <div className="text-lg font-bold text-white">410</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">MCQs Solved</div>
                </div>
              </div>
            </div>
          )}

          {/* Subject details button */}
          <button
            type="button"
            onClick={() => onOpenSubjectDetails('dpp')}
            className="w-full mt-2 py-2.5 rounded-xl bg-[#202237] hover:bg-[#282a44] border border-[#363857] flex items-center justify-center space-x-2 text-xs font-semibold text-neutral-200 transition-colors"
          >
            <span>DPP Subject Breakdown</span>
            <ArrowRight size={14} className="text-[#9F86FF]" />
          </button>
        </div>
      </section>

      {/* ---------------- 3. CENTER / OFFLINE TESTS SECTION ---------------- */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📑</span>
          <h2 className="text-base font-bold text-white tracking-tight">
            Classroom & Center Tests
          </h2>
        </div>

        {/* Tests Summary Card */}
        <div className="bg-[#151624] border border-[#2b2d42] rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-300 font-medium">Tests Attempted</span>
            <span className="text-sm font-bold text-white">3/4</span>
          </div>

          <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#23253b] text-center">
            <div className="py-1 border-r border-[#23253b]">
              <div className="text-lg font-bold text-white">592/720</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Best Center Score</div>
            </div>
            <div className="py-1">
              <div className="text-lg font-bold text-indigo-400">AIR 142</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Top Center Rank</div>
            </div>
          </div>

          {/* Recent center tests timeline */}
          <div className="space-y-3 pt-1">
            <div className="text-xs font-bold text-neutral-300">Recent Center Tests</div>
            {offlineTests.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-2xl bg-[#1c1d2e] border border-[#2e3047] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{t.name}</span>
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-400 mt-0.5">
                    <span>{t.date}</span>
                    <span>•</span>
                    <span className="text-indigo-300 font-medium">{t.rank}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-white block text-sm">{t.marks}</span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      t.status === 'ATTENDED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onViewAllTests}
            className="w-full mt-2 py-2.5 rounded-xl bg-[#202237] hover:bg-[#282a44] border border-[#363857] flex items-center justify-center space-x-2 text-xs font-semibold text-neutral-200 transition-colors"
          >
            <span>View All Center Tests</span>
            <ArrowRight size={14} className="text-[#9F86FF]" />
          </button>
        </div>
      </section>
    </div>
  );
};
