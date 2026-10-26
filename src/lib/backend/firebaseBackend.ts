/**
 * FIREBASE backend — Anonymous Auth + Firestore. This is the production path.
 *
 * ── NO DEMO DATA ───────────────────────────────────────────────────────────
 * Nothing here falls back to a sample dataset. A collection that is empty (or
 * unreadable) returns an empty array and the UI renders an empty state. That is
 * deliberate: silently showing fake marks would be worse than showing none.
 *
 * ── READ BUDGET ────────────────────────────────────────────────────────────
 * Spark allows 50k reads/day, shared by every visitor. Every read goes through
 * `cachedRead` (TTL + in-flight de-duplication) and every write through
 * `cachedWrite` (invalidate-then-continue). Login codes use a short TTL so an
 * admin changing a code is not shadowed for a minute.
 *
 * ── LOGIN ──────────────────────────────────────────────────────────────────
 * Phone number + a 6-digit code that an ADMIN set for that number
 * (`credentials/{phone}`, stored as a PBKDF2 digest). No SMS is sent.
 * On success the app opens an anonymous Firebase session — that is what
 * produces the `uid` the security rules key on.
 */
import type {AnnouncementItem, ParentProfileData, PurchaseItem, StudentProfile} from '../../types';
import type {Backend, LoginCodeInfo, SendOtpResult, Session} from './types';
import {emptyProfile} from './types';
import {paths, readCollection, readDoc, removeDoc, writeDoc} from '../firebase/firestore';
import * as auth from '../firebase/auth';
import {
  CREDENTIAL_VERSION,
  createCredential,
  isStoredCredential,
  normalizePhone,
  verifyCredential,
} from '../credentials';
import {cachedRead, cachedWrite, DEFAULT_TTL_MS, invalidate, resetCache} from './readCache';
import {createFirebaseBatchOps} from './firebaseBatches';

/** Login codes are cached only long enough to cover one login attempt. */
const CREDENTIAL_TTL_MS = 30_000;

/** Survives a hard reload between the number step and the code step. */
let pendingPhone: string | null = null;

const keys = {
  children: (uid: string) => `children:${uid}`,
  purchases: (uid: string) => `purchases:${uid}`,
  parent: (uid: string) => `parent:${uid}`,
  announcements: () => 'announcements',
  credential: (phone: string) => `cred:${phone}`,
};

/**
 * Firestore can fail for reasons the UI must survive without lying: the
 * database was never created, the region is wrong, rules are unpublished, or
 * the visitor is offline. Return `fallback` and log — never invent data.
 */
async function orEmpty<T>(label: string, work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch (error) {
    console.warn(`[backend] ${label} failed:`, error);
    return fallback;
  }
}

