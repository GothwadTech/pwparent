/**
 * MOCK backend — localStorage only, no network.
 *
 * ── SCOPE ──────────────────────────────────────────────────────────────────
 * This is NOT the production path. The app defaults to `firebase`; this
 * implementation exists so that
 *
 *   * the test suite is deterministic and offline,
 *   * `npm run dev` still runs before Firestore exists,
 *   * a misconfigured deploy shows an empty app instead of a white screen.
 *
 * No demo dataset is seeded into the real (firebase) backend — see
 * `firebaseBackend.ts`. The sample records in `./mockData.ts` are a TEST
 * FIXTURE and the starting content of mock mode only.
 */
import type {AnnouncementItem, ParentProfileData, PurchaseItem, StudentProfile} from '../../types';
import type {Backend, LoginCodeInfo, SendOtpResult, Session} from './types';
import {emptyProfile} from './types';
import {loadSlice, saveSlice} from './demoStore';
import {resetCache} from './readCache';
import {MOCK_OTP, mockAnnouncements, mockParentProfile, mockPurchases, mockStudents} from './mockData';
import {normalizePhone} from '../credentials';
import {createMockBatchOps} from './mockBatches';

/** Small delay so loading states are actually observable in mock mode. */
const delay = (ms = 180) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const mockUidFor = (phone: string) => `demo-${phone || 'guest'}`;

/**
 * phone → entry. Older localStorage payloads stored a bare code string, so the
 * union stays and `readCode()` normalises both shapes. Mock mode is test-only,
 * but a stale payload must not throw.
 */
type CodeEntry = {code: string; name?: string; studentId?: string; parentUid?: string};
type CodeMap = Record<string, CodeEntry | string>;

function readCode(entry: CodeEntry | string | undefined): CodeEntry | null {
  if (!entry) return null;
  return typeof entry === 'string' ? {code: entry} : entry;
}

function upsert<T extends {id: string}>(list: T[], item: T, prepend = false): T[] {
  return list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? {...x, ...item} : x))
    : prepend
      ? [item, ...list]
      : [...list, item];
}

async function mockSignIn(phone: string): Promise<Session> {
  await delay(220);
  const digits = normalizePhone(phone);
  const uid = mockUidFor(digits);
  const stored = loadSlice<ParentProfileData | null>('profile', null);
  const isNewUser = !stored;

  saveSlice('uid', uid);
  saveSlice('phone', digits);
  saveSlice('profile', {
    ...(stored ?? emptyProfile(digits)),
    mobileNumber: digits,
  });
  // Mock mode starts from the fixture dataset so `npm run dev` is usable with
  // zero setup. The Firebase backend does NOT do this.
  if (isNewUser) saveSlice('students', mockStudents);

  return {uid, phone: digits, isNewUser};
}

const currentUidImpl = (): string | null => loadSlice<string | null>('uid', null);

const getLinkedStudentsImpl = async (): Promise<StudentProfile[]> => {
  await delay();
  return loadSlice<StudentProfile[]>('students', mockStudents);
};

const saveStudentImpl = async (student: StudentProfile): Promise<void> => {
  await delay();
  saveSlice('students', upsert(loadSlice<StudentProfile[]>('students', mockStudents), student));
};

const mockBatchOps = createMockBatchOps({
  currentUid: currentUidImpl,
  getLinkedStudents: getLinkedStudentsImpl,
  saveStudent: saveStudentImpl,
});

