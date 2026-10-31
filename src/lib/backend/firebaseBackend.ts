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
import * as identity from '../firebase/identity';
import {
  clearStoredSession,
  isOfflineNow,
  offlineSessionFromMarker,
  readStoredSession,
  writeStoredSession,
} from '../sessionStore';
import {familyUidFor} from '../familyScope';
import {
  CREDENTIAL_VERSION,
  createCredential,
  isStoredCredential,
  normalizePhone,
  verifyCredential,
} from '../credentials';
import type {StoredCredential} from '../credentials';
import {cachedRead, cachedWrite, DEFAULT_TTL_MS, invalidate, resetCache} from './readCache';
import {getDppRecordImpl, saveDppRecordImpl} from './dppOps';
import type {DppRecord} from './types';
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
  family: (uid: string) => `familyUid:${uid}`,
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

  /**
   * The family subtree THIS session owns — the credential's binding wins over
   * the auth uid, because the admin stamps `credentials/{phone}.parentUid`
   * from the child's own record while the session uid is whatever the device
   * produced. Without this, a parent on a second phone (or a cleared profile)
   * logs in fine and then reads an empty `parents/{sessionUid}` subtree.
   */
  const familyUidForSession = async (): Promise<string | null> => {
    const id = uid();
    if (!id) return null;
    return cachedRead(
      keys.family(id),
      async () => {
        const shell = await orEmpty<ParentProfileData | null>(
          'read parents/{uid}',
          () => readDoc<ParentProfileData>(paths.parent(id)),
          null,
        );
        const phone = normalizePhone(shell?.mobileNumber ?? '');
        if (!phone) return id;
        const cred = await orEmpty<StoredCredential | null>(
          'read credentials/{phone}',
          () => readDoc<StoredCredential>(paths.credential(phone)),
          null,
        );
        return familyUidFor(id, cred?.parentUid);
      },
      DEFAULT_TTL_MS,
    );
  };

  /**
   * "Which subtree am I acting on?" Remaps the caller's OWN uid to the bound
   * family uid; any other uid (an admin editing another family) passes through
   * untouched, or the admin would be silently teleported into their own row.
   */
  const ownFamily = async (explicit?: string | null): Promise<string | null> => {
    const id = explicit ?? uid();
    if (!id) return null;
    if (explicit && explicit !== uid()) return explicit;
    return familyUidForSession();
  };

  // Hoisted as consts because the batch layer calls them too, and `this` inside
  // an object literal returned from a factory is not reliably typed here.
  const getLinkedStudentsImpl = async (parentUid?: string | null): Promise<StudentProfile[]> => {
    const id = await ownFamily(parentUid);
    if (!id) return Promise.resolve([]);
    return cachedRead(
      keys.children(id),
      () => orEmpty<StudentProfile[]>('read children', () => readCollection<StudentProfile>(paths.children(id)), []),
      DEFAULT_TTL_MS,
    );
  };

  const saveStudentImpl = async (student: StudentProfile, parentUid?: string | null): Promise<void> => {
    const id = await ownFamily(parentUid);
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

  /**
   * Open a session for one number.
   *
   * `studentId` is the child this number is bound to. It comes from the
   * credential document, NOT from the uid: `ensureSession()` is anonymous auth,
   * so every number used in the same browser resolves to the SAME uid and
   * therefore the same `parents/{uid}` subtree. Without the binding, logging in
   * as the brother's number and then the sister's showed both children — which
   * is exactly the "one student's code reaches the other student" report. The
   * number decides the child; the browser does not.
   *
   * `code` is the login code the parent just proved they know. With it the
   * session is claimed as a PERMANENT identity (src/lib/firebase/identity.ts):
   * the same (number, code) pair resolves to the same uid on EVERY device and
   * survives a cleared browser profile. Without it this is a resume, not a
   * login, and the already-restored session is simply reused.
   */
  const signIn = async (
    phone: string,
    studentId?: string | null,
    code?: string | null,
    familyHint?: string | null,
  ): Promise<Session> => {
    const digits = normalizePhone(phone);
    // Wait for Firebase to finish restoring its persisted user FIRST: peeking at
    // `currentUser` before that resolved minted a fresh anonymous uid per reload.
    const user = code
      ? (await identity.claimIdentity(digits, code)).user
      : await auth.ensureSession();
    const now = new Date().toISOString();

    // Profile SHELL at the auth uid: the security rules read the caller's phone
    // from here to resolve which family the login code binds them to.
    invalidate(keys.parent(user.uid));
    invalidate(keys.family(user.uid));
    await cachedWrite(keys.parent(user.uid), () =>
      writeDoc(paths.parent(user.uid), {
        mobileNumber: digits,
        signInMethod: 'anonymous+login-code',
        lastLoginAt: now,
      } as unknown as Record<string, unknown>),
    );

    // The family this login OWNS: the credential's binding, not the session uid.
    const family =
      (familyHint
        ? familyUidFor(user.uid, familyHint)
        : await familyUidForSession()) ?? user.uid;

    const existing = await cachedRead(
      keys.parent(family),
      () => orEmpty<ParentProfileData | null>('read parents/{uid}', () => readDoc<ParentProfileData>(paths.parent(family)), null),
      DEFAULT_TTL_MS,
    );
    const isNewUser = !existing;

    await cachedWrite(keys.parent(family), () =>
      writeDoc(paths.parent(family), {
        ...(existing ?? {}),
        name: existing?.name ?? '',
        countryCode: existing?.countryCode ?? 'IN +91',
        mobileNumber: digits,
        email: existing?.email ?? '',
        signInMethod: 'anonymous+login-code',
        lastLoginAt: now,
      } as unknown as Record<string, unknown>),
    );

    // Remember it on this device so the next reload resumes instantly instead of
    // flashing the login form while Auth initialises from IndexedDB.
    writeStoredSession({uid: family, phone: digits, studentId: studentId ?? null});

    return {uid: family, phone: digits, isNewUser, studentId: studentId ?? null};
  };

  return {
    ...batchOps,
    mode: 'firebase',

    async signInWithPhone(phone) {
      return signIn(phone);
    },

    async restoreSession() {
      // WAIT for Firebase to finish restoring its user before looking at it.
      // `currentUserId()` on the first tick of a reload is null even for a
      // signed-in parent — that single missed await is what made every refresh
      // look like a logout, and the re-login then minted a fresh anonymous uid
      // with an empty `parents/{uid}` subtree.
      const restoredUser = await auth.whenAuthReady();
      const marker = readStoredSession();
      const authUid = restoredUser?.uid ?? auth.currentUserId();
      if (!authUid) {
        // Even the auth SDK can come back empty-handed offline (slow IndexedDB
        // restore, an expired local token). A device that is OFFLINE and holds
        // a marker still resumes — the login screen must never be the reward
        // for losing signal. Firestore's persistent cache serves the subtree.
        const stranded = offlineSessionFromMarker();
        return stranded ? {...stranded, isNewUser: false} : null;
      }

      // The bound family uid, not the raw auth uid — see familyUidForSession.
      let existingUid = (await familyUidForSession().catch(() => null)) ?? authUid;
      // ── OFFLINE MARKER TRUST ─────────────────────────────────────────────
      // familyUidForSession resolves the bound family uid through two Firestore
      // reads (parents/{uid} → credentials/{phone}). With no network those come
      // back empty, degrading existingUid to the RAW device uid — which no
      // longer equals the family uid the marker remembers, so the equality
      // check below failed and restore returned null: login screen on every
      // airplane mode, auto-login again the moment signal returned. Offline,
      // the marker's uid wins: it was written by the last ONLINE resolution.
      if (marker?.uid && marker.uid !== existingUid && isOfflineNow()) {
        existingUid = marker.uid;
      }

      const profile = await cachedRead(
        keys.parent(existingUid),
        () => orEmpty<ParentProfileData | null>('read parents/{uid}', () => readDoc<ParentProfileData>(paths.parent(existingUid)), null),
        DEFAULT_TTL_MS,
      );
      // The marker is the fallback for a profile read that came back empty or
      // was denied: this device's own last session still knows the number. It is
      // only trusted when it describes the SAME family Auth just restored.
      const digits = normalizePhone(
        profile?.mobileNumber ?? (marker?.uid === existingUid ? marker.phone : ''),
      );
      if (!digits) return null;

      // Re-read the binding so a restored session lands on the same single child
      // it was issued for. Cached, so it costs nothing on repeat navigation.
      const cred = await cachedRead(
        keys.credential(digits),
        () => orEmpty<StoredCredential | null>('read credentials/{phone}', () => readDoc<StoredCredential>(paths.credential(digits)), null),
        DEFAULT_TTL_MS,
      );

      const studentId = cred?.studentId ?? (marker?.uid === existingUid ? marker.studentId : null) ?? null;
      // Keep the marker describing the LIVE session, so the next reload is just
      // as instant as this one was.
      writeStoredSession({uid: existingUid, phone: digits, studentId});

      return {uid: existingUid, phone: digits, isNewUser: false, studentId};
    },

    async signOut() {
      await auth.signOut();
      clearStoredSession();
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

      // The verified code travels with the sign-in: it is what lets the session
      // become a permanent, cross-device identity instead of a browser-local
      // anonymous one. See src/lib/firebase/identity.ts.
      const session = await signIn(phone, stored.studentId ?? null, code, stored.parentUid ?? null);
      return {ok: true, uid: session.uid, studentId: session.studentId ?? null};
    },

    async setLoginCode(phone, code, meta) {
      const digits = normalizePhone(phone);
      if (!uid()) throw new Error('Sign in as admin first.');

      // One number -> one child. Refuse to silently re-point a number that is
      // already bound elsewhere: that is how a code issued for one student ends
      // up logging in as another. Re-binding has to be a deliberate act, so the
      // caller must say so explicitly.
      if (meta?.studentId) {
        invalidate(keys.credential(digits));
        const existing = await orEmpty<StoredCredential | null>(
          'read credentials/{phone}',
          () => readDoc<StoredCredential>(paths.credential(digits)),
          null,
        );
        if (existing?.studentId && existing.studentId !== meta.studentId && !meta.rebind) {
          throw new Error(
            'This number is already bound to a different student. Remove that code first, ' +
              'or re-issue it from that student’s own details.',
          );
        }
      }

      const record = await createCredential(code, digits, meta);
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
        studentId: typeof row.studentId === 'string' && row.studentId ? row.studentId : undefined,
        parentUid: typeof row.parentUid === 'string' && row.parentUid ? row.parentUid : undefined,
      }));
    },

    // ── parent profile ─────────────────────────────────────────────────────
    async getParentProfile(parentUid) {
      const id = await ownFamily(parentUid);
      if (!id) return emptyProfile();
      const stored = await cachedRead(
        keys.parent(id),
        () => orEmpty<ParentProfileData | null>('read parents/{uid}', () => readDoc<ParentProfileData>(paths.parent(id)), null),
        DEFAULT_TTL_MS,
      );
      return stored ?? emptyProfile();
    },

    async saveParentProfile(data, parentUid) {
      const id = await ownFamily(parentUid);
      if (!id) throw new Error('Not signed in');
      await cachedWrite(keys.parent(id), () =>
        writeDoc(paths.parent(id), {...data} as unknown as Record<string, unknown>),
      );
    },

    // ── children ───────────────────────────────────────────────────────────
    getLinkedStudents: getLinkedStudentsImpl,

    saveStudent: saveStudentImpl,

    async deleteStudent(studentId, parentUid) {
      const id = await ownFamily(parentUid);
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
      const id = await ownFamily(parentUid);
      if (!id) return [];
      return cachedRead(
        keys.purchases(id),
        () => orEmpty<PurchaseItem[]>('read purchases', () => readCollection<PurchaseItem>(paths.purchases(id)), []),
        DEFAULT_TTL_MS,
      );
    },

    async savePurchase(item, parentUid) {
      const id = await ownFamily(parentUid);
      if (!id) throw new Error('Not signed in');
      const {id: _drop, ...rest} = item;
      await cachedWrite(keys.purchases(id), () =>
        writeDoc(paths.purchase(id, item.id), rest as unknown as Record<string, unknown>),
      );
    },

    async getDppRecord(batchId: string, studentId: string) {
      return getDppRecordImpl(batchId, studentId);
    },

    async saveDppRecord(batchId: string, studentId: string, record: DppRecord) {
      await saveDppRecordImpl(batchId, studentId, record);
    },

    clearCache() {
      resetCache();
    },
  };
}
