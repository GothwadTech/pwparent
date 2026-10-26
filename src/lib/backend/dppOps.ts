/**
 * DPP reads/writes for the firebase backend.
 *
 * Kept in its own module because firebaseBatches.ts is already close to the
 * repo's 500-line ceiling and DPPs are an independent subcollection.
 */
import {paths, readDoc, writeDoc} from '../firebase/firestore';
import type {DppRecord} from './types';

export async function getDppRecordImpl(batchId: string, studentId: string): Promise<DppRecord | null> {
  const rec = await readDoc<DppRecord>(paths.dpp(batchId, studentId));
  return rec?.months ? {months: rec.months} : null;
}

export async function saveDppRecordImpl(batchId: string, studentId: string, record: DppRecord): Promise<void> {
  await writeDoc(paths.dpp(batchId, studentId), {months: record.months});
}
