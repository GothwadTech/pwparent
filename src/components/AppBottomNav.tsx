/**
 * Bottom navigation of the parent app — light, matched to the reference.
 *
 * White bar with a hairline top border. The active tab is the single indigo
 * accent with a bold label; inactive tabs are grey. Announcements carries a small
 * red dot only when there is actually something to read (`hasAnnouncements`) —
 * a permanent dot would be a lie.
 */
import React from 'react';
import { PieChart, Newspaper, Headset } from 'lucide-react';
import { MainTabId } from '../types';
import { ACCENT, CARD_BORDER, TEXT_SECONDARY } from '../lib/uiTheme';

interface AppBottomNavProps {
  activeTab: MainTabId;
  onSelectTab: (tab: MainTabId) => void;
  /** Show the red dot on Announcements when the batch has announcements. */
  hasAnnouncements?: boolean;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasAnnouncements,
}) => {
  const tabs: { id: MainTabId; label: string; icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; style?: React.CSSProperties }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'announcements', label: 'Announcements', icon: Newspaper },
    { id: 'support', label: 'Support', icon: Headset },
  ];

  return (
    <div
      className="w-full bg-white border-t py-2 px-4 flex items-center justify-around z-30 select-none"
      style={{ borderColor: CARD_BORDER }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className="relative flex flex-col items-center space-y-1 py-1.5 px-4"
          >
            <span className="relative">
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                style={{ color: isActive ? ACCENT : TEXT_SECONDARY }}
              />
              {tab.id === 'announcements' && hasAnnouncements && (
                <span
                  className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full"
                  style={{ background: '#E02D2D' }}
                />
              )}
            </span>
            <span
              className="text-[12px] tracking-tight"
              style={{
                color: isActive ? ACCENT : TEXT_SECONDARY,
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
