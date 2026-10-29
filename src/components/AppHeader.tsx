import React from 'react';
import { Info } from 'lucide-react';
import { PWLogo } from './PWLogo';

interface AppHeaderProps {
  showHowItWorks?: boolean;
  onHowItWorksClick?: () => void;
  /** Opens the settings / Firestore panel. Renders the (i) door for it. */
  onOpenSettings?: () => void;
  customLogoUrl?: string | null;
  onLogoClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showHowItWorks = false,
  onHowItWorksClick,
  onOpenSettings,
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
        <span className="text-[20px] font-bold tracking-tight text-[#17181C]">
          Parent's App
        </span>
      </div>

      {/* Right actions: the (i) door into settings, then How it works */}
      {showHowItWorks && (
        <div className="flex items-center gap-2">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="App info and settings"
              title="App info and settings"
              className="w-7 h-7 rounded-full border border-[#E4E6EB] bg-[#FFFFFF]/80 hover:bg-[#FFFFFF] text-[#5A4BDA] flex items-center justify-center transition-all active:scale-95"
            >
              <Info size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={onHowItWorksClick}
            className="px-3 py-1 rounded-md border border-[#E4E6EB] bg-[#FFFFFF]/80 hover:bg-[#FFFFFF] text-neutral-800 text-[12px] font-medium transition-all active:scale-95"
          >
            How it works
          </button>
        </div>
      )}
    </header>
  );
};
