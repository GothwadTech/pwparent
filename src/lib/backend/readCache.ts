/**
 * Read-through cache for Firestore.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * Firestore's Spark plan allows **50,000 reads/day**, and the free tier is
 * shared across every visitor. Without a cache this app burned reads badly:
 * every screen navigation re-fetched `parents/{uid}/children`, and the OTP step
 * fetched the same four collections twice (once to check the session, once
 * after verification).
 *
 * Three things fix that:
 *
 *   1. **TTL cache** — a repeat read within the window costs zero.
 *   2. **In-flight de-duplication** — N components mounting at once produce
 *      ONE network read, not N. This was the worst offender: React 19
 *      StrictMode double-invokes effects in dev, and the hydration effect
 *      fired four parallel reads that the OTP step immediately repeated.
 *   3. **Write-through invalidation** — every mutation drops the affected keys,
 *      so a cached value can never go stale after an admin edit.
 *
 * Memory-only by design. Persisting to sessionStorage would survive a reload
 * but would also show another device's edits as stale data, and the first paint
 * is not worth that trade.
 */

interface Entry {
  at: number;
  value: unknown;
}

/** Default time-to-live. Long enough to kill navigation churn, short enough
 *  that a second device's edit shows up on the next reload. */
export const DEFAULT_TTL_MS = 60_000;

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

let hits = 0;
let misses = 0;

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  /** Network reads actually performed = misses (dedupe included). */
  reads: number;
  hitRate: string;
}

export function cacheStats(): CacheStats {
  const total = hits + misses;
  return {
    hits,
    misses,
    entries: store.size,
    reads: misses,
    hitRate: total === 0 ? '—' : `${Math.round((hits / total) * 100)}%`,
  };
}

/** Test hook + the "clear cache" button in Settings. */
export function resetCache(): void {
  store.clear();
  inflight.clear();
  hits = 0;
  misses = 0;
}

/**
 * Drop cached values.
 *
 * With a prefix, drops every key starting with it — that is how a write to
 * `parents/{uid}/children/x` invalidates the whole children list.
 * Without one, drops everything.
 */
export function invalidate(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/**
 * Read through the cache.
 *
 * Concurrent callers with the same key share one promise, so a burst of mounts
 * costs exactly one Firestore read.
 *
 * Errors are NOT cached — a failed read should be retried by the next caller
 * rather than poisoning the key for the whole TTL.
 */
export async function cachedRead<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key);
  if (entry && now - entry.at < ttlMs) {
    hits += 1;
    return entry.value as T;
  }

  const pending = inflight.get(key);
  if (pending) {
    hits += 1; // served without a second network read
    return pending as Promise<T>;
  }

  misses += 1;
  const promise = loader()
    .then((value) => {
      store.set(key, {at: Date.now(), value});
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

/**
 * Run a mutation, then invalidate.
 *
 * Keeping the two together means no call site can forget to bust the cache —
 * the failure mode would be an admin saving a mark and the dashboard keeping
 * the old number until the TTL expired.
 */
export async function cachedWrite<T>(invalidatePrefix: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } finally {
    invalidate(invalidatePrefix);
  }
}