export function createFirebaseBackend(): Backend {
  const uid = () => auth.currentUserId();
  const resolveUid = (explicit?: string | null) => explicit ?? uid();

  /**
   * Cached admin check. The batch layer needs it to decide whether a caller may
   * `list` the whole batches collection (parents may not — the rules only allow
   * member `get`s). Cached like any other read, so it costs 1 read per minute.
   */
  const isAdminUid = async (): Promise<boolean> => {
    const id = uid();
    if (!id) return false;
    return cachedRead(
      `isAdmin:${id}`,
      () => orEmpty(`read admins/${id}`, () => readDoc(paths.admin(id)), null).then((row) => row !== null),
      DEFAULT_TTL_MS,
    );
  };

  // Hoisted as consts because the batch layer calls them too, and `this` inside
  // an object literal returned from a factory is not reliably typed here.
  const getLinkedStudentsImpl = (parentUid?: string | null): Promise<StudentProfile[]> => {
    const id = resolveUid(parentUid);
    if (!id) return Promise.resolve([]);
    return cachedRead(
      keys.children(id),
      () => orEmpty<StudentProfile[]>('read children', () => readCollection<StudentProfile>(paths.children(id)), []),
      DEFAULT_TTL_MS,
    );
  };

  const saveStudentImpl = (student: StudentProfile, parentUid?: string | null): Promise<void> => {
    const id = resolveUid(parentUid);
    if (!id) return Promise.reject(new Error('Not signed in'));
    const {id: _drop, ...rest} = student;
    return cachedWrite(keys.children(id), () =>
      writeDoc(paths.child(id, student.id), rest as unknown as Record<string, unknown>),
    );
  };

  const batchOps = createFirebaseBatchOps({
    currentUid: uid,
    isAdmin: isAdminUid,
    getLinkedStudents: getLinkedStudentsImpl,
    saveStudent: saveStudentImpl,
    orEmpty,
  });

  const signIn = async (phone: string): Promise<Session> => {
    const digits = normalizePhone(phone);
    const user = await auth.ensureSession(); // anonymous — free on Spark, gives a real uid
    const path = paths.parent(user.uid);

    const existing = await cachedRead(
      keys.parent(user.uid),
      () => orEmpty<ParentProfileData | null>('read parents/{uid}', () => readDoc<ParentProfileData>(path), null),
      DEFAULT_TTL_MS,
    );
    const isNewUser = !existing;

    await cachedWrite(keys.parent(user.uid), () =>
      writeDoc(path, {
        ...(existing ?? {}),
        name: existing?.name ?? '',
        countryCode: existing?.countryCode ?? 'IN +91',
        mobileNumber: digits,
        email: existing?.email ?? '',
        signInMethod: 'anonymous+login-code',
        lastLoginAt: new Date().toISOString(),
      } as unknown as Record<string, unknown>),
    );

    return {uid: user.uid, phone: digits, isNewUser};
  };

  return {
    ...batchOps,
    mode: 'firebase',

    async signInWithPhone(phone) {
      return signIn(phone);
    },

    async restoreSession() {
      // Pure read: no ensureSession(), no write. An anonymous user that already
      // exists from a previous visit is enough to resume.
      const existingUid = auth.currentUserId();
      if (!existingUid) return null;

      const profile = await cachedRead(
        keys.parent(existingUid),
        () => orEmpty<ParentProfileData | null>('read parents/{uid}', () => readDoc<ParentProfileData>(paths.parent(existingUid)), null),
        DEFAULT_TTL_MS,
      );
      const digits = normalizePhone(profile?.mobileNumber ?? '');
      if (!digits) return null;

      return {uid: existingUid, phone: digits, isNewUser: false};
    },

    async signOut() {
      await auth.signOut();
      resetCache();
    },

    currentUid() {
      return uid();
    },

    // ── login codes ────────────────────────────────────────────────────────
    async sendOtp(phone) {
      const digits = normalizePhone(phone);
      if (digits.length < 10) {
        return {mode: 'firebase', phone: digits, registered: false, notice: 'Enter a 10-digit number.'};
      }

      pendingPhone = digits;
      const stored = await cachedRead(
        keys.credential(digits),
        () => orEmpty('read credentials/{phone}', () => readDoc(paths.credential(digits)), null),
        CREDENTIAL_TTL_MS,
      );

      const registered = isStoredCredential(stored);
      return {
        mode: 'firebase',
        phone: digits,
        registered,
        notice: registered
          ? 'Enter the 6-digit code set for this number.'
          : 'This number is not registered. An administrator must set a login code for it first.',
      } satisfies SendOtpResult;
    },

    async verifyOtp(code, sendResult) {
      // The phone comes from step 1. `pendingPhone` covers a hard reload
      // mid-flow, where the SendOtpResult was lost with the React state.
      const phone = sendResult?.phone ?? pendingPhone ?? '';
      if (!phone) return {ok: false, error: 'Enter your number first.'};
      pendingPhone = phone;

      invalidate(keys.credential(phone)); // never verify against a stale hash
      const stored = await orEmpty(
        'read credentials/{phone}',
        () => readDoc(paths.credential(phone)),
        null,
      );

      if (!isStoredCredential(stored)) {
        return {ok: false, error: 'This number is not registered. Ask an administrator to set a login code.'};
      }
      if (stored.v !== CREDENTIAL_VERSION) {
        return {ok: false, error: 'This login code uses an old format. An administrator must reset it.'};
      }

      const ok = await verifyCredential(code, phone, stored);
      if (!ok) return {ok: false, error: 'Incorrect code.'};

      const session = await signIn(phone);
      return {ok: true, uid: session.uid};
    },

    async setLoginCode(phone, code, name) {
      const digits = normalizePhone(phone);
      if (!uid()) throw new Error('Sign in as admin first.');
      const record = await createCredential(code, digits, name);
      await cachedWrite(keys.credential(digits), () =>
        writeDoc(paths.credential(digits), record as unknown as Record<string, unknown>, false),
      );
    },

    async deleteLoginCode(phone) {
      const digits = normalizePhone(phone);
      await cachedWrite(keys.credential(digits), () => removeDoc(paths.credential(digits)));
    },

    async listLoginCodes() {
      if (!uid()) return [];
      const rows = await orEmpty<Record<string, unknown>[]>(
        'list credentials',
        () => readCollection<Record<string, unknown>>(paths.credentials()),
        [],
      );
      return rows.map<LoginCodeInfo>((row) => ({
        phone: String(row.id ?? ''),
        createdAt: typeof row.createdAt === 'string' ? row.createdAt : '',
        currentVersion: row.v === CREDENTIAL_VERSION,
        name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : undefined,
      }));
    },

    // ── parent profile ─────────────────────────────────────────────────────
    async getParentProfile(parentUid) {
      const id = resolveUid(parentUid);
      if (!id) return emptyProfile();
      const stored = await cachedRead(
        keys.parent(id),
        () => orEmpty<ParentProfileData | null>('read parents/{uid}', () => readDoc<ParentProfileData>(paths.parent(id)), null),
        DEFAULT_TTL_MS,
      );
      return stored ?? emptyProfile();
    },

    async saveParentProfile(data, parentUid) {
      const id = resolveUid(parentUid);
      if (!id) throw new Error('Not signed in');
      await cachedWrite(keys.parent(id), () =>
        writeDoc(paths.parent(id), {...data} as unknown as Record<string, unknown>),
      );
    },

    // ── children ───────────────────────────────────────────────────────────
    getLinkedStudents: getLinkedStudentsImpl,

    saveStudent: saveStudentImpl,

    async deleteStudent(studentId, parentUid) {
      const id = resolveUid(parentUid);
      if (!id) throw new Error('Not signed in');
      await cachedWrite(keys.children(id), () => removeDoc(paths.child(id, studentId)));
    },

    // ── announcements ──────────────────────────────────────────────────────
    async getAnnouncements() {
      return cachedRead(
        keys.announcements(),
        () => orEmpty<AnnouncementItem[]>('read announcements', () => readCollection<AnnouncementItem>(paths.announcements()), []),
        DEFAULT_TTL_MS,
      );
    },

    async saveAnnouncement(item) {
      const {id, ...rest} = item;
      await cachedWrite(keys.announcements(), () =>
        writeDoc(paths.announcement(id), rest as unknown as Record<string, unknown>),
      );
    },

    async deleteAnnouncement(id) {
      await cachedWrite(keys.announcements(), () => removeDoc(paths.announcement(id)));
    },

    // ── purchases ──────────────────────────────────────────────────────────
    async getPurchases(parentUid) {
      const id = resolveUid(parentUid);
      if (!id) return [];
      return cachedRead(
        keys.purchases(id),
        () => orEmpty<PurchaseItem[]>('read purchases', () => readCollection<PurchaseItem>(paths.purchases(id)), []),
        DEFAULT_TTL_MS,
      );
    },

    async savePurchase(item, parentUid) {
      const id = resolveUid(parentUid);
      if (!id) throw new Error('Not signed in');
      const {id: _drop, ...rest} = item;
      await cachedWrite(keys.purchases(id), () =>
        writeDoc(paths.purchase(id, item.id), rest as unknown as Record<string, unknown>),
      );
    },

    clearCache() {
      resetCache();
    },
  };
}
