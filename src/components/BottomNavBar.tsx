import React from 'react';
import { MainTabId } from '../types';
import { PieChart, Megaphone, Headphones } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: MainTabId;
  onChangeTab: (tab: MainTabId) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
}) => {
  return (
    <nav className="w-full bg-[#0a0b10] border-t border-[#1a1c2b] px-6 py-2 flex items-center justify-around z-30 select-none">
      {/* Dashboard Tab */}
      <button
        type="button"
        onClick={() => onChangeTab('dashboard')}
        className="flex flex-col items-center justify-center space-y-1 py-1 px-3 group focus:outline-none transition-colors"
      >
        <PieChart
          size={20}
          strokeWidth={activeTab === 'dashboard' ? 2.4 : 1.8}
          className={`transition-colors ${
            activeTab === 'dashboard'
              ? 'text-[#9D86FF]'
              : 'text-[#6f7488] group-hover:text-neutral-300'
          }`}
        />
        <span
          className={`text-[11px] font-semibold transition-colors ${
            activeTab === 'dashboard'
              ? 'text-[#9D86FF]'
              : 'text-[#6f7488] group-hover:text-neutral-300'
          }`}
        >
          Dashboard
        </span>
      </button>

      {/* Announcements Tab */}
      <button
        type="button"
        onClick={() => onChangeTab('announcements')}
        className="flex flex-col items-center justify-center space-y-1 py-1 px-3 group focus:outline-none transition-colors relative"
      >
        <div className="relative">
          <Megaphone
            size={20}
            strokeWidth={activeTab === 'announcements' ? 2.4 : 1.8}
            className={`transition-colors ${
              activeTab === 'announcements'
                ? 'text-[#9D86FF]'
                : 'text-[#6f7488] group-hover:text-neutral-300'
            }`}
          />
          {/* Notification red dot badge */}
          <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0a0b10]" />
        </div>
        <span
          className={`text-[11px] font-semibold transition-colors ${
            activeTab === 'announcements'
              ? 'text-[#9D86FF]'
              : 'text-[#6f7488] group-hover:text-neutral-300'
          }`}
        >
          Announcements
        </span>
      </button>

      {/* Support Tab */}
      <button
        type="button"
        onClick={() => onChangeTab('support')}
        className="flex flex-col items-center justify-center space-y-1 py-1 px-3 group focus:outline-none transition-colors"
      >
        <Headphones
          size={20}
          strokeWidth={activeTab === 'support' ? 2.4 : 1.8}
          className={`transition-colors ${
            activeTab === 'support'
              ? 'text-[#9D86FF]'
              : 'text-[#6f7488] group-hover:text-neutral-300'
          }`}
        />
        <span
          className={`text-[11px] font-semibold transition-colors ${
            activeTab === 'support'
              ? 'text-[#9D86FF]'
              : 'text-[#6f7488] group-hover:text-neutral-300'
          }`}
        >
          Support
        </span>
      </button>
    </nav>
  );
};
