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
