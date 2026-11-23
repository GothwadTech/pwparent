/**
 * "The app must be on the newest build" — done entirely from the web.
 *
 * ── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
 * The service worker used to answer every navigation from its precache, and the
 * generated registration was a bare `register('/sw.js')` with no update step.
 * A deploy therefore reached the phone only on the SECOND launch: the first one
 * painted the old bundle, the new service worker activated quietly behind it,
 * and nobody reloaded the page. That is exactly "purana code ka result dikhta
 * hai" — and the fix has to live in the web app, because the Android wrapper
 * only loads this URL.
 *
 * ── WHAT IT DOES ───────────────────────────────────────────────────────────
 *   1. registers `/sw.js` with `updateViaCache: 'none'`, so a new worker is
 *      always fetched from the network rather than the HTTP cache;
 *   2. reloads ONCE when a new worker takes control — guarded so the very first
 *      install (which also fires `controllerchange`) never reloads a live page;
 *   3. asks for an update check when the app returns to the foreground, when the
 *      network comes back, and every couple of minutes while visible. A WebView
 *      is rarely killed, so "on resume" is the check that matters most;
 *   4. never throws: a blocked service worker (private mode, an old WebView)
 *      leaves the app running exactly as it did.
 *
 * The navigation strategy in vite.config.ts is NetworkFirst, so an online launch
 * fetches fresh HTML even before any of this runs; the reload covers the case
 * where the app is already open when a deploy lands.
 */

/** How often a visible page asks the browser for a new service worker. */
const UPDATE_CHECK_MS = 2 * 60 * 1000;

/**
 * Should a `controllerchange` reload the page?
 *
 * Only when a controller already existed: the first install swaps from "no
 * controller" to one, and reloading for that would restart the app on a user's
 * very first visit for no reason.
 */
export function shouldReloadOnControllerChange(hadController: boolean): boolean {
  return hadController;
}

export function installServiceWorkerUpdates(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const container = navigator.serviceWorker;
  const hadController = Boolean(container.controller);
  let reloading = false;

  container.addEventListener('controllerchange', () => {
    if (!shouldReloadOnControllerChange(hadController) || reloading) return;
    reloading = true;
    // `reload()` keeps the URL and the session; the new worker serves the new
    // precache, so this is the one reload that actually lands the new build.
    window.location.reload();
  });

  const register = () => {
    void container
      .register('/sw.js', {scope: '/', updateViaCache: 'none'})
      .then((registration) => {
        const check = () => {
          void registration.update().catch(() => undefined);
        };

        // A WebView is resumed far more often than it is restarted.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check();
        });
        window.addEventListener('online', check);
        window.setInterval(() => {
          if (document.visibilityState === 'visible') check();
        }, UPDATE_CHECK_MS);
      })
      .catch(() => {
        // No service worker: the app still runs, it just loses the offline shell.
      });
  };

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}
