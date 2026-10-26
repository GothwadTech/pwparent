/**
 * The "no tests yet" illustration — a light scroll with a pen, on a soft blue
 * blob, matching the reference empty state. Pure SVG, no assets.
 */
import React from 'react';

export const NoTestsIllustration: React.FC<{ size?: number }> = ({ size = 92 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <ellipse cx="62" cy="62" rx="46" ry="34" fill="#DCEBFA" />
    {/* scroll body */}
    <path
      d="M40 26h34a6 6 0 0 1 6 6v52a8 8 0 0 1-8 8H40a6 6 0 0 1-6-6V32a6 6 0 0 1 6-6Z"
      fill="#FFFFFF"
      stroke="#8FA6C9"
      strokeWidth="3"
    />
    {/* rolled top */}
    <path d="M40 26h34a6 6 0 0 1 6 6v6H34v-6a6 6 0 0 1 6-6Z" fill="#C9D8EC" stroke="#8FA6C9" strokeWidth="3" />
    {/* ruled lines */}
    <path d="M44 48h26M44 58h26M44 68h18" stroke="#B7C6DC" strokeWidth="3" strokeLinecap="round" />
    {/* pen */}
    <path d="M62 44l10-10 6 6-10 10-7 1 1-7Z" fill="#7E9BC4" stroke="#5F7CA6" strokeWidth="2" />
  </svg>
);
