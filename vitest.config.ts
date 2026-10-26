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
  // Keep tests deterministic: point Vite's env loader at an intentionally empty
  // directory so a developer's local `.env` / `.env.local` cannot change what
  // CI asserts. Each test stubs the variables it needs with `vi.stubEnv()`.
  // See src/tests/env/README.md.
  envDir: path.resolve(import.meta.dirname, 'src/tests/env'),
  test: {
    // The app DEFAULTS to firebase now (there is no demo dataset behind it), so
    // with an empty envDir the facade would resolve to `unconfiguredBackend`
    // and every data test would assert against empty reads. Mock is the mode
    // that exists for tests + offline dev, so pin it here explicitly.
    // config.spec.ts still covers the firebase/unconfigured resolution paths by
    // stubbing env + resetting modules.
    env: {
      VITE_BACKEND_MODE: 'mock',
    },
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
