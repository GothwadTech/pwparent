import React from 'react';
import { Wifi } from 'lucide-react';

interface StatusBarProps {
  time?: string;
  battery?: number;
  isTealBg?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  time = '6:04',
  battery = 56,
  isTealBg = false,
}) => {
  return (
    <div
      className={`w-full px-5 pt-3 pb-1 flex items-center justify-between text-xs tracking-tight select-none z-30 transition-colors ${
        isTealBg ? 'text-white/95' : 'text-neutral-200'
      }`}
    >
      {/* Left: Time and Notification badge */}
      <div className="flex items-center space-x-1.5 font-medium">
        <span className="font-semibold tracking-normal text-[13px]">{time}</span>
        <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center text-white">
          1
        </span>
      </div>

      {/* Right: Network, VoLTE, Speed, WiFi, Battery */}
      <div className="flex items-center space-x-2 text-[11px]">
        {/* VoLTE badge */}
        <div className="flex flex-col items-center leading-none text-[8px] font-bold border border-current px-0.5 rounded-[2px] opacity-80">
          <span>Vo</span>
          <span>LTE</span>
        </div>

        {/* Speed */}
        <span className="text-[9px] opacity-75 font-mono">0.41 KB/s</span>

        {/* WiFi */}
        <Wifi size={13} strokeWidth={2.4} />

        {/* Signal Bars */}
        <div className="flex items-end space-x-[1.5px] h-3">
          <div className="w-[2.5px] h-1 bg-current rounded-xs"></div>
          <div className="w-[2.5px] h-1.5 bg-current rounded-xs"></div>
          <div className="w-[2.5px] h-2 bg-current rounded-xs"></div>
          <div className="w-[2.5px] h-2.5 bg-current rounded-xs"></div>
        </div>

        {/* Battery with percentage */}
        <div className="flex items-center space-x-1">
          <div className="relative w-4 h-2.5 border border-current rounded-[3px] p-[1px] flex items-center">
            <div
              className="h-full bg-current rounded-[1px]"
              style={{ width: `${battery}%` }}
            />
            <div className="absolute -right-0.5 top-0.5 bottom-0.5 w-0.5 bg-current rounded-r-[1px]" />
          </div>
          <span className="font-medium text-[11px]">{battery}%</span>
        </div>
      </div>
    </div>
  );
};
