# Offline behaviour in the WebView wrapper

The app ships inside `GothwadTech/pwparentapp`, an Android WebView container
that loads `TARGET_URL` (the Cloudflare Pages deployment of this repo).

## Wrapper audit — nothing missing there

Checked `MainActivity.kt` (2026-10-31): `domStorageEnabled = true` (so
localStorage/IndexedDB work), `ServiceWorkerController` configured for
background caching, `cacheMode = LOAD_CACHE_ELSE_NETWORK` when the device is
offline, cookie manager accepting, and a retry panel on main-frame failure.
The container is not the reason offline boots fell back to the login screen.

## What was actually broken (web app, fixed)

Reported symptom: *"net off karte hi login screen aa jati hai; net on karte hi
wapas login ho jata hai."*

1. **Firestore persistence was OFF.** The web SDK defaults to network-only
   reads. Offline, every `getDoc` failed with `unavailable`, so the boot could
   not read `parents/{uid}` or `credentials/{phone}` and the dashboard could
   not hydrate even when the session survived.
   → `src/lib/firebase/firestore.ts` now initialises with
   `persistentLocalCache` (+ multi-tab manager). Everything the app has read
   once online is served from IndexedDB offline; writes queue and flush on
   reconnect.

2. **Family-uid resolution collapsed offline.** `restoreSession()` maps the
   device's anonymous uid to the bound family uid via those two Firestore
   reads. Offline they came back empty, the raw device uid no longer matched
   the stored session marker (`marker.uid`), and the restore concluded
   "nobody logged in" → login screen. The moment signal returned, the reads
   succeeded and the same boot auto-logged-in again — exactly the reported
   behaviour.
   → `firebaseBackend.restoreSession()` now trusts the marker's uid **only
   while `navigator.onLine === false`** (`isOfflineNow()`), and the boot in
   `useAppData` has a final `offlineSessionFromMarker()` safety net. Online,
   the live resolution remains the only authority — a marker alone can never
   fake a login (rules still key on `request.auth.uid`).

3. **No honest offline state.** → `src/components/OfflineBanner.tsx`: a thin
   strip ("You're offline — showing saved data…") on every screen while the
   device reports no network; it disappears on reconnect, when Firestore
   reconciles by itself.

Tests: `src/tests/offline-session.spec.ts` (7 cases: marker trust offline,
auth-empty offline resume, no online faking, fresh-device offline = null).

## Preconditions on a real device

- The app must have been opened **once online** after logging in (that is what
  fills the IndexedDB cache and writes the session marker).
- The service worker must have installed (it does on first load; the wrapper's
  `ServiceWorkerController` settings support it) — that is what serves the app
  shell itself when offline.
- Data freshness offline = whatever was last synced. Nothing is invented;
  empty collections stay empty (no demo fallback on the Firebase path).
