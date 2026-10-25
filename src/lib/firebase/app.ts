/**
 * Firebase app bootstrap.
 *
 * Safe to import anywhere: when the VITE_FIREBASE_* env vars are missing this
 * module resolves to `null` instead of throwing, so the app keeps running on
 * mock data (dev, preview builds, CI).
 */
import {type FirebaseApp, getApps, initializeApp} from 'firebase/app';
import {firebaseConfig, isFirebaseConfigured} from '../config';

let app: FirebaseApp | null = null;

if (isFirebaseConfigured) {
  try {
    // getApps() guard keeps HMR / StrictMode double-init from throwing.
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  } catch (error) {
    app = null;
    console.error('[firebase] initializeApp failed, falling back to mock mode:', error);
  }
}

export const firebaseApp = app;
export const isFirebaseReady = app !== null;
