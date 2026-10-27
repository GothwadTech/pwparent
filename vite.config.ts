import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';

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
      // Injected into index.html; no manual <link rel="manifest"> needed.
      injectRegister: 'auto',
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
        // Offline navigation falls back to the cached shell.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
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
