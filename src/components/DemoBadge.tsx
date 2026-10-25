/**
 * Demo-build marker.
 *
 * One small, unobtrusive pill. It exists so nobody mistakes this project for
 * the official Physics Wallah Parent's App, and it doubles as the entry point
 * to the Admin Panel (click it). Also reachable directly via `#admin` in the
 * URL, which is what the docs and README tell people to use.
 */
import React from 'react';
import {IS_DEMO_BUILD} from '../lib/config';

interface DemoBadgeProps {
  backendMode: 'mock' | 'firebase';
  onOpenAdmin: () => void;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({backendMode, onOpenAdmin}) => {
  if (!IS_DEMO_BUILD) return null;

  return (
    <button
      type="button"
      onClick={onOpenAdmin}
      title="Demo build — click to open the Admin Panel"
      className="fixed bottom-3 right-3 z-40 inline-flex items-center gap-1.5 px-2.5 py-1
                 rounded-full bg-black/55 border border-white/10 backdrop-blur-sm
                 text-[10px] font-semibold tracking-wide text-neutral-400
                 hover:text-white hover:border-[#8E75FF]/50 transition-colors select-none"
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{backgroundColor: backendMode === 'firebase' ? '#8ff0b0' : '#facc15'}}
      />
      DEMO · {backendMode} · admin
    </button>
  );
};
