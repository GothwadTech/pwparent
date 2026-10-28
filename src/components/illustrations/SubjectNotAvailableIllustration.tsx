import React from 'react';

/**
 * Pixel-perfect reproduction of the illustration from the reference screenshot:
 * A soft pale blue backdrop circle, a white scroll/document with curled top/bottom edges,
 * 3 horizontal lines, and a magnifying glass with translucent blue glass, rim highlight,
 * and dark slate handle examining the document.
 */
export const SubjectNotAvailableIllustration: React.FC<{ size?: number; className?: string }> = ({
  size = 96,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Soft circular background glow */}
      <circle cx="50" cy="50" r="42" fill="#E2EDFC" />

      {/* Main Document / Scroll */}
      <g transform="translate(30, 20)">
        {/* Curled top edge (scroll back) */}
        <path
          d="M3 6.5 C3 2, 7 0.5, 19 0.5 C31 0.5, 37 2, 37 6.5"
          fill="#788FA9"
        />
        <rect x="3" y="4.5" width="34" height="3" rx="1.5" fill="#6A819C" />

        {/* Paper body */}
        <rect
          x="5"
          y="6.5"
          width="30"
          height="45"
          rx="1"
          fill="#FFFFFF"
          stroke="#C8D6E5"
          strokeWidth="1.2"
        />

        {/* Curled bottom edge (scroll front roll) */}
        <path
          d="M3 49.5 C3 53.5, 9 55.5, 20 55.5 C31 55.5, 37 53.5, 37 49.5 L34 47 C25 49, 15 49, 6 47 Z"
          fill="#6A819C"
        />
        <rect x="3" y="49" width="34" height="3" rx="1.5" fill="#586E87" />

        {/* Horizontal text lines on the paper */}
        <rect x="11" y="22" width="18" height="2.2" rx="1.1" fill="#9FB1C7" />
        <rect x="11" y="28" width="18" height="2.2" rx="1.1" fill="#9FB1C7" />
        <rect x="11" y="34" width="11" height="2.2" rx="1.1" fill="#9FB1C7" />

        {/* Magnifying Glass examining the document */}
        <g transform="translate(8, 4)">
          {/* Glass fill - pale translucent blue */}
          <circle cx="11.5" cy="11.5" r="9.5" fill="#E2F1FE" fillOpacity="0.8" />

          {/* Glass rim */}
          <circle
            cx="11.5"
            cy="11.5"
            r="9.5"
            stroke="#475C76"
            strokeWidth="2.5"
          />

          {/* Glass glare arc on top-left */}
          <path
            d="M6.5 8.5 A7 7 0 0 1 12.5 5"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Magnifying glass handle extending down-right */}
          <path
            d="M18.5 18.5 L26 26"
            stroke="#475C76"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
};
