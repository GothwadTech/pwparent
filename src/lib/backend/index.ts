/**
 * Backend facade.
 *
 * The UI imports from here (`../../lib/backend`) and NEVER from `firebase/*`
 * directly. That keeps every screen working in MOCK mode while Firebase is
 * being set up, and flipping `VITE_BACKEND_MODE=firebase` swaps the data
 * source without touching a single component.
 *
 * ── AUTH MODEL ─────────────────────────────────────────────────────────────
 * The user types a phone number. That number is **not** a credential — it is
 * a profile field stored at `parents/{uid}.mobileNumber`.
 *
 * The real identity is a Firebase **Anonymous Auth** uid, created silently on
 * the OTP step. Anonymous auth is free on the Spark plan (Phone Auth / SMS is
 * Blaze-only and would fail with `auth/billing-not-enabled`), and it gives us
 * a stable `uid` so Firestore rules can isolate every parent's data.
 *
 * The OTP screen is a DEMO affordance: it accepts `MOCK_OTP` and does not send
 * or read any SMS. The app is badged as a demo build for exactly this reason.
 *
 * Wiring guide: docs/FIREBASE.md · Admin Panel: docs/ADMIN_PANEL.md
 */
import type {
  AnnouncementItem,
  ParentProfileData,
  PurchaseItem,
  StudentProfile,
} from '../../types';
import {backendMode, isFirebaseEnabled} from '../config';
import {
  MOCK_OTP,
  mockAnnouncements,
  mockParentProfile,
  mockPurchases,
  mockStudents,
} from './mockData';
import {clearDemoStore, loadSlice, saveSlice} from './demoStore';

/** Codes the demo OTP screen accepts. Nothing is sent or verified over SMS. */
export const DEMO_OTP_CODES: readonly string[] = [MOCK_OTP, '4286'];

export interface SendOtpResult {
  mode: 'mock' | 'firebase';
  /** Phone captured by sendOtp(), consumed by verifyOtp(). */
  phone: string;
  /** Hint shown in dev when running on mock data. */
  mockHint?: string;
}

export interface Session {
  uid: string;
  /** 10-digit local number, as typed. */
  phone: string;
  /** True when this uid had no `parents/{uid}` doc yet. */
  isNewUser: boolean;
}

export interface Backend {
  readonly mode: 'mock' | 'firebase';

  // ---- session ----
  signInWithPhone(phone: string): Promise<Session>;
  signOut(): Promise<void>;
  currentUid(): string | null;

  // ---- OTP (demo affordance, kept for UI compatibility) ----
  sendOtp(phone: string): Promise<SendOtpResult>;
  verifyOtp(code: string, sendResult?: SendOtpResult): Promise<{ok: boolean; uid?: string | null; error?: string}>;

  // ---- parent profile ----
  getParentProfile(parentUid?: string | null): Promise<ParentProfileData>;
  saveParentProfile(data: ParentProfileData, parentUid?: string | null): Promise<void>;

  // ---- children / academic record (Admin Panel writes these) ----
  getLinkedStudents(parentUid?: string | null): Promise<StudentProfile[]>;
  saveStudent(student: StudentProfile, parentUid?: string | null): Promise<void>;
  deleteStudent(studentId: string, parentUid?: string | null): Promise<void>;

  // ---- announcements ----
  getAnnouncements(): Promise<AnnouncementItem[]>;
  saveAnnouncement(item: AnnouncementItem): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;

  // ---- purchases ----
  getPurchases(parentUid?: string | null): Promise<PurchaseItem[]>;
  savePurchase(item: PurchaseItem, parentUid?: string | null): Promise<void>;

  // ---- admin ----
  /** Wipe the current user's dataset and rewrite the demo seed. */
  seedDemoData(parentUid?: string | null): Promise<void>;
  /** Drop every locally-persisted demo record (mock mode only). */
  resetLocalData(): void;
}

/** Small delay so loading states are actually visible in mock mode. */
const delay = (ms = 220) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Deterministic-ish uid for mock mode so reloads keep the same "account". */
const mockUidFor = (phone: string) => `demo-${phone.replace(/\D/g, '') || 'guest'}`;

