import React from 'react';
import { Wifi } from 'lucide-react';

interface StatusBarProps {
  time?: string;
  battery?: number;
  isTealBg?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  time = '11:03 AM',
  battery = 58,
  isTealBg = false,
}) => {
  return (
    <div
      className={`w-full px-5 pt-2 pb-1 flex items-center justify-between text-xs tracking-tight select-none z-30 transition-colors ${
        isTealBg ? 'text-[#17181C]' : 'text-[#17181C]'
      }`}
    >
      {/* Left: Time matching screenshot */}
      <div className="flex items-center space-x-1.5 font-medium">
        <span className="font-semibold tracking-normal text-[13px] text-[#17181C]">{time}</span>
      </div>

      {/* Right: VoLTE, 4G, Signal Bars, WiFi, Battery matching screenshot */}
      <div className="flex items-center space-x-2 text-[11px] text-[#17181C]">
        {/* VoLTE badge */}
        <div className="flex flex-col items-center leading-none text-[7px] font-bold border border-current px-0.5 py-[0.5px] rounded-[2px] opacity-85">
          <span>Vo</span>
          <span>LTE</span>
        </div>

        {/* 4G */}
        <span className="text-[10px] font-bold opacity-85">4G</span>

        {/* Signal Bars */}
        <div className="flex items-end space-x-[1.5px] h-3 opacity-85">
          <div className="w-[2px] h-1 bg-current rounded-xs"></div>
          <div className="w-[2px] h-1.5 bg-current rounded-xs"></div>
          <div className="w-[2px] h-2 bg-current rounded-xs"></div>
          <div className="w-[2px] h-2.5 bg-current rounded-xs"></div>
        </div>

        {/* WiFi */}
        <Wifi size={13} strokeWidth={2.4} className="opacity-90" />

        {/* Battery with percentage inside matching screenshot */}
        <div className="flex items-center space-x-1">
          <div className="relative w-5 h-2.5 border border-current rounded-[3px] p-[0.5px] flex items-center justify-center opacity-90">
            <span className="text-[7.5px] font-bold leading-none">{battery}</span>
            <div className="absolute -right-[2.5px] top-[1.5px] bottom-[1.5px] w-[1px] bg-current rounded-r-[1px]" />
          </div>
        </div>
      </div>
    </div>
  );
};
