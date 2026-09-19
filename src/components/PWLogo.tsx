import React from 'react';

interface PWLogoProps {
  size?: number;
  className?: string;
  customLogoUrl?: string | null;
  showFamily?: boolean;
}

export const PWLogo: React.FC<PWLogoProps> = ({
  size = 44,
  className = '',
  customLogoUrl,
  showFamily = false,
}) => {
  const logoSource = customLogoUrl || '/assets/ic_launcher_round.webp';

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* PW Circular Emblem / Image Logo */}
      <div
        className="flex items-center justify-center overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        <img
          src={logoSource}
          alt="PW Logo"
          onError={(e) => {
            // Fallback to round webp or svg if needed
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
          className="w-full h-full object-contain rounded-full drop-shadow-md"
        />
      </div>

      {/* Family Vector Silhouette for Splash Screen */}
      {showFamily && (
        <div className="mt-8 flex flex-col items-center">
          <svg
            width={size * 1.3}
            height={size * 0.9}
            viewBox="0 0 160 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Father (Left) */}
            <g fill="white">
              {/* Head */}
              <circle cx="42" cy="20" r="10.5" />
              {/* Torso and arms */}
              <path d="M26 38 C26 35 29 33 34 33 H50 C55 33 58 35 58 38 V66 H51 V102 H45 V68 H39 V102 H33 V66 H26 V38 Z" />
              {/* Extended right hand holding child's hand */}
              <path d="M54 44 L66 60 L62 63 L51 48 Z" />
            </g>

            {/* Child (Center) */}
            <g fill="white">
              {/* Head */}
              <circle cx="80" cy="42" r="8" />
              {/* Torso and Legs */}
              <path d="M72 55 C72 53 74 52 77 52 H83 C86 52 88 53 88 55 V75 H85 V102 H81 V76 H79 V102 H75 V75 H72 V55 Z" />
              {/* Arms raised up to hold parents' hands */}
              <path d="M72 56 L64 61 L62 57 L72 53 Z" />
              <path d="M88 56 L96 61 L98 57 L88 53 Z" />
            </g>

            {/* Mother (Right) */}
            <g fill="white">
              {/* Head */}
              <circle cx="118" cy="20" r="10.5" />
              {/* Dress / Body */}
              <path d="M102 38 C102 35 105 33 110 33 H126 C131 33 134 35 134 38 L138 78 H98 L102 38 Z" />
              {/* Legs */}
              <rect x="110" y="78" width="6" height="24" rx="2" />
              <rect x="120" y="78" width="6" height="24" rx="2" />
              {/* Extended left hand holding child's hand */}
              <path d="M106 44 L94 60 L98 63 L109 48 Z" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};
