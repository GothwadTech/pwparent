/**
 * Which build is this? — injected at build time, shown in Settings.
 *
 * The owner kept asking "naya version aaya ya purana chal raha hai?" and there
 * was no way to answer from inside the app: `APP_VERSION` existed in config but
 * was never painted anywhere. This module carries the version, the exact build
 * time and the commit that produced the bundle, so the answer is one tap away.
 *
 * The values are replaced textually by Vite's `define` (see vite.config.ts).
 * Outside a build — vitest, a stray `node` import — the identifier does not
 * exist, and `typeof` keeps that from throwing.
 */
declare const __PW_BUILD__: {version: string; time: string; commit: string} | undefined;

const injected = typeof __PW_BUILD__ === 'undefined' ? undefined : __PW_BUILD__;

export const BUILD_VERSION = injected?.version ?? 'dev';
export const BUILD_TIME = injected?.time ?? '';
export const BUILD_COMMIT = injected?.commit ?? '';

/** `1.0.0 · 23 Nov 15:42 · 672c44c` — short enough for a settings row. */
export function buildStamp(): string {
  const parts = [BUILD_VERSION];
  if (BUILD_TIME) {
    const date = new Date(BUILD_TIME);
    parts.push(
      Number.isNaN(date.getTime())
        ? BUILD_TIME
        : `${date.toLocaleDateString('en-IN', {day: '2-digit', month: 'short'})} ` +
            date.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: false}),
    );
  }
  if (BUILD_COMMIT) parts.push(BUILD_COMMIT);
  return parts.join(' · ');
}
