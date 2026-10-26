/**
 * Batch operations — MOCK implementation (localStorage).
 *
 * Mirrors `firebaseBatches.ts` operation for operation so the two backends stay
 * interchangeable and the test suite can exercise the batch model offline.
 *
 * Everything lives in one `batches` slice of the demo store:
 *
 *   {[batchId]: {batch, members: {[parentUid]: BatchMember},
 *                attendance: {[studentId]: AttendanceRecord},
 *                tests: {[testId]: {test, results: {[studentId]: TestResult}}}}}
 *
 * There is no read cache here — localStorage is synchronous, so caching would
 * add complexity and save nothing. `clearCache()` is still honoured (it resets
 * the shared read cache) purely so the Backend contract holds.
 */
import type {
  AllotableStudent,
  AttendanceRecord,
  Batch,
  BatchMember,
  BatchTest,
  StudentProfile,
  TestResult,
} from '../../types';
import type {BatchOps} from './batchTypes';
import {emptyAttendanceRecord, scorePercentOf, withDayMark} from './batchTypes';
import {loadSlice, saveSlice} from './demoStore';

/** Small delay so loading states are observable, matching the rest of mock mode. */
const delay = (ms = 120) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface TestRecordStore {
  test: BatchTest;
  results: Record<string, TestResult>;
}

interface BatchRecord {
  batch: Batch;
  members: Record<string, BatchMember>;
  /** Keyed by studentId — one record per student holding every month. */
  attendance: Record<string, AttendanceRecord>;
  tests: Record<string, TestRecordStore>;
}

type BatchTree = Record<string, BatchRecord>;

const readTree = (): BatchTree => loadSlice<BatchTree>('batches', {});

function writeTree(tree: BatchTree): void {
  saveSlice('batches', tree);
}

/** Fetch-or-create one batch's record. Mutating the tree in place is fine here. */
function ensure(tree: BatchTree, batchId: string): BatchRecord {
  if (!tree[batchId]) {
    tree[batchId] = {
      batch: {
        id: batchId,
        name: '',
        course: '',
        batchType: 'online',
        startDate: new Date().toISOString().slice(0, 10),
        active: true,
      },
      members: {},
      attendance: {},
      tests: {},
    };
  }
  return tree[batchId];
}

const values = <T,>(record: Record<string, T> | undefined): T[] => Object.values(record ?? {});

export interface MockBatchDeps {
  currentUid: () => string | null;
  getLinkedStudents: (parentUid?: string | null) => Promise<StudentProfile[]>;
  saveStudent: (student: StudentProfile, parentUid?: string | null) => Promise<void>;
}

