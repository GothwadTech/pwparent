/**
 * Firestore helpers + the collection layout this app expects.
 *
 * Collection map (parent-scoped, so security rules are easy):
 *
 *   parents/{uid}                        -> ParentProfileData
 *   parents/{uid}/children/{childId}     -> StudentProfile
 *   parents/{uid}/purchases/{itemId}     -> PurchaseItem
 *   announcements/{id}                   -> AnnouncementItem (global feed)
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
  parent: (uid: string) => `parents/${uid}`,
  children: (uid: string) => `parents/${uid}/children`,
  child: (uid: string, childId: string) => `parents/${uid}/children/${childId}`,
  purchases: (uid: string) => `parents/${uid}/purchases`,
  purchase: (uid: string, itemId: string) => `parents/${uid}/purchases/${itemId}`,
  announcements: () => 'announcements',
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