let pendingPhone: string | null = null;

// ═══════════════════════════════════════════════════════════════════════════
//  MOCK BACKEND
// ═══════════════════════════════════════════════════════════════════════════

/** Shared by signInWithPhone() and verifyOtp() — kept as a plain function so
 *  neither has to rely on `this`, which TS widens inside async object returns. */
async function mockSignIn(phone: string): Promise<Session> {
  await delay(350);
  const digits = phone.replace(/\D/g, '').slice(-10);
  const sessionUid = mockUidFor(digits);
  const stored = loadSlice<ParentProfileData | null>('profile', null);
  const isNewUser = !stored;

  saveSlice('uid', sessionUid);
  saveSlice('phone', digits);
  saveSlice('profile', {
    ...(stored ?? mockParentProfile),
    mobileNumber: digits || (stored?.mobileNumber ?? mockParentProfile.mobileNumber),
  });
  // Seed the academic record once so the dashboard is never empty.
  if (isNewUser) saveSlice('students', mockStudents);

  return {uid: sessionUid, phone: digits, isNewUser};
}

const mockBackend: Backend = {
  mode: 'mock',

  async signInWithPhone(phone) {
    return mockSignIn(phone);
  },

  async signOut() {
    await delay(100);
    saveSlice('uid', undefined);
  },

  currentUid() {
    return loadSlice<string | null>('uid', null);
  },

  async sendOtp(phone) {
    await delay(320);
    const digits = phone.replace(/\D/g, '').slice(-10);
    pendingPhone = digits;
    return {
      mode: 'mock',
      phone: digits,
      mockHint: `Demo build: no SMS is sent. Enter ${MOCK_OTP} for ${digits}.`,
    };
  },

  async verifyOtp(code, sendResult) {
    await delay(320);
    const entered = code.trim();
    if (!DEMO_OTP_CODES.includes(entered)) {
      return {ok: false, error: `Invalid OTP. This demo build accepts ${MOCK_OTP}.`};
    }
    const phone = sendResult?.phone ?? pendingPhone ?? mockParentProfile.mobileNumber;
    const session = await mockSignIn(phone);
    return {ok: true, uid: session.uid};
  },

  async getParentProfile() {
    await delay();
    return loadSlice<ParentProfileData>('profile', mockParentProfile);
  },

  async saveParentProfile(data) {
    await delay();
    saveSlice('profile', data);
  },

  async getLinkedStudents() {
    await delay();
    return loadSlice<StudentProfile[]>('students', mockStudents);
  },

  async saveStudent(student) {
    await delay();
    const current = loadSlice<StudentProfile[]>('students', mockStudents);
    const next = current.some((s) => s.id === student.id)
      ? current.map((s) => (s.id === student.id ? {...s, ...student} : s))
      : [...current, student];
    saveSlice('students', next);
  },

  async deleteStudent(studentId) {
    await delay();
    const current = loadSlice<StudentProfile[]>('students', mockStudents);
    saveSlice('students', current.filter((s) => s.id !== studentId));
  },

  async getAnnouncements() {
    await delay();
    return loadSlice<AnnouncementItem[]>('announcements', mockAnnouncements);
  },

  async saveAnnouncement(item) {
    await delay();
    const current = loadSlice<AnnouncementItem[]>('announcements', mockAnnouncements);
    const next = current.some((a) => a.id === item.id)
      ? current.map((a) => (a.id === item.id ? {...a, ...item} : a))
      : [item, ...current];
    saveSlice('announcements', next);
  },

  async deleteAnnouncement(id) {
    await delay();
    const current = loadSlice<AnnouncementItem[]>('announcements', mockAnnouncements);
    saveSlice('announcements', current.filter((a) => a.id !== id));
  },

  async getPurchases() {
    await delay();
    return loadSlice<PurchaseItem[]>('purchases', mockPurchases);
  },

  async savePurchase(item) {
    await delay();
    const current = loadSlice<PurchaseItem[]>('purchases', mockPurchases);
    const next = current.some((p) => p.id === item.id)
      ? current.map((p) => (p.id === item.id ? {...p, ...item} : p))
      : [item, ...current];
    saveSlice('purchases', next);
  },

  async seedDemoData() {
    await delay(300);
    saveSlice('students', mockStudents);
    saveSlice('announcements', mockAnnouncements);
    saveSlice('purchases', mockPurchases);
  },

  resetLocalData() {
    clearDemoStore();
  },
};

