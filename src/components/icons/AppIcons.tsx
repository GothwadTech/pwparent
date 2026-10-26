/**
 * The app's multicolour icon set — hand-drawn SVG, no emoji.
 *
 * Emoji render differently on every device (some phones show tofu boxes, some
 * show a flat monochrome glyph), so nothing user-facing may depend on them.
 * These match the reference art: a pink calendar with a clock badge, an orange
 * flame, a clipboard, a marked test paper, and the small stat-tile glyphs.
 *
 * Every icon takes `size` and defaults to 20, and is `aria-hidden` because each
 * is always paired with a text label.
 */
import React from 'react';

interface IconProps {
  size?: number;
}

const svg = (size: number, children: React.ReactNode, viewBox = '0 0 24 24') => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" aria-hidden="true">
    {children}
  </svg>
);

/** Pink/red calendar with a small amber clock badge — Attendance. */
export const IconCalendarClock: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <rect x="3" y="5" width="18" height="16" rx="2.5" fill="#FBD5DC" stroke="#E4586F" strokeWidth="1.6" />
    <path d="M3 9.5h18" stroke="#E4586F" strokeWidth="1.6" />
    <path d="M8 3v4M16 3v4" stroke="#E4586F" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="17" cy="17" r="4.6" fill="#FFD34D" stroke="#E8A020" strokeWidth="1.4" />
    <path d="M17 15v2.2l1.6 1" stroke="#8A6D1A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </>);

/** Orange flame — day streak. */
export const IconFlame: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <path
      d="M12 2c1 3.5-3 5-3 9a3.9 3.9 0 0 0 3 3.8A3.9 3.9 0 0 0 15 11c0-1.6-.7-2.8-1.4-3.8C15.8 8 18 10 18 13.4 18 17.6 15.3 21 12 21s-6-3.4-6-7.6C6 8.6 10.4 6.2 12 2Z"
      fill="#F97316"
    />
    <path d="M12 21c-1.9 0-3.2-1.6-3.2-3.5 0-2 1.7-2.9 3.2-5 1.5 2.1 3.2 3 3.2 5 0 1.9-1.3 3.5-3.2 3.5Z" fill="#FDBA74" />
  </>);

/** Clipboard with ruled lines — Daily Practice Paper. */
export const IconClipboard: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <rect x="5" y="4" width="14" height="18" rx="2" fill="#FDF3D8" stroke="#D9A62E" strokeWidth="1.6" />
    <rect x="9" y="2.4" width="6" height="3.6" rx="1.2" fill="#D9A62E" />
    <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.5" stroke="#B98A21" strokeWidth="1.5" strokeLinecap="round" />
  </>);

/** Marked test paper with a pencil — Test. */
export const IconTestPaper: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <rect x="4" y="3" width="13" height="18" rx="2" fill="#DCEBFA" stroke="#7E9BC4" strokeWidth="1.6" />
    <path d="M7 8h7M7 11.5h7M7 15h4" stroke="#5F7CA6" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15.5 14.5 20 10l2 2-4.5 4.5-2.4.4.4-2.4Z" fill="#F97316" stroke="#D95F0E" strokeWidth="1.2" />
  </>);

/** Small multicolour line chart — Score tile. */
export const IconChartLine: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <path d="M4 20V4" stroke="#9AA0A8" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M4 20h16" stroke="#9AA0A8" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M7 15l4-5 3 3 5-7" stroke="#22A06B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 17.5l4-3.5 3 2 5-4.5" stroke="#E4586F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </>);

/** Blue concentric target — Accuracy tile. */
export const IconTarget: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <circle cx="12" cy="12" r="9" stroke="#2F6FED" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="5.2" stroke="#2F6FED" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="1.7" fill="#2F6FED" />
  </>);

/** Green check in a circle — Correct tile. */
export const IconCheckCircle: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <circle cx="12" cy="12" r="9" stroke="#22A06B" strokeWidth="1.8" />
    <path d="m8 12.4 2.7 2.6L16 9.6" stroke="#22A06B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </>);

/** Person on a podium — Rank tile. */
export const IconPodium: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <circle cx="12" cy="6" r="2.6" fill="#F6C445" />
    <path d="M12 9c-1.8 0-3 1.2-3 3v2h6v-2c0-1.8-1.2-3-3-3Z" fill="#E4586F" />
    <rect x="4" y="15" width="5" height="6" rx="1" fill="#8FD3B0" />
    <rect x="10" y="12.5" width="5" height="8.5" rx="1" fill="#E4586F" />
    <rect x="16" y="16.5" width="4.5" height="4.5" rx="1" fill="#9CC3E8" />
  </>);

/** Amber star — Top Score tile. */
export const IconStar: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <path
    d="m12 2.6 2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17l-5.7 3 1.2-6.3L2.8 9.3l6.4-.8L12 2.6Z"
    fill="#F6C445" stroke="#E8A020" strokeWidth="1.2" strokeLinejoin="round"
  />);

/** Light-blue bar chart — Avg Score tile. */
export const IconBars: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <rect x="4" y="12" width="3.4" height="8" rx="1" fill="#BBD9F2" />
    <rect x="9.2" y="8" width="3.4" height="12" rx="1" fill="#9CC3E8" />
    <rect x="14.4" y="4.5" width="3.4" height="15.5" rx="1" fill="#BBD9F2" />
  </>);

/** Open book — lectures/online dashboard. */
export const IconBook: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <path d="M12 6c-2-1.6-4.6-2-8-2v14c3.4 0 6 .4 8 2 2-1.6 4.6-2 8-2V4c-3.4 0-6 .4-8 2Z" fill="#DCEBFA" stroke="#5F7CA6" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 6v14" stroke="#5F7CA6" strokeWidth="1.6" />
  </>);

/** Amber bolt — announcement category. */
export const IconBolt: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" fill="#F6C445" stroke="#E8A020" strokeWidth="1.2" strokeLinejoin="round" />);

/** Rocket — announcement category. */
export const IconRocket: React.FC<IconProps> = ({size = 20}) =>
  svg(size, <>
    <path d="M14 4c3.5 1 6 3.5 7 7-2.6.6-4.6 1.8-6.4 3.6L9.4 9.4C11.2 7.6 12.4 5.6 14 4Z" fill="#9CC3E8" stroke="#5F7CA6" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M9.4 9.4 4 12l3 1.5L5.5 17l3-1 1.5 3 2.6-5.4" fill="#DCEBFA" stroke="#5F7CA6" strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="14.6" cy="9.4" r="1.8" fill="#FFFFFF" stroke="#5F7CA6" strokeWidth="1.2" />
  </>);
