import '@testing-library/jest-dom/vitest';
import {cleanup} from '@testing-library/react';
import {afterEach, vi} from 'vitest';

// happy-dom does not implement matchMedia; some components/libs probe for it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Keep the console readable: src/lib/config.ts logs an informational
// "running in MOCK mode" line on every import during tests.
const info = console.info;
console.info = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].startsWith('[config]')) return;
  info(...args);
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
