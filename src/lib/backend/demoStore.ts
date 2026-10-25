/**
 * localStorage-backed store for MOCK mode.
 *
 * Without this, everything an Admin Panel user edits would vanish on reload,
 * which makes the demo look broken. Firestore mode ignores this module
 * entirely — it persists to `parents/{uid}` instead.
 *
 * Namespaced under `pwparent.demo.v1` so bumping the version invalidates stale
 * shapes instead of crashing on them.
 */
const KEY = 'pwparent.demo.v1';

export interface DemoSnapshot {
  uid?: string;
  phone?: string;
  students?: unknown;
  announcements?: unknown;
  purchases?: unknown;
  profile?: unknown;
}

function readRaw(): DemoSnapshot {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as DemoSnapshot) : {};
  } catch {
    // Private browsing / disabled storage / corrupt JSON — degrade quietly.
    return {};
  }
}

function writeRaw(patch: DemoSnapshot): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify({...readRaw(), ...patch}));
  } catch {
    // Storage full or unavailable. The app still works for this session.
  }
}

export function loadSlice<T>(name: keyof DemoSnapshot, fallback: T): T {
  const value = readRaw()[name];
  return value === undefined ? fallback : (value as T);
}

export function saveSlice(name: keyof DemoSnapshot, value: unknown): void {
  writeRaw({[name]: value} as DemoSnapshot);
}

/** Test hook / "reset demo data" button. */
export function clearDemoStore(): void {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
