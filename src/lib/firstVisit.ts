/**
 * Has this browser already seen the onboarding slides?
 *
 * The splash screen is gone — the app must open straight into something usable,
 * with no artificial delay. But onboarding is still worth showing ONCE to a
 * first-time visitor, so that decision is made synchronously from localStorage
 * during the initial `useState`, not after an async boot resolves.
 *
 * Synchronous matters: reading the flag inside a `useState` initializer means
 * the very first paint is already the right screen. Doing it in an effect would
 * paint `login` first and then swap to `onboarding1`, which is exactly the kind
 * of flash the splash screen used to hide.
 *
 * localStorage is the right store (not sessionStorage) because "has this person
 * seen the intro" should survive closing the tab.
 */
const KEY = 'pwparent.onboarded.v1';

export function hasSeenOnboarding(): boolean {
  try {
    return globalThis.localStorage?.getItem(KEY) === '1';
  } catch {
    // Private browsing / disabled storage — fall back to showing onboarding.
    // Showing it once too often is harmless; skipping it forever is not.
    return false;
  }
}

export function markOnboarded(): void {
  try {
    globalThis.localStorage?.setItem(KEY, '1');
  } catch {
    // Storage unavailable: the next visit simply sees onboarding again.
  }
}

/** Test helper — resets the flag so a spec can exercise the first-visit path. */
export function clearOnboarded(): void {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
