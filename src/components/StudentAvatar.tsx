import React from 'react';

interface StudentAvatarProps {
  type: 'boy' | 'add';
  size?: number;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  type,
  size = 72,
}) => {
  if (type === 'add') {
    return (
      <div
        style={{ width: size, height: size }}
        className="relative rounded-full bg-[#1e202f] border-2 border-dashed border-[#383c52] flex items-center justify-center text-neutral-400 group-hover:border-[#8E75FF] group-hover:text-[#8E75FF] transition-all"
      >
        {/* Child silhouette */}
        <svg
          width={size * 0.65}
          height={size * 0.65}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="20" cy="14" r="7" fill="#4B526D" opacity="0.6" />
          <path
            d="M8 34 C8 26 13 23 20 23 C27 23 32 26 32 34 Z"
            fill="#4B526D"
            opacity="0.6"
          />
        </svg>

        {/* Plus badge in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#2a2c3f] border border-[#444863] flex items-center justify-center text-white text-sm font-bold shadow-md">
            +
          </div>
        </div>
      </div>
    );
  }

  // Cute cartoon boy avatar matching screenshots
  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full overflow-hidden bg-[#BFDBFE] flex items-center justify-center shadow-inner"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sky blue background circle */}
        <rect width="100" height="100" rx="50" fill="#BAE6FD" />

        {/* Brown hair back */}
        <circle cx="50" cy="46" r="30" fill="#854D0E" />

        {/* Face */}
        <circle cx="50" cy="50" r="23" fill="#FED7AA" />

        {/* Cute blush cheeks */}
        <circle cx="36" cy="54" r="3.5" fill="#F87171" opacity="0.65" />
        <circle cx="64" cy="54" r="3.5" fill="#F87171" opacity="0.65" />

        {/* Friendly eyes */}
        <ellipse cx="40" cy="48" rx="2.5" ry="3.5" fill="#1E293B" />
        <ellipse cx="60" cy="48" rx="2.5" ry="3.5" fill="#1E293B" />
        {/* Eye highlights */}
        <circle cx="39" cy="46.5" r="1" fill="#FFFFFF" />
        <circle cx="59" cy="46.5" r="1" fill="#FFFFFF" />

        {/* Soft smile */}
        <path
          d="M46 56 Q50 60 54 56"
          stroke="#9A3412"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Stylish brown hair fringe */}
        <path
          d="M26 42 C28 26 44 24 50 24 C56 24 72 26 74 42 C70 34 62 32 56 36 C50 40 42 32 36 38 C32 35 28 38 26 42 Z"
          fill="#78350F"
        />

        {/* Body: Light blue school uniform with red tie and white collar */}
        <path
          d="M22 100 C24 82 34 74 50 74 C66 74 76 82 78 100 Z"
          fill="#38BDF8"
        />
        {/* White shirt triangle */}
        <polygon points="42,74 50,86 58,74" fill="#FFFFFF" />
        {/* Red tie */}
        <polygon points="48,78 52,78 54,92 50,96 46,92" fill="#EF4444" />
      </svg>
    </div>
  );
};
