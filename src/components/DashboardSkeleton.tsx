/**
 * DashboardSkeleton — the dashboard's shape, painted in shimmer while the
 * real data restores.
 *
 * WHY: boot used to flash the honest "No student record loaded" empty state
 * for the few hundred milliseconds between "session restored" and "children
 * hydrated" — every single open. The shell (header, bottom nav) is real and
 * already on screen; only the data blocks wear this light sweep, exactly the
 * "UI aa jata hai, data ek beat baad" pattern the owner asked for. Offline or
 * online, cache or network — the user always lands on the dashboard first.
 */
import React from 'react';

const Block: React.FC<{className: string}> = ({className}) => (
  <div className={`shimmer rounded-xl ${className}`} aria-hidden="true" />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="flex-1 w-full overflow-hidden px-4.5 pt-4 pb-4 select-none" aria-busy="true" aria-label="Loading dashboard">
    {/* Attendance header row: title + streak pill */}
    <div className="flex items-center justify-between">
      <Block className="h-6 w-36" />
      <Block className="h-6 w-24 rounded-full" />
    </div>

    {/* Donut */}
    <div className="shimmer w-[194px] h-[194px] rounded-full mx-auto mt-4 mb-3" aria-hidden="true" />

    {/* Lifetime counts */}
    <div className="grid grid-cols-2 gap-6 mt-6 mb-6">
      <div className="space-y-2">
        <Block className="h-6 w-16 mx-auto" />
        <Block className="h-3.5 w-24 mx-auto" />
      </div>
      <div className="space-y-2">
        <Block className="h-6 w-16 mx-auto" />
        <Block className="h-3.5 w-24 mx-auto" />
      </div>
    </div>

    {/* Weekly report: label, range row, seven day pills */}
    <Block className="h-5 w-28 mb-4" />
    <div className="flex items-center justify-between mb-5">
      <Block className="h-5 w-5 rounded-full" />
      <Block className="h-4 w-28" />
      <Block className="h-5 w-5 rounded-full" />
    </div>
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({length: 7}, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Block className="h-3 w-3 rounded-sm" />
          <Block className="w-8 h-[34px] rounded-[10px]" />
        </div>
      ))}
    </div>

    {/* First content card */}
    <Block className="h-24 w-full mt-6" />
  </div>
);

export default DashboardSkeleton;
