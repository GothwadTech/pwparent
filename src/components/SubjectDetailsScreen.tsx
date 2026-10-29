import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { SubjectNotAvailableIllustration } from './illustrations/SubjectNotAvailableIllustration';
import { HEADER_BG, SECTION_BAND, TEXT_PRIMARY } from '../lib/uiTheme';

interface SubjectDetailsScreenProps {
  title?: string;
  onBack: () => void;
}

/**
 * Pixel-perfect reproduction of the "Test Details" / "Subject Details" empty screen
 * from the user's reference screenshot:
 *
 * - Header: Back chevron `<` + Bold title "Test Details"
 * - Section divider: Neutral light-gray band
 * - Rounded card: Soft blue-gray `#EEF2F6` container with curled document + magnifying glass illustration
 * - Text: "Sorry!, Subject wise data is not available yet."
 * - Rest of the screen is clean, empty white space.
 */
export const SubjectDetailsScreen: React.FC<SubjectDetailsScreenProps> = ({
  title = 'Test Details',
  onBack,
}) => {
  return (
    <div
      className="w-full h-full flex flex-col bg-white select-none"
      style={{ background: '#FFFFFF' }}
    >
      {/* Top Header */}
      <header
        className="shrink-0 px-4 pt-4 pb-3.5 flex items-center space-x-3.5"
        style={{ background: HEADER_BG }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="p-1 -ml-1 text-[#17181C] hover:opacity-75 transition-opacity"
        >
          <ChevronLeft size={24} strokeWidth={2.6} style={{ color: TEXT_PRIMARY }} />
        </button>
        <h1
          className="text-[18px] font-extrabold tracking-tight leading-none"
          style={{ color: TEXT_PRIMARY }}
        >
          {title}
        </h1>
      </header>

      {/* Neutral divider band */}
      <div className="shrink-0 h-2 w-full" style={{ background: SECTION_BAND }} />

      {/* Screen Body: Card at top, rest empty white */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-6 pb-8 bg-white">
        <div className="w-full rounded-2xl bg-[#EEF2F6] pt-10 pb-11 px-6 flex flex-col items-center justify-center text-center">
          <SubjectNotAvailableIllustration size={96} />
          <p className="mt-7 text-[15px] font-medium text-[#2D3748] max-w-[290px] leading-snug">
            Sorry!, Subject wise data is not available yet.
          </p>
        </div>
      </div>
    </div>
  );
};
