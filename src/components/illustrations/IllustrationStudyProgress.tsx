import React from 'react';

export const IllustrationStudyProgress: React.FC<{ className?: string }> = ({
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
        {/* Ground shadow ellipse */}
        <ellipse cx="190" cy="255" rx="140" ry="18" fill="#1e2230" opacity="0.6" />

        {/* Big Letter 'A' in soft blue */}
        <path
          d="M175 60 L140 200 H165 L173 165 H202 L210 200 H235 L200 60 H175 Z M178 142 L187.5 98 L197 142 H178 Z"
          fill="#3B82F6"
          opacity="0.85"
        />

        {/* Paper Airplane in coral pink */}
        <g transform="translate(240, 50) rotate(-15)">
          <path d="M0 0 L32 10 L12 18 Z" fill="#F43F5E" />
          <path d="M12 18 L32 10 L16 26 Z" fill="#FB7185" />
          <path d="M12 18 L16 26 L10 24 Z" fill="#E11D48" />
          {/* Dashed trail */}
          <path
            d="M-30 25 Q-15 15 -2 5"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.6"
          />
        </g>

        {/* Circular yellow notepad badge */}
        <g transform="translate(68, 85)">
          <circle cx="36" cy="36" r="34" fill="#FBBF24" />
          <rect x="18" y="24" width="36" height="4" rx="2" fill="#FFFFFF" />
          <rect x="18" y="32" width="36" height="4" rx="2" fill="#FFFFFF" />
          <rect x="18" y="40" width="26" height="4" rx="2" fill="#FFFFFF" />
          <rect x="18" y="48" width="32" height="4" rx="2" fill="#FFFFFF" />
        </g>

        {/* Huge Open Book */}
        {/* Pink/Magenta Outer Cover */}
        <path
          d="M70 230 C120 226 170 216 190 228 C210 216 260 226 310 230 C300 245 250 248 190 238 C130 248 80 245 70 230 Z"
          fill="#E11D48"
        />
        {/* Left Book Pages (Curved 3D open book) */}
        <path
          d="M75 224 C110 218 155 204 188 220 L188 206 C155 190 110 204 75 210 Z"
          fill="#FFFFFF"
        />
        <path
          d="M75 212 C110 206 155 192 188 208 L188 194 C155 178 110 192 75 198 Z"
          fill="#F8FAFC"
        />
        {/* Right Book Pages */}
        <path
          d="M305 224 C270 218 225 204 192 220 L192 206 C225 190 270 204 305 210 Z"
          fill="#FFFFFF"
        />
        <path
          d="M305 212 C270 206 225 192 192 208 L192 194 C225 178 270 192 305 198 Z"
          fill="#F1F5F9"
        />

        {/* Girl Studying over the book */}
        <g transform="translate(130, 95)">
          {/* Hair back */}
          <circle cx="45" cy="38" r="22" fill="#1E293B" />
          {/* Girl's face */}
          <circle cx="46" cy="40" r="15" fill="#FECDD3" />
          {/* Hair front / ponytail */}
          <path d="M30 30 C34 20 54 18 62 26 C60 22 66 18 68 25 C64 42 46 44 30 30 Z" fill="#0F172A" />
          <path d="M62 26 C72 20 80 32 75 42 C70 48 64 35 62 26 Z" fill="#0F172A" />
          {/* Glasses in red/coral */}
          <rect x="36" y="36" width="9" height="7" rx="2" fill="none" stroke="#E11D48" strokeWidth="2" />
          <rect x="47" y="36" width="9" height="7" rx="2" fill="none" stroke="#E11D48" strokeWidth="2" />
          <line x1="45" y1="40" x2="47" y2="40" stroke="#E11D48" strokeWidth="2" />
          {/* Cheerful blush */}
          <circle cx="38" cy="45" r="2" fill="#F43F5E" opacity="0.6" />
          <circle cx="53" cy="45" r="2" fill="#F43F5E" opacity="0.6" />
          {/* Blue shirt & arms reaching onto book */}
          <path
            d="M32 58 C26 70 20 86 16 98 L56 102 C60 88 56 68 48 58 Z"
            fill="#3B82F6"
          />
          {/* Arms holding the book edge */}
          <path
            d="M16 94 C22 98 42 98 48 94 C46 90 28 88 16 94 Z"
            fill="#FECDD3"
          />
        </g>

        {/* Left Stack of Colorful Notebooks + Red Apple */}
        <g transform="translate(90, 218)">
          {/* Book 1 (Cyan) */}
          <rect x="0" y="24" width="60" height="7" rx="1.5" fill="#06B6D4" />
          {/* Book 2 (Yellow) */}
          <rect x="3" y="16" width="54" height="7" rx="1.5" fill="#F59E0B" />
          {/* Book 3 (Mint) */}
          <rect x="6" y="8" width="50" height="7" rx="1.5" fill="#10B981" />
          {/* Red Apple on top */}
          <circle cx="32" cy="0" r="7" fill="#EF4444" />
          <path d="M32 -7 Q36 -12 39 -10" stroke="#15803D" strokeWidth="2" fill="none" />
          <path d="M35 -8 Q40 -9 38 -5 Z" fill="#22C55E" />
        </g>

        {/* Right Potted Succulent Plant */}
        <g transform="translate(262, 192)">
          {/* Purple Flower Pot */}
          <path d="M12 40 L16 70 H36 L40 40 Z" fill="#6366F1" />
          <rect x="10" y="36" width="32" height="6" rx="2" fill="#4F46E5" />
          {/* Green Plant Leaves */}
          <path d="M26 36 C18 20 8 26 12 36 Z" fill="#10B981" />
          <path d="M26 36 C34 16 46 22 38 36 Z" fill="#059669" />
          <path d="M26 36 C24 8 28 8 26 36 Z" fill="#34D399" />
          <path d="M26 36 C16 12 36 12 26 36 Z" fill="#10B981" />
        </g>
      </svg>
    </div>
  );
};
