/**
 * Settings dock — the small pill in the bottom-right corner.
 *
 * Replaces the old DEMO badge. It still shows the live backend mode at a
 * glance (🟡 mock · 🟢 firebase · 🔴 misconfigured), and it is the entry point
 * the app needs for two things that have no other home on the phone layout:
 *
 *   • opening the Admin Panel
 *   • switching to a different phone number without logging out first
 *
 * Plus the Firestore read budget, because Spark's 50k/day is shared across
 * every visitor and should not be an invisible number.
 */
import React, {useEffect, useState} from 'react';
import {AlertTriangle, Database, KeyRound, LogOut, Phone, RefreshCw, Settings, X} from 'lucide-react';
import type {Backend} from '../lib/backend';
import {cacheStats} from '../lib/backend/readCache';
import type {AdminIdentity} from '../lib/adminAuth';
import {labelCls} from './admin/ui';

interface SettingsDockProps {
  backend: Backend | null;
  mode: 'mock' | 'firebase';
  uid: string | null;
  phone: string;
  admin: AdminIdentity | null;
  configError: string | null;
  onOpenAdmin: () => void;
  onSwitchNumber: () => void;
  onSignOut: () => void;
}

const DOT: Record<string, string> = {
  firebase: '#8ff0b0',
  mock: '#facc15',
  error: '#f87171',
};

const Row: React.FC<{label: string; value: React.ReactNode}> = ({label, value}) => (
  <div className="flex justify-between gap-3 text-xs">
    <span className="text-neutral-500">{label}</span>
    <span className="font-semibold text-right font-mono text-[11px] max-w-[62%] truncate">{value}</span>
  </div>
);

const Action: React.FC<{icon: React.ReactNode; label: string; hint?: string; onClick: () => void; danger?: boolean}> = ({
  icon,
  label,
  hint,
  onClick,
  danger,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors ${
      danger
        ? 'bg-[#FBE0E5] border-[#F3C1CB] hover:bg-[#FBE0E5] text-[#ff9bb3]'
        : 'bg-white border-[#E4E6EB] hover:bg-[#FFFFFF] text-[#17181C]'
    }`}
  >
    <span className={danger ? 'text-[#ff9bb3]' : 'text-[#8E75FF]'}>{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] font-semibold">{label}</span>
      {hint && <span className="block text-[11px] text-neutral-500 mt-0.5 leading-snug">{hint}</span>}
    </span>
  </button>
);

export const SettingsDock: React.FC<SettingsDockProps> = ({
  backend,
  mode,
  uid,
  phone,
  admin,
  configError,
  onOpenAdmin,
  onSwitchNumber,
  onSignOut,
}) => {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState(cacheStats());

  useEffect(() => {
    if (open) setStats(cacheStats());
  }, [open]);

  const dot = configError ? DOT.error : DOT[mode] ?? DOT.mock;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Settings"
        aria-label="Open settings"
        className="fixed bottom-3 right-3 z-40 inline-flex items-center gap-1.5 px-2.5 py-1
                   rounded-full bg-black/55 border border-[#E4E6EB] backdrop-blur-sm
                   text-[10px] font-semibold tracking-wide text-neutral-600
                   hover:text-neutral-900 hover:border-[#5747D6]/50 transition-colors select-none"
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: dot}} />
        <Settings size={11} />
        {configError ? 'setup' : mode}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs">
          <div className="w-full sm:max-w-sm max-h-[88dvh] overflow-y-auto bg-[#F4F5F7] border border-[#E4E6EB] sm:rounded-2xl rounded-t-2xl p-5 text-[#17181C] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Settings</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close settings"
                className="p-1.5 rounded-lg hover:bg-black/[0.03] text-neutral-600"
              >
                <X size={16} />
              </button>
            </div>

            {configError && (
              <p className="mb-4 text-[11px] leading-relaxed px-3 py-2.5 rounded-lg bg-[#FBF1D7] border border-[#F2DFA8] text-neutral-700">
                <AlertTriangle size={12} className="inline mr-1 -mt-0.5 text-[#facc15]" />
                {configError}
              </p>
            )}

            <p className={labelCls}>Session</p>
            <div className="space-y-1.5 mb-4 px-3.5 py-3 rounded-xl bg-white border border-[#E4E6EB]">
              <Row label="Backend" value={configError ? 'unconfigured' : mode} />
              <Row label="Number" value={phone ? `+91 ${phone}` : '—'} />
              <Row label="Admin" value={admin?.username ?? '—'} />
              <Row label="uid" value={uid ?? '—'} />
            </div>

            <p className={labelCls}>Firestore reads</p>
            <div className="space-y-1.5 mb-4 px-3.5 py-3 rounded-xl bg-white border border-[#E4E6EB]">
              <Row label="Network reads" value={stats.reads} />
              <Row label="Served from cache" value={stats.hits} />
              <Row label="Hit rate" value={stats.hitRate} />
              <button
                type="button"
                onClick={() => {
                  backend?.clearCache();
                  setStats(cacheStats());
                }}
                className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[#5747D6] hover:underline"
              >
                <RefreshCw size={11} /> Clear cache
              </button>
            </div>

            <div className="space-y-2">
              <Action
                icon={<KeyRound size={16} />}
                label="Admin Panel"
                hint={admin ? `Signed in as ${admin.username}` : 'Issue login codes, manage students'}
                onClick={() => {
                  setOpen(false);
                  onOpenAdmin();
                }}
              />
              <Action
                icon={<Phone size={16} />}
                label="Login with another number"
                hint="Any number that has a login code issued by an admin"
                onClick={() => {
                  setOpen(false);
                  onSwitchNumber();
                }}
              />
              <Action
                icon={<Database size={16} />}
                label="Reload data"
                hint="Bypass the cache and re-read from Firestore once"
                onClick={() => {
                  backend?.clearCache();
                  setStats(cacheStats());
                  window.location.reload();
                }}
              />
              {uid && (
                <Action
                  icon={<LogOut size={16} />}
                  label="Sign out"
                  onClick={() => {
                    setOpen(false);
                    onSignOut();
                  }}
                  danger
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
