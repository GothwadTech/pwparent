/**
 * Attendance section of the offline dashboard — measured off the reference.
 *
 * Everything below is in CSS px taken from the 2× reference screenshots, so the
 * section lines up with the real parent app rather than merely resembling it:
 *
 *   title row      20px icon + 16px extrabold "Attendance", streak pill right
 *   donut          180px ring, 20px stroke, 32px figure + 13px caption centred
 *   day counts     20px extrabold over 13px labels, hairline divider between
 *   weekly report  14px heading, 28px grey pager circles, 32px day chips, the
 *                  today column wrapped in its blue tint, 4-dot legend spread
 *                  edge to edge
 *
 * Every figure is a prop. Nothing is invented: an unmarked batch reads 0% and 0
 * days, and the week strip still renders so the shape of the report is visible.
 */
import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {IconCalendarClock, IconFlame} from './icons/AppIcons';
import type { BatchSummary } from '../hooks/useBatchView';
import type { CalendarDay } from './OfflineAttendanceDashboardView';
import {
  ACCENT, CAL_TODAY_CHIP_BORDER, CAL_TODAY_COL_BG, CAL_TODAY_COL_BORDER,
  CARD_BORDER, LEGEND_ABSENT, LEGEND_NO_CLASS, LEGEND_PRESENT, LEGEND_TODAY,
  PROGRESS_TRACK, STREAK_BG, STREAK_BORDER, STREAK_TEXT, TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../lib/uiTheme';

interface AttendanceCalendarSectionProps {
  summary: BatchSummary;
  days: CalendarDay[];
  weekLabel: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  canPrevWeek?: boolean;
  canNextWeek?: boolean;
}

const LEGEND = [
  { color: LEGEND_TODAY, label: 'Today' },
  { color: LEGEND_NO_CLASS, label: 'No Class' },
  { color: LEGEND_PRESENT, label: 'Present' },
  { color: LEGEND_ABSENT, label: 'Absent' },
];

/**
 * The 180px ring. `r=90` with a 20px stroke puts the outer edge exactly on the
 * viewBox, so the rendered ring IS 180px of purple — the proportion the
 * reference shows, not a shrunken approximation of it.
 */
const AttendanceDonut: React.FC<{ percent: number }> = ({ percent }) => {
  const radius = 90;
  const stroke = 20;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const filled = (clamped / 100) * circumference;

  return (
    <div className="relative w-[180px] h-[180px] mx-auto mt-6">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r={radius} fill="none" stroke={PROGRESS_TRACK} strokeWidth={stroke} />
        {clamped > 0 && (
          <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke={ACCENT} strokeWidth={stroke} strokeLinecap="butt"
            strokeDasharray={`${filled} ${circumference - filled}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[32px] leading-none font-extrabold" style={{ color: TEXT_PRIMARY }}>
          {percent}%
        </span>
        <span className="text-[13px] font-semibold mt-2" style={{ color: TEXT_PRIMARY }}>
          Average attendance
        </span>
      </div>
    </div>
  );
};

/** One weekday column: letter, date chip, status dot; today wears the blue wrap. */
const DayColumn: React.FC<{ day: CalendarDay; isToday: boolean }> = ({ day, isToday }) => {
  const dot = isToday
    ? LEGEND_TODAY
    : day.status === 'present'
      ? LEGEND_PRESENT
      : day.status === 'absent'
        ? LEGEND_ABSENT
        : null;

  return (
    <div
      className="flex flex-col items-center pt-1.5 pb-2 rounded-xl border"
      style={{
        background: isToday ? CAL_TODAY_COL_BG : 'transparent',
        borderColor: isToday ? CAL_TODAY_COL_BORDER : 'transparent',
      }}
    >
      <span className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
        {day.dayLabel}
      </span>
      <div
        className="mt-1.5 w-8 h-8 rounded-lg border flex items-center justify-center"
        style={{
          background: '#FFFFFF',
          borderColor: isToday ? CAL_TODAY_CHIP_BORDER : CARD_BORDER,
        }}
      >
        <span className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>
          {day.dayNum}
        </span>
      </div>
      <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: dot ?? 'transparent' }} />
    </div>
  );
};

export const AttendanceCalendarSection: React.FC<AttendanceCalendarSectionProps> = ({
  summary, days, weekLabel, onPrevWeek, onNextWeek, canPrevWeek, canNextWeek,
}) => {
  const todayIndex = days.findIndex((d) => d.dayNum === new Date().getDate());

  return (
    <section className="px-4 pt-4 pb-5">
      {/* Title + streak pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <IconCalendarClock size={20} />
          <h2 className="text-[16px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
            Attendance
          </h2>
        </div>
        {summary.streakDays > 0 && (
          <div
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full border"
            style={{ background: STREAK_BG, borderColor: STREAK_BORDER }}
          >
            <IconFlame size={15} />
            <span className="text-[12px] font-bold" style={{ color: STREAK_TEXT }}>
              {summary.streakDays} day streak
            </span>
          </div>
        )}
      </div>

      <AttendanceDonut percent={summary.avgAttendance} />

      {/* All-time day counts */}
      <div className="grid grid-cols-2 items-center mt-6">
        <div className="text-center">
          <div className="text-[20px] leading-none font-extrabold" style={{ color: TEXT_PRIMARY }}>
            {summary.studyDays}
          </div>
          <div className="text-[13px] mt-2" style={{ color: TEXT_PRIMARY }}>Total Study Days</div>
        </div>
        <div className="text-center border-l h-12 flex flex-col items-center justify-center" style={{ borderColor: CARD_BORDER }}>
          <div className="text-[20px] leading-none font-extrabold" style={{ color: TEXT_PRIMARY }}>
            {summary.presentDays}
          </div>
          <div className="text-[13px] mt-2" style={{ color: TEXT_PRIMARY }}>Total Present Days</div>
        </div>
      </div>

      {/* Weekly report */}
      <h3 className="text-[14px] font-extrabold tracking-tight mt-6" style={{ color: TEXT_PRIMARY }}>
        Weekly Report
      </h3>

      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={onPrevWeek}
          disabled={!canPrevWeek}
          aria-label="Previous week"
          className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40"
          style={{ background: '#F1F2F4' }}
        >
          <ArrowLeft size={14} style={{ color: TEXT_PRIMARY }} />
        </button>
        <span className="text-[13px] font-medium" style={{ color: TEXT_SECONDARY }}>{weekLabel}</span>
        <button
          type="button"
          onClick={onNextWeek}
          disabled={!canNextWeek}
          aria-label="Next week"
          className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40"
          style={{ background: '#F1F2F4' }}
        >
          <ArrowRight size={14} style={{ color: canNextWeek ? TEXT_PRIMARY : '#C6C9CF' }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mt-3">
        {days.map((d, i) => (
          <DayColumn key={d.dateStr} day={d} isToday={i === todayIndex} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-3">
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-[11px] font-semibold" style={{ color: TEXT_PRIMARY }}>{l.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
