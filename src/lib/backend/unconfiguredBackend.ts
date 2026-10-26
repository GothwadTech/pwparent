/**
 * The third backend state: Firebase was REQUESTED but cannot be delivered.
 *
 * This app ships no demo dataset, so a half-filled environment must not quietly
 * render invented marks or attendance. Instead every read resolves empty and
 * every write fails loudly, and `backendConfigError` names the missing env vars
 * so the Settings dock can show 🔴 `setup` and tell the operator exactly what to
 * add in Cloudflare Pages.
 *
 * Extracted from `index.ts` because the batch operations would have pushed that
 * file past the repo's 500-line ceiling.
 */
import type {BatchOps} from './batchTypes';
import type {Backend, LoginCodeInfo, SendOtpResult, Session} from './types';
import {emptyProfile} from './types';
import type {AnnouncementItem, ParentProfileData, PurchaseItem, StudentProfile} from '../../types';
import {resetCache} from './readCache';

const MESSAGE = 'Firebase is not configured.';

/** Build the message lazily so it can be overridden per call site. */
const why = (label: string) => `${MESSAGE} (${label})`;

/** A read that always resolves to `value` — empty, never invented. */
const emptyRead =
  <T>(value: T) =>
  async (): Promise<T> =>
    value;

/** A write that always throws, so the UI surfaces the setup error. */
const blockedWrite =
  (label: string) =>
  async (): Promise<never> => {
    throw new Error(why(label));
  };

export const unconfiguredBatchOps: BatchOps = {
  listBatches: emptyRead([]),
  listAllBatches: emptyRead([]),
  getBatch: emptyRead(null),
  saveBatch: blockedWrite('saveBatch'),
  deleteBatch: blockedWrite('deleteBatch'),

  listBatchMembers: emptyRead([]),
  allotStudents: blockedWrite('allotStudents'),
  removeAllotment: blockedWrite('removeAllotment'),
  listBatchStudents: emptyRead([]),
  listAllStudents: emptyRead([]),
  listAllParents: emptyRead([]),

  // Resolves to an EMPTY record rather than null, so the calendar UI renders
  // "nothing marked yet" instead of crashing on a missing shape.
  getAttendance: emptyRead({id: '', batchId: '', studentId: '', months: {}}),
  setAttendanceDay: blockedWrite('setAttendanceDay'),
  listBatchAttendance: emptyRead([]),

  listTests: emptyRead([]),
  getTest: emptyRead(null),
  saveTest: blockedWrite('saveTest'),
  deleteTest: blockedWrite('deleteTest'),

  listResults: emptyRead([]),
  getResult: emptyRead(null),
  saveResult: blockedWrite('saveResult'),
  deleteResult: blockedWrite('deleteResult'),
};

export function createUnconfiguredBackend(configError: string | null): Backend {
  const explain = configError ?? MESSAGE;

  return {
    ...unconfiguredBatchOps,
    mode: 'mock',

    async signInWithPhone(): Promise<Session> {
      throw new Error(explain);
    },
    async restoreSession(): Promise<Session | null> {
      return null;
    },
    async signOut() {},
    currentUid: () => null,

    async sendOtp(): Promise<SendOtpResult> {
      return {mode: 'mock', phone: '', registered: false, notice: explain};
    },
    async verifyOtp() {
      return {ok: false, error: explain};
    },

    async setLoginCode() {
      throw new Error(explain);
    },
    async deleteLoginCode() {
      throw new Error(explain);
    },
    async listLoginCodes(): Promise<LoginCodeInfo[]> {
      return [];
    },

    async getParentProfile(): Promise<ParentProfileData> {
      return emptyProfile();
    },
    async saveParentProfile() {
      throw new Error(explain);
    },

    async getLinkedStudents(): Promise<StudentProfile[]> {
      return [];
    },
    async saveStudent() {
      throw new Error(explain);
    },
    async deleteStudent() {
      throw new Error(explain);
    },

    async getAnnouncements(): Promise<AnnouncementItem[]> {
      return [];
    },
    async saveAnnouncement() {
      throw new Error(explain);
    },
    async deleteAnnouncement() {
      throw new Error(explain);
    },

    async getPurchases(): Promise<PurchaseItem[]> {
      return [];
    },
    async savePurchase() {
      throw new Error(explain);
    },

    clearCache() {
      resetCache();
    },
  };
}
