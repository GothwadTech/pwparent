import React from 'react';

export const IllustrationSubjectAnalysis: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`relative w-full max-w-[340px] aspect-[4/3] mx-auto flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 380 290"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Soft background floating elements */}
        {/* Top-left bar chart card */}
        <g transform="translate(40, 60)">
          <rect width="42" height="28" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          <rect x="7" y="16" width="4" height="8" rx="1" fill="#60A5FA" />
          <rect x="15" y="10" width="4" height="14" rx="1" fill="#60A5FA" />
          <rect x="23" y="14" width="4" height="10" rx="1" fill="#60A5FA" />
          <rect x="31" y="7" width="4" height="17" rx="1" fill="#60A5FA" />
        </g>

        {/* Top stopwatch */}
        <g transform="translate(130, 48)">
          <circle cx="12" cy="12" r="10" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
          <path d="M12 4 L12 2" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 12 L17 12" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2" fill="#F43F5E" />
        </g>

        {/* Top-right video play badge */}
        <g transform="translate(250, 52)">
          <rect width="40" height="26" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          <polygon points="17,8 26,13 17,18" fill="#93C5FD" />
        </g>

        {/* Right upward line graph widget */}
        <g transform="translate(280, 100)">
          <rect width="48" height="32" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          <path d="M6 24 L16 18 L26 21 L36 10 L42 8" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polygon points="38,8 44,7 43,13" fill="#38BDF8" />
        </g>

        {/* Central Dashboard Monitor Window */}
        <g transform="translate(108, 72)">
          {/* Main White Canvas */}
          <rect width="168" height="110" rx="7" fill="#FFFFFF" />
          <rect x="0" y="0" width="168" height="18" rx="7" fill="#F1F5F9" />
          {/* Browser dots */}
          <circle cx="10" cy="9" r="2" fill="#CBD5E1" />
          <circle cx="16" cy="9" r="2" fill="#CBD5E1" />
          <circle cx="22" cy="9" r="2" fill="#CBD5E1" />

          {/* Left panel inside dashboard */}
          <circle cx="22" cy="36" r="8" fill="#93C5FD" />
          <rect x="36" y="32" width="30" height="4" rx="2" fill="#94A3B8" />
          <rect x="36" y="39" width="22" height="3" rx="1.5" fill="#CBD5E1" />

          {/* Donut progress mini */}
          <circle cx="48" cy="56" r="6" stroke="#F87171" strokeWidth="3" fill="none" />
          <circle cx="24" cy="56" r="6" stroke="#34D399" strokeWidth="3" fill="none" />

          {/* Bell Curve / Normal Distribution Graph Container */}
          <rect x="42" y="68" width="118" height="36" rx="3" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="1" />
          {/* Bell curve red fill & stroke */}
          <path
            d="M44 100 C58 99 64 96 74 84 C84 72 90 74 98 86 C104 94 116 99 158 100 Z"
            fill="#FB7185"
            opacity="0.75"
          />
          <path
            d="M44 100 C58 99 64 96 74 84 C84 72 90 74 98 86 C104 94 116 99 158 100"
            stroke="#E11D48"
            strokeWidth="2"
            fill="none"
          />
          {/* Plot points on the curve */}
          <circle cx="74" cy="84" r="2.5" fill="#BE123C" />
          <circle cx="82" cy="74" r="2.5" fill="#BE123C" />
          <circle cx="94" cy="82" r="2.5" fill="#BE123C" />
          <circle cx="108" cy="94" r="2" fill="#BE123C" />
        </g>

        {/* People Standing In Front of the Dashboard */}

        {/* 1. Father (Left) */}
        <g transform="translate(68, 90)">
          {/* Hair & Beard */}
          <circle cx="25" cy="22" r="10" fill="#78350F" />
          <circle cx="25" cy="24" r="8" fill="#FCD34D" />
          <path d="M18 20 C18 14 32 14 32 20 Z" fill="#78350F" />
          <path d="M19 26 C19 32 31 32 31 26 Z" fill="#78350F" />
          {/* Orange Sweater */}
          <path d="M12 36 L25 34 L38 36 L36 90 H14 L12 36 Z" fill="#EA580C" />
          {/* White inner collar */}
          <polygon points="22,34 25,40 28,34" fill="#FFFFFF" />
          {/* Blue Trousers */}
          <rect x="15" y="90" width="9" height="55" rx="2" fill="#1E3A8A" />
          <rect x="26" y="90" width="9" height="55" rx="2" fill="#1E3A8A" />
          {/* Shoes */}
          <ellipse cx="19" cy="146" rx="6" ry="3" fill="#451A03" />
          <ellipse cx="31" cy="146" rx="6" ry="3" fill="#451A03" />
        </g>

        {/* 2. Mother (Center-Left) */}
        <g transform="translate(104, 102)">
          {/* Brunette hair */}
          <circle cx="22" cy="18" r="9" fill="#92400E" />
          <circle cx="22" cy="20" r="7" fill="#FDE68A" />
          <path d="M14 18 C14 10 30 10 30 18 C30 26 26 28 22 28 Z" fill="#92400E" />
          {/* Yellow Top */}
          <path d="M12 30 L32 30 L35 70 H10 L12 30 Z" fill="#FBBF24" />
          {/* Pointing Right Hand */}
          <path d="M28 42 L48 35 L47 31 L26 38 Z" fill="#FDE68A" />
          {/* Teal Skirt */}
          <path d="M10 70 L35 70 L40 108 H6 L10 70 Z" fill="#0D9488" />
          {/* Legs */}
          <rect x="16" y="108" width="4" height="28" fill="#FDE68A" />
          <rect x="25" y="108" width="4" height="28" fill="#FDE68A" />
          {/* Shoes */}
          <ellipse cx="18" cy="138" rx="4" ry="2" fill="#BE185D" />
          <ellipse cx="27" cy="138" rx="4" ry="2" fill="#BE185D" />
        </g>

        {/* 3. Child (Right, pointing to chart) */}
        <g transform="translate(230, 126)">
          {/* Hair */}
          <circle cx="20" cy="16" r="8" fill="#1E293B" />
          <circle cx="20" cy="18" r="6" fill="#FDE68A" />
          {/* Bright Green T-shirt */}
          <path d="M10 27 L30 27 L28 65 H12 L10 27 Z" fill="#4ADE80" />
          {/* Pointing arm up towards the graph */}
          <path d="M12 35 L-8 16 L-10 19 L10 39 Z" fill="#FDE68A" />
          {/* Blue Pants */}
          <rect x="13" y="65" width="6" height="42" rx="1.5" fill="#3B82F6" />
          <rect x="21" y="65" width="6" height="42" rx="1.5" fill="#3B82F6" />
          {/* Shoes */}
          <ellipse cx="16" cy="108" rx="4" ry="2" fill="#0F172A" />
          <ellipse cx="24" cy="108" rx="4" ry="2" fill="#0F172A" />
        </g>
      </svg>
    </div>
  );
};
