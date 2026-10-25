import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  test: {
    // happy-dom instead of jsdom: no native/optional peer deps (canvas),
    // so `npm ci` stays reliable on Cloudflare Pages + GitHub Actions runners.
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    restoreMocks: true,
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/tests/**', 'src/**/*.d.ts'],
    },
  },
});
