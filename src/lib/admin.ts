/**
 * Admin Panel gate + academic-record helpers.
 *
 * ── WHAT THIS IS ───────────────────────────────────────────────────────────
 * A passcode-protected screen that lets whoever is demoing the app seed and
 * edit the academic record (attendance, marks, tests, DPPs) without touching
 * Firestore by hand.
 *
 * ── WHAT THIS IS *NOT* ─────────────────────────────────────────────────────
 * Real authorisation. This is a client-side SPA: `ADMIN_PASSCODE` is inlined
 * into the JS bundle by Vite, so anyone who reads the bundle can find it. The
 * gate keeps casual visitors out of the panel — it does not stop a determined
 * one.
 *
 * For a real deployment put the check in `firestore.rules` against an
 * `admins/{uid}` allow-list (the collection is already scaffolded in
 * `src/lib/firebase/firestore.ts`), and treat this passcode as UI-only.
 * See docs/ADMIN_PANEL.md.
 *
 * The session is kept in sessionStorage (not localStorage) so closing the tab
 * logs the admin out.
 */
import type {StudentProfile, TestRecord} from '../types';
import {ADMIN_PASSCODE} from './config';

const SESSION_KEY = 'pwparent.admin.session';

export function isAdminUnlocked(): boolean {
  try {
    return globalThis.sessionStorage?.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** Constant-time-ish compare; avoids the obvious `input === pass` short-circuit. */
function matches(input: string, expected: string): boolean {
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < input.length; i += 1) diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function unlockAdmin(passcode: string): boolean {
  const ok = matches(passcode.trim(), ADMIN_PASSCODE);
  try {
    if (ok) globalThis.sessionStorage?.setItem(SESSION_KEY, '1');
  } catch {
    /* storage unavailable — the panel still works for this page load */
  }
  return ok;
}

export function lockAdmin(): void {
  try {
    globalThis.sessionStorage?.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

// ── academic record helpers ────────────────────────────────────────────────

export const clampPercent = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

/** Percentage from raw marks, or undefined when the total is missing/zero. */
export function marksToPercent(obtained?: number, total?: number): number | undefined {
  if (typeof obtained !== 'number' || typeof total !== 'number' || total <= 0) return undefined;
  return clampPercent((obtained / total) * 100);
}

/** Attempted tests only — a MISSED test must not drag the average down. */
export function averageScore(tests: TestRecord[]): number {
  const attempted = tests.filter((t) => t.status === 'ATTEMPTED' && typeof t.scorePercent === 'number');
  if (attempted.length === 0) return 0;
  const sum = attempted.reduce((acc, t) => acc + (t.scorePercent ?? 0), 0);
  return clampPercent(sum / attempted.length);
}

export function averageAccuracy(tests: TestRecord[]): number {
  const attempted = tests.filter((t) => t.status === 'ATTEMPTED' && typeof t.accuracyPercent === 'number');
  if (attempted.length === 0) return 0;
  const sum = attempted.reduce((acc, t) => acc + (t.accuracyPercent ?? 0), 0);
  return clampPercent(sum / attempted.length);
}

/**
 * Recompute every derived field on a student from its `tests` array.
 *
 * The Admin Panel edits raw marks; the dashboard renders percentages. Keeping
 * that maths in one place means an admin can never leave a student showing
 * "0/17 attempted, 0% avg" next to a full scorecard.
 */
export function recomputeStudent(student: StudentProfile): StudentProfile {
  // ORDER MATTERS: enrich each test with its derived scorePercent FIRST, then
  // average. Averaging the raw list would silently return 0 for a student the
  // admin typed marks into but never set a percentage for.
  const tests: TestRecord[] = (student.tests ?? []).map((t) => ({
    ...t,
    scorePercent: t.scorePercent ?? marksToPercent(t.marksObtained, t.marksTotal),
  }));

  const attempted = tests.filter((t) => t.status === 'ATTEMPTED');
  const total = student.testsTotal ?? Math.max(tests.length, attempted.length);

  return {
    ...student,
    testsTotal: total,
    testsCompleted: attempted.length,
    avgScorePercent: averageScore(tests),
    accuracyPercent: averageAccuracy(tests),
    tests,
  };
}

/** Parses "96", "96%" -> "96%" so the UI string format stays consistent. */
export function normalizePercentText(raw: string): string {
  const digits = raw.replace(/[^\d.]/g, '');
  if (!digits) return '0%';
  return `${clampPercent(Number(digits))}%`;
}

export function newTestId(existing: TestRecord[]): string {
  const maxNum = existing.reduce((max, t) => {
    const match = /(\d+)\s*$/.exec(t.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `t${maxNum + 1}`;
}
