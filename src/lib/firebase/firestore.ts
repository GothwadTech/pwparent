/**
 * Firestore helpers + the collection layout this app expects.
 *
 * Collection map (parent-scoped, so security rules are easy):
 *
 *   parents/{uid}                        -> ParentProfileData
 *   parents/{uid}/children/{childId}     -> StudentProfile (+ TestRecord[])
 *   parents/{uid}/purchases/{itemId}     -> PurchaseItem
 *   announcements/{id}                   -> AnnouncementItem (global feed)
 *   admins/{uid}                         -> {role, grantedAt}  (allow-list)
 *
 * Every parent-scoped path starts with `parents/{uid}`, which lets the rules in
 * `firestore.rules` lock a user to their own subtree with one line:
 * `request.auth.uid == uid`.
 *
 * See docs/FIREBASE.md for ready-to-paste security rules.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
  type Firestore,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import {firebaseApp, isFirebaseReady} from './app';
import {FirebaseNotConfiguredError} from './auth';

let db: Firestore | null = null;

export function getDb(): Firestore {
  if (!isFirebaseReady || !firebaseApp) throw new FirebaseNotConfiguredError('Firestore');
  if (!db) db = getFirestore(firebaseApp);
  return db;
}

export const paths = {
  /** Listing this is admin-only in the rules — it is how the Admin Panel finds
   *  every family in order to allot students to a batch. */
  parents: () => 'parents',
  parent: (uid: string) => `parents/${uid}`,
  children: (uid: string) => `parents/${uid}/children`,
  child: (uid: string, childId: string) => `parents/${uid}/children/${childId}`,
  purchases: (uid: string) => `parents/${uid}/purchases`,
  purchase: (uid: string, itemId: string) => `parents/${uid}/purchases/${itemId}`,
  announcements: () => 'announcements',
  announcement: (id: string) => `announcements/${id}`,
  admins: () => 'admins',
  admin: (uid: string) => `admins/${uid}`,
  /**
   * Singleton that records "an admin already exists".
   * Its existence is what permanently closes registration — see firestore.rules.
   */
  adminConfig: () => 'adminConfig/singleton',
  /** One doc per phone number: the hashed 6-digit login code. */
  credentials: () => 'credentials',
  credential: (phone: string) => `credentials/${phone}`,
  /** One DPP record per student per batch: month-wise assigned/attempted. */
  dpp: (batchId: string, studentId: string) => `batches/${batchId}/dpp/${studentId}`,

  /* ── batch-centric model (admin-owned, parents read their own) ────────── */
  batches: () => 'batches',
  batch: (batchId: string) => `batches/${batchId}`,
  /**
   * Keyed by PARENT uid, not student id, so `firestore.rules` can answer "may
   * this caller read this batch?" with a single `exists()`.
   */
  batchMembers: (batchId: string) => `batches/${batchId}/members`,
  batchMember: (batchId: string, parentUid: string) => `batches/${batchId}/members/${parentUid}`,
  /**
   * One document per student holding EVERY month, so the document id is simply
   * the student id. That is what makes the rule expressible: "may this caller
   * read this document?" reduces to "is this caller the parent of `studentId`?",
   * with no string parsing of a composite id.
   */
  batchAttendance: (batchId: string) => `batches/${batchId}/attendance`,
  batchAttendanceOf: (batchId: string, studentId: string) => `batches/${batchId}/attendance/${studentId}`,
  batchTests: (batchId: string) => `batches/${batchId}/tests`,
  batchTest: (batchId: string, testId: string) => `batches/${batchId}/tests/${testId}`,
  batchTestResults: (batchId: string, testId: string) => `batches/${batchId}/tests/${testId}/results`,
  batchTestResult: (batchId: string, testId: string, studentId: string) =>
    `batches/${batchId}/tests/${testId}/results/${studentId}`,
};


export async function readDoc<T>(path: string): Promise<T | null> {
  const snap = await getDoc(doc(getDb(), path));
  return snap.exists() ? ({id: snap.id, ...snap.data()} as T) : null;
}

export async function readCollection<T>(path: string, ...constraints: QueryConstraint[]): Promise<T[]> {
  const q = query(collection(getDb(), path), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({id: d.id, ...d.data()} as T));
}

export async function writeDoc<T extends Record<string, unknown>>(
  path: string,
  data: T,
  merge = true,
): Promise<void> {
  await setDoc(doc(getDb(), path), data, {merge});
}

export async function removeDoc(path: string): Promise<void> {
  await deleteDoc(doc(getDb(), path));
}

/** Live subscription — the app can render mock data until the first snapshot lands. */
export function subscribe<T>(path: string, onChange: (items: T[]) => void, ...constraints: QueryConstraint[]): Unsubscribe {
  const q = query(collection(getDb(), path), ...constraints);
  return onSnapshot(q, (snap) => onChange(snap.docs.map((d) => ({id: d.id, ...d.data()} as T))));
}

export const byNewest = (field: string) => orderBy(field, 'desc');

/**
 * Replace an entire subcollection atomically.
 *
 * The Admin Panel uses this for "Seed demo data": wipe + rewrite in one batch
 * so the UI never renders a half-written student list. Firestore batches cap
 * at 500 writes, which is far above anything this demo produces.
 */
export async function replaceCollection<T extends Record<string, unknown>>(
  path: string,
  items: Record<string, T>,
): Promise<void> {
  const db = getDb();
  const existing = await getDocs(collection(db, path));
  const batch = writeBatch(db);

  for (const snap of existing.docs) batch.delete(snap.ref);
  for (const [id, data] of Object.entries(items)) {
    batch.set(doc(db, path, id), data);
  }

  await batch.commit();
}
