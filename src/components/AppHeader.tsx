import React from 'react';
import { PWLogo } from './PWLogo';

interface AppHeaderProps {
  showHowItWorks?: boolean;
  onHowItWorksClick?: () => void;
  customLogoUrl?: string | null;
  onLogoClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showHowItWorks = false,
  onHowItWorksClick,
  customLogoUrl,
  onLogoClick,
}) => {
  return (
    <header className="w-full px-5 pt-3 pb-2 flex items-center justify-between z-20">
      {/* Brand: PW circular logo + Parent's App */}
      <div
        className="flex items-center space-x-3 cursor-pointer group"
        onClick={onLogoClick}
        title="Tap to view or change logo"
      >
        <div className="text-[#17181C] group-hover:scale-105 transition-transform">
          <PWLogo size={36} customLogoUrl={customLogoUrl} />
        </div>
        <span className="text-[20px] font-bold tracking-tight text-[#17181C] font-['Plus_Jakarta_Sans',sans-serif]">
          Parent's App
        </span>
      </div>

      {/* Right Action: How it works */}
      {showHowItWorks && (
        <button
          type="button"
          onClick={onHowItWorksClick}
          className="px-3 py-1 rounded-md border border-[#2e313d] bg-[#161822]/80 hover:bg-[#202330] text-neutral-800 text-[12px] font-medium transition-all active:scale-95"
        >
          How it works
        </button>
      )}
    </header>
  );
};
