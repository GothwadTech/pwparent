/// <reference types="vite/client" />

/**
 * Every client-side variable MUST start with `VITE_`.
 * Vite statically replaces `import.meta.env.VITE_*` at BUILD time, so these
 * values must exist when `vite build` runs (Cloudflare Pages / GitHub Actions).
 *
 * NEVER put a secret here (Gemini API key, Firebase service-account JSON, etc).
 * Anything in this interface is shipped to the browser inside the JS bundle.
 */
interface ImportMetaEnv {
  /* ---------- App ---------- */
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production';
  readonly VITE_APP_URL?: string;
  readonly VITE_APP_VERSION?: string;

  /* ---------- Firebase (public web config — safe for the browser) ---------- */
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;

  /** Optional Firebase Realtime Database URL (only if you use RTDB). */
  readonly VITE_FIREBASE_DATABASE_URL?: string;

  /**
   * 'mock'  -> demo data, no network (default; app works out of the box)
   * 'firebase' -> use Firebase Auth + Firestore
   */
  readonly VITE_BACKEND_MODE?: 'mock' | 'firebase';

  /** Optional reCAPTCHA v3 site key used by Firebase phone auth on web. */
  readonly VITE_RECAPTCHA_SITE_KEY?: string;

  /* ---------- Unprefixed fallbacks (convenience, see src/lib/config.ts) ---------- */
  readonly FIREBASE_API_KEY?: string;
  readonly FIREBASE_AUTH_DOMAIN?: string;
  readonly FIREBASE_PROJECT_ID?: string;
  readonly FIREBASE_STORAGE_BUCKET?: string;
  readonly FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly FIREBASE_APP_ID?: string;
  readonly FIREBASE_MEASUREMENT_ID?: string;
  readonly BACKEND_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
