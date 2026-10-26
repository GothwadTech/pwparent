/**
 * Attendance section of the offline dashboard — matched to the reference look.
 *
 * Layout, top to bottom: an emoji + title row with a streak pill on the right,
 * a donut showing average attendance, the two all-time day counts, then the
 * weekly strip (week pager, seven letter+date columns, legend).
 *
 * Everything is light and every figure is a prop. Nothing here is invented: if
 * the batch has no marks yet the donut reads 0% and the counts read 0, which is
 * honest, and the week strip still renders so the parent can see the shape.
 */
import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {IconCalendarClock, IconFlame} from './icons/AppIcons';
import type { BatchSummary } from '../hooks/useBatchView';
import type { CalendarDay } from './OfflineAttendanceDashboardView';
import {
  ACCENT, CAL_TODAY_CHIP_BG, CAL_TODAY_CHIP_BORDER, CAL_TODAY_COL_BG,
  CAL_TODAY_COL_BORDER, CARD_BORDER, LEGEND_ABSENT, LEGEND_NO_CLASS,
  LEGEND_PRESENT, LEGEND_TODAY, PROGRESS_TRACK, STREAK_BG, STREAK_BORDER,
  STREAK_TEXT, TEXT_PRIMARY, TEXT_SECONDARY,
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

/** A ring whose filled arc is `percent` of the circumference. */
const AttendanceDonut: React.FC<{ percent: number }> = ({ percent }) => {
  const radius = 77;
  const stroke = 20;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative w-[190px] h-[190px] mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r={radius} fill="none" stroke={PROGRESS_TRACK} strokeWidth={stroke} opacity="0.55" />
        <circle
          cx="100" cy="100" r={radius} fill="none"
          stroke={ACCENT} strokeWidth={stroke} strokeLinecap="butt"
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[32px] leading-none font-extrabold" style={{ color: TEXT_PRIMARY }}>
          {percent}%
        </span>
        <span className="text-[12px] font-semibold mt-1.5" style={{ color: TEXT_PRIMARY }}>
          Average attendance
        </span>
      </div>
    </div>
  );
};

export const AttendanceCalendarSection: React.FC<AttendanceCalendarSectionProps> = ({
  summary, days, weekLabel, onPrevWeek, onNextWeek, canPrevWeek, canNextWeek,
}) => {
  const todayIndex = days.findIndex((d) => d.status !== 'no_class' && d.dayNum === new Date().getDate());

  return (
    <section className="px-3 pt-3 space-y-3">
      {/* Title + streak pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <IconCalendarClock size={18} />
          <h2 className="text-[14px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
            Attendance
          </h2>
        </div>
        {summary.streakDays > 0 && (
          <div
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border"
            style={{ background: STREAK_BG, borderColor: STREAK_BORDER }}
          >
            <IconFlame size={14} />
            <span className="text-[11px] font-bold" style={{ color: STREAK_TEXT }}>
              {summary.streakDays} day streak
            </span>
          </div>
        )}
      </div>

      <AttendanceDonut percent={summary.avgAttendance} />

      {/* All-time day counts */}
      <div className="grid grid-cols-2 items-center py-1">
        <div className="text-center">
          <div className="text-[20px] leading-none font-extrabold" style={{ color: TEXT_PRIMARY }}>
            {summary.studyDays}
          </div>
          <div className="text-[12px] mt-1.5" style={{ color: TEXT_PRIMARY }}>Total Study Days</div>
        </div>
        <div className="text-center border-l" style={{ borderColor: CARD_BORDER }}>
          <div className="text-[20px] leading-none font-extrabold" style={{ color: TEXT_PRIMARY }}>
            {summary.presentDays}
          </div>
          <div className="text-[12px] mt-1.5" style={{ color: TEXT_PRIMARY }}>Total Present Days</div>
        </div>
      </div>

      {/* Weekly report */}
      <div className="space-y-2">
        <h3 className="text-[12px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
          Weekly Report
        </h3>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onPrevWeek}
            disabled={!canPrevWeek}
            aria-label="Previous week"
            className="w-8 h-8 rounded-full bg-white border flex items-center justify-center disabled:opacity-40"
            style={{ borderColor: CARD_BORDER }}
          >
            <ArrowLeft size={14} style={{ color: TEXT_PRIMARY }} />
          </button>
          <span className="text-[12px]" style={{ color: TEXT_SECONDARY }}>{weekLabel}</span>
          <button
            type="button"
            onClick={onNextWeek}
            disabled={!canNextWeek}
            aria-label="Next week"
            className="w-8 h-8 rounded-full bg-white border flex items-center justify-center disabled:opacity-40"
            style={{ borderColor: CARD_BORDER }}
          >
            <ArrowRight size={14} style={{ color: canNextWeek ? TEXT_PRIMARY : '#C6C9CF' }} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const isToday = i === todayIndex;
            return (
              <div
                key={d.dateStr}
                className="flex flex-col items-center py-1.5 rounded-lg border"
                style={{
                  background: isToday ? CAL_TODAY_COL_BG : 'transparent',
                  borderColor: isToday ? CAL_TODAY_COL_BORDER : 'transparent',
                }}
              >
                <span className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                  {d.dayLabel}
                </span>
                <div
                  className="mt-1.5 w-9 h-9 rounded-lg border flex flex-col items-center justify-center"
                  style={{
                    background: isToday ? CAL_TODAY_CHIP_BG : '#FFFFFF',
                    borderColor: isToday ? CAL_TODAY_CHIP_BORDER : CARD_BORDER,
                  }}
                >
                  <span className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                    {d.dayNum}
                  </span>
                  {d.status === 'present' && (
                    <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: LEGEND_PRESENT }} />
                  )}
                  {d.status === 'absent' && (
                    <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: LEGEND_ABSENT }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-start space-x-5 pt-1">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              <span className="text-[11px] font-semibold" style={{ color: TEXT_PRIMARY }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