export function createMockBatchOps(deps: MockBatchDeps): BatchOps {
  const {currentUid, getLinkedStudents, saveStudent} = deps;

  const listTestsImpl = async (batchId: string): Promise<BatchTest[]> => {
    await delay(60);
    return values(readTree()[batchId]?.tests).map((t) => t.test);
  };

  const getTestImpl = async (batchId: string, testId: string): Promise<BatchTest | null> => {
    await delay(40);
    return readTree()[batchId]?.tests?.[testId]?.test ?? null;
  };

  const listMembersImpl = async (batchId: string): Promise<BatchMember[]> => {
    await delay(60);
    return values(readTree()[batchId]?.members);
  };

  const getAttendanceImpl = async (batchId: string, studentId: string): Promise<AttendanceRecord> => {
    await delay(40);
    return readTree()[batchId]?.attendance?.[studentId] ?? emptyAttendanceRecord(batchId, studentId);
  };

  return {
    /* ── batches ──────────────────────────────────────────────────────────── */

    async listBatches(parentUid) {
      await delay(80);
      const uid = parentUid ?? currentUid();
      const all = values(readTree()).map((r) => r.batch);
      if (!uid) return [];
      // Mock mode has no rules engine, so membership is filtered by hand to
      // keep behaviour aligned with the Firebase path.
      const mine = all.filter((b) => readTree()[b.id]?.members?.[uid]);
      return mine.length > 0 ? mine : all.filter((b) => b.active);
    },

    async listAllBatches() {
      await delay(80);
      return values(readTree()).map((r) => r.batch);
    },

    async getBatch(batchId) {
      await delay(40);
      return readTree()[batchId]?.batch ?? null;
    },

    async saveBatch(batch) {
      await delay(90);
      const tree = readTree();
      const record = ensure(tree, batch.id);
      record.batch = {...record.batch, ...batch};
      writeTree(tree);
    },

    async deleteBatch(batchId) {
      await delay(90);
      const tree = readTree();
      delete tree[batchId];
      writeTree(tree);
    },

    /* ── membership ───────────────────────────────────────────────────────── */

    listBatchMembers: listMembersImpl,

    async allotStudents(batchId, parentUid, studentIds) {
      await delay(90);
      const tree = readTree();
      const record = ensure(tree, batchId);
      const existing = record.members[parentUid];
      record.members[parentUid] = {
        id: parentUid,
        parentUid,
        studentIds,
        joinedAt: existing?.joinedAt ?? new Date().toISOString(),
      };
      writeTree(tree);

      const students = await getLinkedStudents(parentUid);
      await Promise.all(
        students
          .filter((s) => studentIds.includes(s.id))
          .map((s) => {
            const ids = new Set(s.batchIds ?? []);
            ids.add(batchId);
            return saveStudent({...s, batchIds: [...ids]}, parentUid);
          }),
      );
    },

    async removeAllotment(batchId, parentUid) {
      await delay(90);
      const tree = readTree();
      if (tree[batchId]) delete tree[batchId].members[parentUid];
      writeTree(tree);

      const students = await getLinkedStudents(parentUid);
      await Promise.all(
        students
          .filter((s) => (s.batchIds ?? []).includes(batchId))
          .map((s) => saveStudent({...s, batchIds: (s.batchIds ?? []).filter((id) => id !== batchId)}, parentUid)),
      );
    },

    async listAllStudents() {
      await delay(90);
      // Mock mode has a single flat student list owned by the current uid, so
      // every student is tagged with that uid.
      const owner = currentUid() ?? 'demo-guest';
      const all = await getLinkedStudents(owner);
      return all.map<AllotableStudent>((s) => ({...s, parentUid: owner}));
    },

    async listBatchStudents(batchId) {
      const members = await listMembersImpl(batchId);
      const groups = await Promise.all(
        members.map((m) =>
          getLinkedStudents(m.parentUid).then((all) => all.filter((s) => (m.studentIds ?? []).includes(s.id))),
        ),
      );
      return groups.flat();
    },

    /* ── attendance ───────────────────────────────────────────────────────── */

    getAttendance: getAttendanceImpl,

    async setAttendanceDay(batchId, studentId, day, mark) {
      await delay(70);
      // Same pure merge helper as the Firebase path, so `null` (clear) behaves
      // identically in both backends.
      const current = await getAttendanceImpl(batchId, studentId);
      const next = withDayMark(current, day, mark);

      const tree = readTree();
      ensure(tree, batchId).attendance[studentId] = {...next, batchId, studentId};
      writeTree(tree);
      return next;
    },

    async listBatchAttendance(batchId) {
      await delay(70);
      return values(readTree()[batchId]?.attendance);
    },

    /* ── tests ────────────────────────────────────────────────────────────── */

    listTests: listTestsImpl,

    getTest: getTestImpl,

    async saveTest(batchId, test) {
      await delay(90);
      const tree = readTree();
      const record = ensure(tree, batchId);
      const existing = record.tests[test.id];
      record.tests[test.id] = {
        test: {...test, batchId},
        results: existing?.results ?? {},
      };
      writeTree(tree);
    },

    async deleteTest(batchId, testId) {
      await delay(90);
      const tree = readTree();
      if (tree[batchId]) delete tree[batchId].tests[testId];
      writeTree(tree);
    },

    /* ── results ──────────────────────────────────────────────────────────── */

    async listResults(batchId, testId) {
      await delay(70);
      return values(readTree()[batchId]?.tests?.[testId]?.results);
    },

    async getResult(batchId, testId, studentId) {
      await delay(40);
      return readTree()[batchId]?.tests?.[testId]?.results?.[studentId] ?? null;
    },

    async saveResult(batchId, testId, studentId, result) {
      await delay(70);
      const test = await getTestImpl(batchId, testId);
      const tree = readTree();
      const record = ensure(tree, batchId);
      if (!record.tests[testId]) record.tests[testId] = {test: test as BatchTest, results: {}};

      // Derived, never accepted from the caller.
      record.tests[testId].results[studentId] = {
        ...result,
        id: studentId,
        studentId,
        scorePercent: scorePercentOf(result.marksObtained, test?.marksTotal),
      };
      writeTree(tree);
    },

    async deleteResult(batchId, testId, studentId) {
      await delay(70);
      const tree = readTree();
      const testRecord = tree[batchId]?.tests?.[testId];
      if (testRecord) delete testRecord.results[studentId];
      writeTree(tree);
    },
  };
}
