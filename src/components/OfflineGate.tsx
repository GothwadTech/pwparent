/**
 * OfflineGate — "no internet" said plainly, instead of a half-loaded screen.
 *
 * The app used to keep working offline: a thin strip apologised, the session
 * resumed from a local marker and Firestore served whatever it had cached. The
 * owner's instruction is the opposite now — without a network the app must NOT
 * pretend: no stale dashboard, no empty cards, no spinner that never ends. One
 * opaque screen, one sentence, one Retry.
 *
 * It covers the whole shell (including the login form, which cannot work
 * offline either), so nothing behind it is reachable by touch.
 *
 * Detection is `navigator.onLine` plus the `online`/`offline` events, and it is
 * re-checked when the page becomes visible: a WebView resumed after the phone
 * regained signal often fires no event at all.
 */
import React, {useEffect, useState} from 'react';

function onlineNow(): boolean {
  try {
    return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  } catch {
    return true;
  }
}

const WifiOffGlyph: React.FC = () => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8B8F96"
    strokeWidth="1.5"
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

export const OfflineGate: React.FC = () => {
  const [offline, setOffline] = useState<boolean>(() => !onlineNow());

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FFFFFF] px-8 text-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
    >
      <WifiOffGlyph />

      <h2 id="offline-title" className="mt-5 text-[18px] font-extrabold tracking-tight text-[#17181C]">
        No internet connection
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[#5B6169] max-w-[300px]">
        This app needs an internet connection to work. Turn on Wi-Fi or mobile
        data, then tap &ldquo;Retry&rdquo;.
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 px-8 py-3 rounded-xl bg-[#5A4BDA] hover:bg-[#4b3bc4] text-white text-[14px] font-bold transition-colors"
      >
        Retry
      </button>

      <p className="mt-4 text-[11px] text-[#8B8F96]">
        Your data is safe. It comes back the moment you are connected again.
      </p>
    </div>
  );
};

export default OfflineGate;
