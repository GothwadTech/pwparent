import {execSync} from 'node:child_process';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';

/**
 * Which build is this? Stamped into the bundle so Settings can show it.
 *
 * Cloudflare Pages exports the commit; a local build falls back to git; with
 * neither (a tarball) the version alone is enough.
 */
const buildCommit = (
  process.env.CF_PAGES_COMMIT_SHA ??
  (() => {
    try {
      return execSync('git rev-parse --short HEAD', {stdio: ['ignore', 'pipe', 'ignore']})
        .toString()
        .trim();
    } catch {
      return '';
    }
  })()
).slice(0, 7);

const buildStamp = {
  version: process.env.npm_package_version ?? '1.0.0',
  time: new Date().toISOString(),
  commit: buildCommit,
};

/**
 * Build config.
 *
 * Two constraints matter here and are easy to break:
 *
 * 1. Cloudflare Pages rejects a `wrangler.jsonc` with an `assets` block, so the
 *    build output directory is declared there only. Never re-add `assets`.
 * 2. Pages switches OUT of SPA mode if `dist/404.html` or `dist/200.html`
 *    exists, which breaks deep links. `scripts/check-build-output.mjs` guards
 *    this after every build — vite-plugin-pwa's service worker uses a
 *    navigation route, not a 404 file, so it is safe.
 *
 * `server.allowedHosts` is DEV-only and never affects a production build.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registration lives in src/lib/swUpdate.ts: it also reloads once when a
      // new worker takes control, which is what makes a deploy land on an app
      // that is already open. A bare injected `register()` never did that.
      injectRegister: false,
      // No manual <link rel="manifest"> needed — this is injected.

      includeAssets: ['icons/favicon-32x32.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'PW Parent App',
        short_name: 'PW Parent',
        description:
          'Batch and test tracking for Physics Wallah batches — attendance, DPPs, scorecards and purchases.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#F4F5F7',
        background_color: '#F4F5F7',
        categories: ['education', 'productivity'],
        icons: [
          {src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
          {src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
          {src: '/icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
        ],
      },
      workbox: {
        // Precache the hashed build output only.
        globPatterns: ['**/*.{js,css,html,webp,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // ── NEWEST BUILD FIRST ──────────────────────────────────────────────
        // `navigateFallback` used to answer every navigation from the precache,
        // so the first launch after a deploy painted the OLD bundle and the new
        // worker only took over silently behind it. Navigation is NetworkFirst
        // now: online always means the newest HTML (and therefore the newest
        // hashed JS), and the precached shell is only the offline fallback.
        navigateFallback: undefined,
        runtimeCaching: [
          {
            // The app shell: network first, cache only when the network fails.
            // `networkTimeoutSeconds` keeps a dead captive portal from hanging
            // the launch; the precached index.html covers the offline case.
            urlPattern: ({request}: {request: Request}) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pw-html',
              networkTimeoutSeconds: 5,
              expiration: {maxEntries: 4},
              precacheFallback: {fallbackURL: 'index.html'},
            },
          },
          {
            // Images and illustrations: cache-first, they are immutable.
            urlPattern: ({url, sameOrigin}) => sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pw-assets',
              expiration: {maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30},
            },
          },
          {
            // Firebase Auth + Firestore must NEVER be served from the service
            // worker cache. A cached credential or a stale scorecard would be
            // both wrong and a security hole. The in-app read cache
            // (src/lib/backend/readCache.ts) is the layer that saves reads.
            urlPattern: ({url}) =>
              /(^|\.)googleapis\.com$/.test(url.hostname) || url.hostname.endsWith('.firebaseapp.com'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({url, sameOrigin}) => sameOrigin && url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {enabled: false},
    }),
  ],
  envDir: '.',
  // The build stamp Settings shows: version · build time · commit.
  define: {__PW_BUILD__: JSON.stringify(buildStamp)},
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
  },
});
