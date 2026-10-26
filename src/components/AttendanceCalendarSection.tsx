/**
 * Attendance calendar — split out of OfflineAttendanceDashboardView.
 *
 * The parent file was at 484 lines and about to cross the repo's 500-line
 * ceiling, so each of its three sections now lives on its own. The markup here
 * is unchanged: it is still the pixel-matched clone, only its data source is
 * real (`batches/{id}/attendance/{studentId}`) instead of a hardcoded sample
 * week.
 *
 * Week and selected-day state live HERE rather than in the parent because
 * nothing outside this section reads them.
 */
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import type { StudentProfile } from '../types';
import type { CalendarDay } from './OfflineAttendanceDashboardView';

interface AttendanceCalendarSectionProps {
  student: StudentProfile;
  /** Real day marks mapped to this component's cell shape. */
  calendarDays: CalendarDay[];
  weeks: { label: string; range: string }[];
}

export const AttendanceCalendarSection: React.FC<AttendanceCalendarSectionProps> = ({
  student,
  calendarDays,
  weeks,
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  // Default to the last marked day rather than a magic index: the sample data
  // happened to have 7 entries, a real month has 28-31.
  const [selectedDayNum, setSelectedDayNum] = useState<number>(
    calendarDays[calendarDays.length - 1]?.dayNum ?? 1,
  );

  // An empty calendar is a real state now (nobody marked yet), so every lookup
  // has to tolerate it instead of indexing into a 7-item sample.
  const selectedDayInfo =
    calendarDays.find((d) => d.dayNum === selectedDayNum) ??
    calendarDays[calendarDays.length - 1] ??
    null;

  return (
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
            {selectedDayInfo ? (
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
            ) : (
              /* An empty calendar is a real state now, not a bug: nobody has
                 marked this student yet. Say so instead of crashing on a
                 missing day — the old `|| calendarDays[4]` fallback only ever
                 worked because the sample week was hardcoded to 7 entries. */
              <div className="p-3 rounded-xl bg-[#1c1d2e] border border-[#2d2f48] text-xs text-neutral-400">
                No attendance marked for this period yet.
              </div>
            )}
          </div>
        </div>
      </section>
  );
};
