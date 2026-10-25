/**
 * Central app + Firebase configuration.
 *
 * Values come from `import.meta.env` and are inlined at BUILD time by Vite.
 * On Cloudflare Pages: set them in  Pages project -> Settings -> Environment
 * variables (Production + Preview). Locally: copy `.env.example` to `.env.local`.
 *
 * Two naming styles are accepted so you can paste the Firebase console snippet
 * without renaming anything:
 *   1. VITE_FIREBASE_API_KEY   (preferred, explicit)
 *   2. FIREBASE_API_KEY        (fallback)
 */

export type BackendMode = 'mock' | 'firebase';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  databaseURL?: string;
}

const env = (import.meta.env ?? {}) as unknown as Record<string, string | undefined>;

/** Reads VITE_<KEY> first, then falls back to <KEY>. Trims + ignores empties. */
function read(name: string): string | undefined {
  const raw = env[`VITE_${name}`] ?? env[name];
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  // Treat the literal placeholders from .env.example as "not set".
  if (!value || value.startsWith('MY_') || value === 'undefined' || value === 'null') {
    return undefined;
  }
  return value;
}

export const APP_ENV = (read('APP_ENV') ?? (import.meta.env.PROD ? 'production' : 'development')) as
  | 'development'
  | 'staging'
  | 'production';

export const APP_URL = read('APP_URL') ?? (typeof window !== 'undefined' ? window.location.origin : '');

export const APP_VERSION = read('APP_VERSION') ?? '1.0.0';

export const firebaseConfig: Partial<FirebaseWebConfig> = {
  apiKey: read('FIREBASE_API_KEY'),
  authDomain: read('FIREBASE_AUTH_DOMAIN'),
  projectId: read('FIREBASE_PROJECT_ID'),
  storageBucket: read('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: read('FIREBASE_MESSAGING_SENDER_ID'),
  appId: read('FIREBASE_APP_ID'),
  measurementId: read('FIREBASE_MEASUREMENT_ID'),
  databaseURL: read('FIREBASE_DATABASE_URL'),
};

const REQUIRED_FIREBASE_KEYS: (keyof FirebaseWebConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

/** config key -> env var name, for readable warnings/tests. */
export const FIREBASE_ENV_NAMES: Record<string, string> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
  measurementId: 'VITE_FIREBASE_MEASUREMENT_ID',
  databaseURL: 'VITE_FIREBASE_DATABASE_URL',
};

/** Which required Firebase vars are still missing (used by tests + the console warning). */
export function missingFirebaseKeys(): (keyof FirebaseWebConfig)[] {
  return REQUIRED_FIREBASE_KEYS.filter((key) => !firebaseConfig[key]);
}

/** True when all 6 mandatory Firebase web-config values are present. */
export const isFirebaseConfigured: boolean = missingFirebaseKeys().length === 0;

/**
 * Which data source the app should use.
 * `VITE_BACKEND_MODE=firebase` only takes effect when Firebase is fully configured,
 * so a half-filled env can never white-screen the app.
 */
export const backendMode: BackendMode = (() => {
  const requested = (read('BACKEND_MODE') ?? 'mock').toLowerCase();
  if (requested === 'firebase') return isFirebaseConfigured ? 'firebase' : 'mock';
  return 'mock';
})();

export const isFirebaseEnabled: boolean = backendMode === 'firebase';

/** reCAPTCHA v3 site key (optional; Firebase phone auth on web may require it). */
export const recaptchaSiteKey = read('RECAPTCHA_SITE_KEY');

if (!isFirebaseConfigured) {
  const missing = missingFirebaseKeys().map((k) => `VITE_${k.replace(/[A-Z]/g, (m) => `_${m}`).toUpperCase()}`);
  // eslint-disable-next-line no-console
  console.info(
    `[config] Running in MOCK mode. Set these to enable Firebase: ${missing.join(', ')}` +
      ` (and VITE_BACKEND_MODE=firebase). See docs/FIREBASE.md.`,
  );
}
