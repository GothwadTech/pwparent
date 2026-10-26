/**
 * Admin → Data tab.
 *
 * Diagnostics and cache control. The Firestore read counter is the reason this
 * tab exists: Spark allows 50k reads/day shared across every visitor, so the
 * effect of the read cache should be visible rather than assumed.
 */
import React, {useState} from 'react';
import {LogOut, RefreshCw, Trash2} from 'lucide-react';
import type {Backend} from '../../lib/backend';
import {cacheStats, resetCache} from '../../lib/backend/readCache';
import {clearDemoStore} from '../../lib/backend/demoStore';
import type {AdminIdentity} from '../../lib/adminAuth';
import {logoutAdmin} from '../../lib/adminAuth';
import {btnDanger, btnGhost, btnPrimary, cardCls, labelCls, Note} from './ui';

interface DataTabProps {
  backend: Backend;
  mode: 'mock' | 'firebase';
  uid: string | null;
  admin: AdminIdentity | null;
  announcementCount: number;
  configError: string | null;
  flash: (message: string) => void;
}

const Row: React.FC<{label: string; value: React.ReactNode; mono?: boolean}> = ({label, value, mono}) => (
  <div className="flex justify-between gap-3">
    <dt className="text-neutral-500">{label}</dt>
    <dd className={`font-semibold text-right ${mono ? 'font-mono text-[11px] max-w-[62%] truncate' : ''}`}>{value}</dd>
  </div>
);

export const DataTab: React.FC<DataTabProps> = ({
  backend,
  mode,
  uid,
  admin,
  announcementCount,
  configError,
  flash,
}) => {
  const [stats, setStats] = useState(cacheStats());

  const refresh = () => setStats(cacheStats());

  return (
    <>
      {configError && (
        <Note tone="warn">
          <strong className="text-[#facc15]">Firebase is not configured.</strong> {configError}
        </Note>
      )}

      <div className={cardCls}>
        <p className={labelCls}>Session</p>
        <dl className="text-xs space-y-1.5">
          <Row label="Backend mode" value={mode} />
          <Row label="Admin" value={admin ? admin.username : mode === 'firebase' ? '—' : 'passcode (local)'} />
          <Row label="uid" value={uid ?? '— (not signed in)'} mono />
          <Row label="Announcements" value={announcementCount} />
        </dl>
      </div>

      <div className={cardCls}>
        <div className="flex items-center justify-between mb-2">
          <p className={`${labelCls} mb-0`}>Firestore reads</p>
          <button type="button" className={btnGhost} onClick={refresh}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
        <dl className="text-xs space-y-1.5">
          <Row label="Network reads" value={stats.reads} />
          <Row label="Served from cache" value={stats.hits} />
          <Row label="Hit rate" value={stats.hitRate} />
          <Row label="Cached keys" value={stats.entries} />
        </dl>
        <p className="mt-2.5 text-[11px] text-neutral-500 leading-relaxed">
          Spark allows 50,000 reads/day across every visitor. Navigation re-uses cached values (60s TTL) and
          concurrent mounts are de-duplicated into one read, so moving between screens costs nothing.
        </p>
        <button
          type="button"
          className={`${btnGhost} w-full mt-2.5`}
          onClick={() => {
            // Drops cached reads only. Stored data is untouched — that is the
            // whole point of separating this from the button below.
            backend.clearCache();
            resetCache();
            setStats(cacheStats());
            flash('Read cache cleared. Stored data is untouched.');
          }}
        >
          <RefreshCw size={12} /> Clear read cache
        </button>
      </div>

      {mode === 'mock' && (
        <>
          <button
            type="button"
            className={`${btnDanger} w-full py-3`}
            onClick={() => {
              // Destructive, mock-mode only, and deliberately a separate
              // control from "clear read cache" above.
              clearDemoStore();
              resetCache();
              setStats(cacheStats());
              flash('Local demo store cleared — reload to start empty.');
            }}
          >
            <Trash2 size={14} /> Delete all local data
          </button>
          <Note>
            Mock mode keeps everything in this browser&apos;s localStorage only. Nothing is sent anywhere, and this
            button is the only thing that deletes it.
          </Note>
        </>
      )}

      {admin && (
        <button
          type="button"
          className={`${btnPrimary} w-full py-3`}
          onClick={() => {
            void logoutAdmin().then(() => flash('Signed out of the admin account.'));
          }}
        >
          <LogOut size={14} /> Sign out of admin account
        </button>
      )}
    </>
  );
};