export const mockBackend: Backend = {
  ...mockBatchOps,
  mode: 'mock',

  async signInWithPhone(phone) {
    return mockSignIn(phone);
  },

  async restoreSession() {
    const storedUid = loadSlice<string | null>('uid', null);
    if (!storedUid) return null;
    const digits = normalizePhone(loadSlice<string>('phone', ''));
    if (!digits) return null;
    return {uid: storedUid, phone: digits, isNewUser: false};
  },

  async signOut() {
    await delay(80);
    saveSlice('uid', undefined);
  },

  currentUid: currentUidImpl,

  async sendOtp(phone) {
    await delay(160);
    const digits = normalizePhone(phone);
    // Mirrors firebaseBackend's module-level `pendingPhone`: verifyOtp can be
    // called without the SendOtpResult after a hard reload mid-flow.
    saveSlice('phone', digits);
    // Mock mode accepts the well-known code for ANY number — that is the whole
    // point of mock mode. Firebase mode requires an admin-set code.
    return {
      mode: 'mock' as const,
      phone: digits,
      registered: true,
      notice: `Mock mode (no Firestore). No SMS is sent \u2014 the code is ${MOCK_OTP} for any number.`,
    } satisfies SendOtpResult;
  },

  async verifyOtp(code, sendResult) {
    await delay(180);
    const digits = sendResult?.phone ?? loadSlice<string>('phone', '');
    const codes = loadSlice<CodeMap>('codes', {});
    const expected = readCode(codes[digits])?.code ?? MOCK_OTP;

    if (code.trim() !== expected) {
      return {ok: false, error: 'Incorrect code.'};
    }
    const session = await mockSignIn(digits);
    // The bound child travels with the session, exactly like the firebase path.
    return {ok: true, uid: session.uid, studentId: readCode(codes[digits])?.studentId ?? null};
  },

  async setLoginCode(phone, code, meta) {
    const digits = normalizePhone(phone);
    const codes = loadSlice<CodeMap>('codes', {});
    const previous = readCode(codes[digits]);

    // Same one-number-one-child rule as the firebase backend, so the contract
    // under test is the contract in production.
    if (meta?.studentId && previous?.studentId && previous.studentId !== meta.studentId && !meta.rebind) {
      throw new Error('This number is already bound to a different student.');
    }

    const entry: CodeEntry = {code: code.trim()};
    const label = meta?.name?.trim();
    if (label) entry.name = label;
    if (meta?.studentId) entry.studentId = meta.studentId;
    if (meta?.parentUid) entry.parentUid = meta.parentUid;
    saveSlice('codes', {...codes, [digits]: entry});
  },

  async deleteLoginCode(phone) {
    const digits = normalizePhone(phone);
    const codes = loadSlice<CodeMap>('codes', {});
    const {[digits]: _drop, ...rest} = codes;
    saveSlice('codes', rest);
  },

  async listLoginCodes() {
    const codes = loadSlice<CodeMap>('codes', {});
    return Object.keys(codes).map<LoginCodeInfo>((phone) => {
      const entry = readCode(codes[phone]);
      return {
        phone,
        createdAt: '',
        currentVersion: true,
        name: entry?.name,
        studentId: entry?.studentId,
        parentUid: entry?.parentUid,
      };
    });
  },

  async getParentProfile() {
    await delay();
    return loadSlice<ParentProfileData>('profile', {...mockParentProfile});
  },

  async saveParentProfile(data) {
    await delay();
    saveSlice('profile', data);
  },

  getLinkedStudents: getLinkedStudentsImpl,

  saveStudent: saveStudentImpl,

  async deleteStudent(studentId) {
    await delay();
    saveSlice(
      'students',
      loadSlice<StudentProfile[]>('students', mockStudents).filter((s) => s.id !== studentId),
    );
  },

  async getAnnouncements() {
    await delay();
    return loadSlice<AnnouncementItem[]>('announcements', mockAnnouncements);
  },

  async saveAnnouncement(item) {
    await delay();
    saveSlice('announcements', upsert(loadSlice<AnnouncementItem[]>('announcements', mockAnnouncements), item, true));
  },

  async deleteAnnouncement(id) {
    await delay();
    saveSlice(
      'announcements',
      loadSlice<AnnouncementItem[]>('announcements', mockAnnouncements).filter((a) => a.id !== id),
    );
  },

  async getPurchases() {
    await delay();
    return loadSlice<PurchaseItem[]>('purchases', mockPurchases);
  },

  async savePurchase(item) {
    await delay();
    saveSlice('purchases', upsert(loadSlice<PurchaseItem[]>('purchases', mockPurchases), item, true));
  },

  clearCache() {
    // Cache only. This must NEVER clear the demo store: `clearCache()` is the
    // "drop cached reads" contract shared with the Firebase backend, and the
    // Settings dock calls it on a whim. Wiping data here would delete a
    // developer's edits. The store has its own explicit control (see
    // clearDemoStore, used by the Admin Panel's Data tab in mock mode).
    resetCache();
  },
};
