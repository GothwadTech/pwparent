/**
 * Backend facade — the ONLY module UI code should import for data.
 *
 *     import {getBackend} from './lib/backend';
 *
 * Resolution:
 *
 *   VITE_BACKEND_MODE=firebase + complete config  -> Firestore (production path)
 *   VITE_BACKEND_MODE=firebase + incomplete config -> UNCONFIGURED (empty + a
 *                                                   visible setup error, never
 *                                                   invented data)
 *   VITE_BACKEND_MODE=mock                       -> localStorage (dev + tests)
 *
 * The third state matters: this app has no demo dataset, so a half-filled env
 * must say "Firebase is not configured" rather than quietly rendering fake
 * marks. `backendConfigError` carries that message to the UI.
 */
import type {AnnouncementItem, ParentProfileData, PurchaseItem, StudentProfile} from '../../types';
import {isFirebaseEnabled, isMisconfiguredFirebase, missingFirebaseKeys, FIREBASE_ENV_NAMES} from '../config';
import type {Backend, BackendMode, LoginCodeInfo, SendOtpResult, Session} from './types';
import {emptyProfile} from './types';
import {mockBackend} from './mockBackend';
import {createUnconfiguredBackend} from './unconfiguredBackend';
import {cacheStats, resetCache} from './readCache';

export type {Backend, BackendMode, LoginCodeInfo, SendOtpResult, Session};
export {emptyProfile};
export {cacheStats, resetCache};

// Batch model: types plus the pure helpers both the UI and the backends share
// (date keys, attendance maths, syllabus weight, id generators). Re-exported so
// components import from '../lib/backend' and never reach into the internals.
export type {BatchOps} from './batchTypes';
export {
  attendancePercent,
  dayKey,
  daysInMonth,
  emptyAttendanceRecord,
  monthDays,
  monthKey,
  monthMarksOf,
  newBatchId,
  newBatchTestId,
  overallAttendancePercent,
  scorePercentOf,
  summarizeAttendance,
  syllabusWeightTotal,
  todayKey,
  withDayMark,
} from './batchTypes';

/** Non-null when Firebase was requested but the env is incomplete. */
export const backendConfigError: string | null = isMisconfiguredFirebase
  ? `Firebase is not configured. Missing: ${missingFirebaseKeys()
      .map((k) => FIREBASE_ENV_NAMES[k] ?? k)
      .join(', ')}. Add them in Cloudflare Pages → Settings → Environment variables, then retry the deployment.`
  : null;

let cached: Backend | null = null;

/**
 * Resolve the active backend.
 *
 * The Firebase implementation is imported lazily so its ~450 kB chunk stays out
 * of the bundle path until it is actually needed.
 */
export async function getBackend(): Promise<Backend> {
  if (cached) return cached;

  if (isMisconfiguredFirebase) {
    cached = createUnconfiguredBackend(backendConfigError);
  } else if (isFirebaseEnabled) {
    const {createFirebaseBackend} = await import('./firebaseBackend');
    cached = createFirebaseBackend();
  } else {
    cached = mockBackend;
  }

  return cached;
}

/** Which mode the app resolved to — for the Settings sheet badge. */
export const activeBackendMode: BackendMode = isMisconfiguredFirebase
  ? 'mock'
  : isFirebaseEnabled
    ? 'firebase'
    : 'mock';

export const usingMockData = !isFirebaseEnabled;

// Re-exported so existing imports (`from '../lib/backend'`) keep working.
export {MOCK_OTP, CODE_LENGTH, mockStudents, mockParentProfile, mockAnnouncements, mockPurchases} from './mockData';
