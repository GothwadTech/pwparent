import React from 'react';
import { PieChart, Megaphone, Headphones } from 'lucide-react';
import { MainTabId } from '../types';

interface AppBottomNavProps {
  activeTab: MainTabId;
  onSelectTab: (tab: MainTabId) => void;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs: { id: MainTabId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'support', label: 'Support', icon: Headphones },
  ];

  return (
    <div className="w-full bg-[#0d0e15] border-t border-[#1a1c2a] py-2 px-6 flex items-center justify-around z-30 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center space-y-1 transition-all py-1 px-3 ${
              isActive ? 'text-[#9f86ff]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Icon size={20} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span
              className={`text-[11px] tracking-tight ${
                isActive ? 'font-bold text-[#c7b8ff]' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
