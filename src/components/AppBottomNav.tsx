/**
 * Bottom navigation of the parent app — pixel-perfect match to PW Parent app.
 */
import React from 'react';
import { MainTabId } from '../types';

interface AppBottomNavProps {
  activeTab: MainTabId;
  onSelectTab: (tab: MainTabId) => void;
  hasAnnouncements?: boolean;
}

/** Speedometer / gauge dial icon matching reference app */
const IconDashboardNav: React.FC<{ active: boolean }> = ({ active }) => {
  const color = active ? '#5A4BDA' : '#7B7F86';
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Three-quarter pie body */}
      <path d="M11 13 L11 5 A8 8 0 1 0 19 13 Z" />
      {/* Detached slice, offset to the top right — the reference glyph */}
      <path d="M13.5 10.5 L13.5 2.5 A8 8 0 0 1 21.5 10.5 Z" />
    </svg>
  );
};

/** Announcements clipboard card icon matching reference app */
const IconAnnouncementsNav: React.FC<{ active: boolean }> = ({ active }) => {
  const color = active ? '#5A4BDA' : '#7B7F86';
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
};

/** Support headset icon matching reference app */
const IconSupportNav: React.FC<{ active: boolean }> = ({ active }) => {
  const color = active ? '#5A4BDA' : '#7B7F86';
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
};

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasAnnouncements,
}) => {
  return (
    <nav
      className="w-full bg-white border-t border-[#EEF2F6] pt-2 pb-2.5 px-6 flex items-center justify-around z-30 select-none shadow-[0_-2px_6px_rgba(0,0,0,0.02)]"
      aria-label="Bottom Navigation"
    >
      {/* Dashboard */}
      <button
        type="button"
        onClick={() => onSelectTab('dashboard')}
        className="flex flex-col items-center py-0.5 px-3 cursor-pointer active:scale-95 transition-transform"
      >
        <IconDashboardNav active={activeTab === 'dashboard'} />
        <span
          className={`text-[10.5px] tracking-tight mt-1 ${
            activeTab === 'dashboard'
              ? 'text-[#5A4BDA] font-semibold'
              : 'text-[#7B7F86] font-normal'
          }`}
        >
          Dashboard
        </span>
      </button>

      {/* Announcements */}
      <button
        type="button"
        onClick={() => onSelectTab('announcements')}
        className="relative flex flex-col items-center py-0.5 px-3 cursor-pointer active:scale-95 transition-transform"
      >
        <span className="relative">
          <IconAnnouncementsNav active={activeTab === 'announcements'} />
          {hasAnnouncements && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
          )}
        </span>
        <span
          className={`text-[10.5px] tracking-tight mt-1 ${
            activeTab === 'announcements'
              ? 'text-[#5A4BDA] font-semibold'
              : 'text-[#7B7F86] font-normal'
          }`}
        >
          Announcements
        </span>
      </button>

      {/* Support */}
      <button
        type="button"
        onClick={() => onSelectTab('support')}
        className="flex flex-col items-center py-0.5 px-3 cursor-pointer active:scale-95 transition-transform"
      >
        <IconSupportNav active={activeTab === 'support'} />
        <span
          className={`text-[10.5px] tracking-tight mt-1 ${
            activeTab === 'support'
              ? 'text-[#5A4BDA] font-semibold'
              : 'text-[#7B7F86] font-normal'
          }`}
        >
          Support
        </span>
      </button>
    </nav>
  );
};