// ═══════════════════════════════════════════════════════════════════════════
//  FIREBASE BACKEND
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Firestore can fail for reasons a demo must survive: the database was never
 * created, the region is wrong, rules are still in "locked" production mode,
 * or the visitor is offline. Rather than white-screening, log and fall back to
 * the mock dataset so the UI keeps rendering.
 */
async function withFallback<T>(label: string, work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch (error) {
    console.warn(`[backend] ${label} failed, using demo data instead:`, error);
    return fallback;
  }
}

async function firebaseBackend(): Promise<Backend> {
  const [{paths, readCollection, readDoc, removeDoc, replaceCollection, writeDoc}, auth] =
    await Promise.all([import('../firebase/firestore'), import('../firebase/auth')]);

  const uid = () => auth.currentUserId();

  /** Resolve the uid we act on, or null when there is no session yet. */
  const resolveUid = (explicit?: string | null) => explicit ?? uid();

  const profileFallback = (phone?: string): ParentProfileData => ({
    ...mockParentProfile,
    mobileNumber: phone ?? mockParentProfile.mobileNumber,
  });

  /**
   * Anonymous sign-in + persist the phone number as a profile field.
   * Extracted as a closure-local function so `verifyOtp` does not depend on
   * `this`, which TypeScript widens inside an async object-literal return.
   */
  const firebaseSignIn = async (phone: string): Promise<Session> => {
    const digits = auth.toLocalDigits(phone);
    const user = await auth.ensureSession(); // anonymous — free on Spark
    const path = paths.parent(user.uid);

    const existing = await withFallback<ParentProfileData | null>(
      'read parents/{uid}',
      () => readDoc<ParentProfileData>(path),
      null,
    );
    const isNewUser = !existing;

    await withFallback(
      'write parents/{uid}',
      () =>
        writeDoc(path, {
          ...(existing ?? {}),
          name: existing?.name ?? 'Parent',
          countryCode: existing?.countryCode ?? 'IN +91',
          mobileNumber: digits,
          email: existing?.email ?? '',
          signInMethod: 'anonymous',
          lastLoginAt: new Date().toISOString(),
        } as unknown as Record<string, unknown>),
      undefined,
    );

    // First ever login for this uid -> seed the demo academic record so the
    // dashboard is not empty and the Admin Panel has something to edit.
    if (isNewUser) {
      const children: Record<string, Record<string, unknown>> = {};
      for (const student of mockStudents) {
        children[student.id] = student as unknown as Record<string, unknown>;
      }
      await withFallback(
        'seed children',
        () => replaceCollection(paths.children(user.uid), children),
        undefined,
      );
    }

    return {uid: user.uid, phone: digits, isNewUser};
  };

  return {
    mode: 'firebase',

    async signInWithPhone(phone) {
      return firebaseSignIn(phone);
    },

    async signOut() {
      await auth.signOut();
    },

    currentUid() {
      return uid();
    },

    async sendOtp(phone) {
      const digits = auth.toLocalDigits(phone);
      pendingPhone = digits;
      // No SMS is sent. Anonymous auth happens on verifyOtp() instead.
      return {
        mode: 'firebase',
        phone: digits,
        mockHint: `Demo build: no SMS is sent. Enter ${MOCK_OTP} to continue.`,
      };
    },

    async verifyOtp(code, sendResult) {
      if (!DEMO_OTP_CODES.includes(code.trim())) {
        return {ok: false, error: `Invalid OTP. This demo build accepts ${MOCK_OTP}.`};
      }
      const phone = sendResult?.phone ?? pendingPhone ?? '';
      try {
        const session = await firebaseSignIn(phone);
        return {ok: true, uid: session.uid};
      } catch (error) {
        return {ok: false, error: error instanceof Error ? error.message : 'Sign-in failed'};
      }
    },

    async getParentProfile(parentUid) {
      const id = resolveUid(parentUid);
      if (!id) return mockParentProfile;
      const stored = await withFallback<ParentProfileData | null>(
        'read parents/{uid}',
        () => readDoc<ParentProfileData>(paths.parent(id)),
        null,
      );
      return stored ?? profileFallback();
    },

    async saveParentProfile(data, parentUid) {
      const id = resolveUid(parentUid);
      if (!id) throw new Error('Not signed in');
      await writeDoc(paths.parent(id), {...data} as unknown as Record<string, unknown>);
    },

    async getLinkedStudents(parentUid) {
      const id = resolveUid(parentUid);
      if (!id) return [];
      return withFallback<StudentProfile[]>(
        'read children',
        () => readCollection<StudentProfile>(paths.children(id)),
        mockStudents,
      );
    },

    async saveStudent(student, parentUid) {
      const id = resolveUid(parentUid);
      if (!id) throw new Error('Not signed in');
      const {id: _drop, ...rest} = student;
      await writeDoc(paths.child(id, student.id), rest as unknown as Record<string, unknown>);
    },

    async deleteStudent(studentId, parentUid) {
      const id = resolveUid(parentUid);
      if (!id) throw new Error('Not signed in');
      await removeDoc(paths.child(id, studentId));
    },

    async getAnnouncements() {
      // Global feed. Falls back to the demo list when rules deny anonymous read.
      return withFallback<AnnouncementItem[]>(
        'read announcements',
        () => readCollection<AnnouncementItem>(paths.announcements()),
        mockAnnouncements,
      );
    },

    async saveAnnouncement(item) {
      const {id, ...rest} = item;
      await writeDoc(paths.announcement(id), rest as unknown as Record<string, unknown>);
    },

    async deleteAnnouncement(id) {
      await removeDoc(paths.announcement(id));
    },

    async getPurchases(parentUid) {
      const id = resolveUid(parentUid);
      if (!id) return [];
      return withFallback<PurchaseItem[]>(
        'read purchases',
        () => readCollection<PurchaseItem>(paths.purchases(id)),
        mockPurchases,
      );
    },

    async savePurchase(item, parentUid) {
      const id = resolveUid(parentUid);
      if (!id) throw new Error('Not signed in');
      const {id: _drop, ...rest} = item;
      await writeDoc(paths.purchase(id, item.id), rest as unknown as Record<string, unknown>);
    },

    async seedDemoData(parentUid) {
      const id = resolveUid(parentUid);
      if (!id) throw new Error('Not signed in');

      const children: Record<string, Record<string, unknown>> = {};
      for (const s of mockStudents) children[s.id] = s as unknown as Record<string, unknown>;

      const purchases: Record<string, Record<string, unknown>> = {};
      for (const p of mockPurchases) purchases[p.id] = p as unknown as Record<string, unknown>;

      const announcements: Record<string, Record<string, unknown>> = {};
      for (const a of mockAnnouncements) announcements[a.id] = a as unknown as Record<string, unknown>;

      await Promise.all([
        replaceCollection(paths.children(id), children),
        replaceCollection(paths.purchases(id), purchases),
        withFallback('seed announcements', () => replaceCollection(paths.announcements(), announcements), undefined),
      ]);
    },

    resetLocalData() {
      clearDemoStore();
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════

let cached: Backend | null = null;

/** Resolve the active backend (mock by default, Firebase when fully configured). */
export async function getBackend(): Promise<Backend> {
  if (cached) return cached;
  cached = isFirebaseEnabled ? await firebaseBackend() : mockBackend;
  return cached;
}

/** Sync accessor for components that just need the mode badge. */
export const activeBackendMode = backendMode;
export const usingMockData = !isFirebaseEnabled;

export {MOCK_OTP, mockStudents, mockParentProfile, mockAnnouncements, mockPurchases};
