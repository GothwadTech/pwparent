/**
 * OfflineBanner — the one honest sentence the app says about connectivity.
 *
 * WHY IT EXISTS
 * The app now survives airplane mode: the session resumes from the local
 * marker and Firestore serves the last-synced documents from its persistent
 * IndexedDB cache. But "silently showing stale data" is exactly the lie this
 * app refuses to tell, so while the network is down a thin strip says so —
 * and disappears the moment the reconnect happens (no button, no action;
 * Firestore reconciles by itself).
 *
 * Mounted at the very top of the scaled shell (App.tsx) so it appears above
 * every screen, login included: offline, even the login form cannot work, and
 * the strip explains why before the user blames the app.
 */
import React, {useEffect, useState} from 'react';

/** A drawn wifi-off glyph — the design language is SVG icons, never emoji. */
const WifiOffIcon: React.FC<{size?: number}> = ({size = 14}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#7B7F86"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 8.8a16 16 0 0 1 4.2-2.3" />
    <path d="M8.5 5.2A16 16 0 0 1 12 4.8c4.4 0 8.4 1.7 11.4 4.5" />
    <path d="M5 12.4a11 11 0 0 1 2.6-1.6" />
    <path d="M12 9.8c1.9 0 3.7.6 5.2 1.7" />
    <path d="M8.5 16a6 6 0 0 1 3.3-1.4" />
    <path d="M12 20h.01" />
    <path d="M3 3l18 18" />
  </svg>
);

function onlineNow(): boolean {
  try {
    return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  } catch {
    return true;
  }
}

export const OfflineBanner: React.FC = () => {
  const [offline, setOffline] = useState<boolean>(() => !onlineNow());

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    // Correct a state that changed while the page was hidden (WebView resume).
    const recheck = () => setOffline(!onlineNow());
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#F3F3F3] border-b border-[#E4E6EB]/60"
      role="status"
      aria-live="polite"
    >
      <WifiOffIcon />
      <p className="text-[11px] font-semibold text-[#475257] leading-tight text-center">
        You&apos;re offline — showing saved data. It syncs when you reconnect.
      </p>
    </div>
  );
};

export default OfflineBanner;
