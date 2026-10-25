import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      // Cloudflare Pages serves dist/ directly.
      outDir: 'dist',
      assetsDir: 'assets',
      // Keeps the bundle honest in CI logs; raise only if you split chunks.
      chunkSizeWarningLimit: 900,
      sourcemap: false,
      target: 'es2022',
    },
    server: {
      host: '0.0.0.0',
      port: Number(process.env.PORT ?? 3000),
      /**
       * Allow the Arena/e2b live-preview proxy host so `npm run dev` can be
       * viewed in a browser. Leading dot = all subdomains of e2b.app.
       *
       * Without this Vite answers the proxied request with
       * `403 Blocked request. This host is not allowed.`
       *
       * DEV SERVER ONLY — production is static files served by Cloudflare
       * Pages, so this setting never ships. Add your own domain here if you
       * ever run the dev server behind a different tunnel.
       */
      allowedHosts: ['.e2b.app', ...(process.env.VITE_ALLOWED_HOSTS?.split(',').filter(Boolean) ?? [])],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: Number(process.env.PREVIEW_PORT ?? 4173),
    },
    // Only variables starting with VITE_ are exposed to the client bundle.
    // A missing var becomes `undefined` at build time — src/lib/config.ts
    // validates that and falls back to mock mode instead of crashing.
    envDir: '.',
    envPrefix: 'VITE_',
  };
});
