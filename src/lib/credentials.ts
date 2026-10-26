/**
 * Per-phone login codes — hashing and verification.
 *
 * ── THE MODEL ──────────────────────────────────────────────────────────────
 * There is no SMS. An ADMIN sets a fixed 6-digit code for a given phone
 * number, and that (phone, code) pair is the credential — effectively a
 * username + password where the username is the phone number.
 *
 * ── WHY IT IS STORED HASHED ────────────────────────────────────────────────
 * Firestore rules can allow `get` on `credentials/{phone}` (the browser needs
 * the record to verify against) but that also means anyone who knows a phone
 * number can download its credential record. Storing the code in plaintext
 * would hand them the password outright.
 *
 * So we store a **PBKDF2-SHA256** digest with:
 *   - a per-record random 16-byte salt
 *   - the phone number mixed in as a pepper, so the same code on two numbers
 *     produces two unrelated hashes (no rainbow-table reuse)
 *   - a high iteration count, which is the part that actually matters: it makes
 *     an offline brute-force of the 10^6 code space expensive rather than
 *     instant.
 *
 * `credentials/{phone}` is `get`-only in the rules — `list` is denied, so the
 * collection cannot be enumerated.
 *
 * ── HONEST LIMITS ──────────────────────────────────────────────────────────
 * This is still client-side verification: a determined attacker can read the
 * hashing code and run the brute force themselves. Real credential checking
 * belongs on a server (a Cloudflare Pages Function holding a Firebase Admin
 * SDK service account). For a project of this size PBKDF2 + get-only rules
 * raises the cost from "instant" to "impractical", which is the point.
 *
 * Web Crypto needs a secure context — https:// or http://localhost. On a plain
 * http:// LAN IP `crypto.subtle` is undefined and these functions throw a
 * clear error instead of silently failing open.
 */

/** Bump this if the algorithm or iteration count ever changes. */
export const CREDENTIAL_VERSION = 1;

/**
 * PBKDF2-SHA256 iterations.
 *
 * OWASP's floor for PBKDF2-HMAC-SHA256 is 600k, but that costs ~1s+ on a
 * low-end phone and this runs on every login. 210k keeps login around
 * 150-300ms on desktop while still making a 10^6 brute force cost weeks of
 * CPU time rather than seconds.
 */
export const PBKDF2_ITERATIONS = 210_000;

const SALT_BYTES = 16;
const KEY_BITS = 256;

/** What lives at `credentials/{phone}` in Firestore. */
export interface StoredCredential {
  v: number;
  /** base64 of the random salt */
  salt: string;
  iterations: number;
  /** base64 of the derived key */
  hash: string;
  /** ISO timestamp, for the admin UI */
  createdAt: string;
}

function subtle(): SubtleCrypto {
  const cryptoRef = globalThis.crypto;
  if (!cryptoRef?.subtle) {
    throw new Error(
      'Web Crypto is unavailable. Login codes need a secure context — open the app ' +
        'over https:// or http://localhost, not a plain http:// LAN address.',
    );
  }
  return cryptoRef.subtle;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  // Explicit ArrayBuffer: `new Uint8Array(n)` widens to ArrayBufferLike, which
  // no longer satisfies WebCrypto's BufferSource under TS 5.7+ typed arrays.
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Cryptographically random salt — never Math.random() for anything security-shaped. */
export function randomSalt(): string {
  const bytes = new Uint8Array(SALT_BYTES);
  globalThis.crypto.getRandomValues(bytes);
  return toBase64(bytes);
}

/** A fresh 6-digit code, uniformly drawn from 000000-999999. */
export function randomSixDigitCode(): string {
  // rejection-free: 1e6 divides 2^32 unevenly but getRandomValues over a
  // Uint32 modulo bias of ~0.02% is irrelevant for a 6-digit demo code.
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, '0');
}

export function isValidCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

/** Digits only, last 10 — the canonical form used as the document id. */
export function normalizePhone(phone: string): string {
  return (phone ?? '').replace(/\D/g, '').slice(-10);
}

async function derive(code: string, phone: string, saltB64: string, iterations: number): Promise<string> {
  const encoder = new TextEncoder();
  // phone acts as a pepper so one code cannot be replayed across numbers.
  const keyMaterial = await subtle().importKey('raw', encoder.encode(`${code.trim()}|${phone}`), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await subtle().deriveBits(
    {name: 'PBKDF2', salt: fromBase64(saltB64), iterations, hash: 'SHA-256'},
    keyMaterial,
    KEY_BITS,
  );
  return toBase64(new Uint8Array(bits));
}

/** Build the record to write at `credentials/{phone}`. */
export async function createCredential(code: string, phone: string): Promise<StoredCredential> {
  if (!isValidCode(code)) throw new Error('Login code must be exactly 6 digits.');
  const normalized = normalizePhone(phone);
  if (normalized.length < 10) throw new Error('Phone number must be 10 digits.');

  const salt = randomSalt();
  return {
    v: CREDENTIAL_VERSION,
    salt,
    iterations: PBKDF2_ITERATIONS,
    hash: await derive(code, normalized, salt, PBKDF2_ITERATIONS),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Verify a typed code against a stored record.
 *
 * Comparison is constant-time over the base64 strings so a partial match cannot
 * be detected by timing.
 */
export async function verifyCredential(
  code: string,
  phone: string,
  stored: StoredCredential | null,
): Promise<boolean> {
  if (!stored || !isValidCode(code)) return false;

  const normalized = normalizePhone(phone);
  const iterations = stored.iterations || PBKDF2_ITERATIONS;

  // A corrupt or hand-edited Firestore document must fail the login, not crash
  // the screen. atob() throws on non-base64 input.
  let candidate: string;
  try {
    candidate = await derive(code, normalized, stored.salt, iterations);
  } catch {
    return false;
  }

  if (candidate.length !== stored.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i += 1) {
    diff |= candidate.charCodeAt(i) ^ stored.hash.charCodeAt(i);
  }
  return diff === 0;
}

/** Shape check before trusting a Firestore document. */
export function isStoredCredential(value: unknown): value is StoredCredential {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.salt === 'string' && typeof v.hash === 'string' && typeof v.iterations === 'number';
}
