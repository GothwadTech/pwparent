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

const IconDashboardNav: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? '#5345E6' : '#8E95A3'}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

const IconAnnouncementsNav: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? '#5345E6' : '#8E95A3'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="15" rx="3" />
    <line x1="7" y1="9" x2="14" y2="9" />
    <line x1="7" y1="13" x2="11" y2="13" />
    <circle cx="17" cy="8" r="1.5" fill={active ? '#5345E6' : '#8E95A3'} stroke="none" />
  </svg>
);

const IconSupportNav: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? '#5345E6' : '#8E95A3'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
  </svg>
);

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasAnnouncements,
}) => {
  return (
    <nav
      className="w-full bg-white border-t border-[#F3F4F6] pt-1.5 pb-2 px-6 flex items-center justify-around z-30 select-none"
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
          className={`text-[11px] tracking-tight mt-1 ${
            activeTab === 'dashboard'
              ? 'text-[#4F46E5] font-bold'
              : 'text-[#6B7280] font-normal'
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
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#E02D2D]" />
          )}
        </span>
        <span
          className={`text-[11px] tracking-tight mt-1 ${
            activeTab === 'announcements'
              ? 'text-[#4F46E5] font-bold'
              : 'text-[#6B7280] font-normal'
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
          className={`text-[11px] tracking-tight mt-1 ${
            activeTab === 'support'
              ? 'text-[#4F46E5] font-bold'
              : 'text-[#6B7280] font-normal'
          }`}
        >
          Support
        </span>
      </button>
    </nav>
  );
};
