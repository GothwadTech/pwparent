/**
 * Backend contract.
 *
 * Split out of `index.ts` so the mock and Firebase implementations live in
 * their own files — no single file in this repo should cross ~500 lines.
 *
 * The UI imports ONLY from `src/lib/backend` (the facade), never from
 * `./mockBackend`, `./firebaseBackend` or `../firebase/*`.
 */
import type {CredentialMeta} from '../credentials';
import type {AnnouncementItem, ParentProfileData, PurchaseItem, StudentProfile} from '../../types';
import type {BatchOps} from './batchTypes';

export interface SendOtpResult {
  mode: BackendMode;
  /** Canonical 10-digit form. */
  phone: string;
  /**
   * False when no admin has set a login code for this number, i.e. the number
   * is not registered. The login screen says so instead of showing an OTP box
   * that can never succeed.
   */
  registered: boolean;
  /** Human-readable line for the OTP screen. */
  notice?: string;
}

/** One month of DPP activity for one student in one batch. */
export interface DppMonthEntry {
  assigned: number;
  attempted: number;
  /** 0-100, over the attempted DPPs of that month. */
  questionsAttemptedPercent: number;
  accuracyPercent: number;
}

/** `batches/{id}/dpp/{studentId}` — months keyed `YYYY-MM`. */
export interface DppRecord {
  months: Record<string, DppMonthEntry>;
}

export interface Session {
  uid: string;
  phone: string;
  /** True when this uid had no `parents/{uid}` document yet. */
  isNewUser: boolean;
  /**
   * The one student this number is bound to. One number logs in as one child —
   * there is no picker screen, so this is what decides which dashboard opens.
   * Null on legacy codes issued before the binding existed.
   */
  studentId?: string | null;
}

/** Metadata about a phone's login code — never the code or its hash. */
export interface LoginCodeInfo {
  phone: string;
  createdAt: string;
  /** Whether the stored hash uses the current algorithm/iteration count. */
  currentVersion: boolean;
  /** Human label for the person/family this number belongs to. */
  name?: string;
  /** The ONE student this number logs in as. Unset on legacy codes. */
  studentId?: string;
  /** Subtree that student lives in. */
  parentUid?: string;
}

export type BackendMode = 'mock' | 'firebase';

/**
 * The full contract the UI codes against.
 *
 * Batch operations live in `./batchTypes.ts` and are mixed in here, so the two
 * halves can grow independently without either file crossing the line limit.
 */
export interface Backend extends BatchOps {
  readonly mode: BackendMode;

  // ── session ──────────────────────────────────────────────────────────────
  /** Anonymous sign-in + persist the phone as a profile field. */
  signInWithPhone(phone: string): Promise<Session>;
  /**
   * Restore an existing session WITHOUT touching it. Returns null when nobody
   * is signed in or the stored profile has no number.
   *
   * Boot must use this, not `signInWithPhone('')` — the latter would overwrite
   * the stored mobileNumber with an empty string on every page load.
   */
  restoreSession(): Promise<Session | null>;
  signOut(): Promise<void>;
  currentUid(): string | null;

  // ── login codes (phone + 6-digit code set by an admin) ────────────────────
  /** Step 1: look up whether this number has a code. Sends nothing. */
  sendOtp(phone: string): Promise<SendOtpResult>;
  /** Step 2: verify the typed code, then open a session. */
  verifyOtp(
    code: string,
    sendResult?: SendOtpResult,
  ): Promise<{ok: boolean; uid?: string | null; studentId?: string | null; error?: string}>;

  // ── admin: manage login codes ────────────────────────────────────────────
  /**
   * Issue or replace the code for one number.
   *
   * `meta.studentId` binds that number to exactly one child. Enforced here and
   * in the UI: a number already bound to a different child cannot be silently
   * reused, because that is how one family's code ended up showing against
   * another child.
   */
  setLoginCode(phone: string, code: string, meta?: CredentialMeta): Promise<void>;
  deleteLoginCode(phone: string): Promise<void>;
  listLoginCodes(): Promise<LoginCodeInfo[]>;

  // ── parent profile ───────────────────────────────────────────────────────
  getParentProfile(parentUid?: string | null): Promise<ParentProfileData>;
  saveParentProfile(data: ParentProfileData, parentUid?: string | null): Promise<void>;

  // ── children / academic record ───────────────────────────────────────────
  getLinkedStudents(parentUid?: string | null): Promise<StudentProfile[]>;
  saveStudent(student: StudentProfile, parentUid?: string | null): Promise<void>;
  deleteStudent(studentId: string, parentUid?: string | null): Promise<void>;

  // ── announcements ────────────────────────────────────────────────────────
  getAnnouncements(): Promise<AnnouncementItem[]>;
  saveAnnouncement(item: AnnouncementItem): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;

  // ── purchases ────────────────────────────────────────────────────────────
  getPurchases(parentUid?: string | null): Promise<PurchaseItem[]>;
  savePurchase(item: PurchaseItem, parentUid?: string | null): Promise<void>;

  // ── diagnostics ──────────────────────────────────────────────────────────
  /** Empties the read cache. Firestore read totals come from `cacheStats()`. */
  /** DPP record for one student in one batch; null when never entered. */
  getDppRecord(batchId: string, studentId: string): Promise<DppRecord | null>;
  saveDppRecord(batchId: string, studentId: string, record: DppRecord): Promise<void>;
  clearCache(): void;
}

/** Empty profile used when a uid has no document yet. Not demo data — just a shape. */
export const emptyProfile = (phone = ''): ParentProfileData => ({
  name: '',
  countryCode: 'IN +91',
  mobileNumber: phone,
  email: '',
});
