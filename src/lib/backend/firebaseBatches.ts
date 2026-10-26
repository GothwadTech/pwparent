/**
 * Batch operations — FIRESTORE implementation.
 *
 * Split out of `firebaseBackend.ts` so neither file crosses the repo's
 * 500-line ceiling. `createFirebaseBatchOps()` returns a plain `BatchOps`
 * object that `createFirebaseBackend()` spreads into itself; there is no
 * `this`, because `this` inside an object literal returned from an async
 * function is typed `Backend | PromiseLike<Backend>` and does not compile.
 *
 * ── READ BUDGET ────────────────────────────────────────────────────────────
 * Every read goes through `cachedRead` and every write through `cachedWrite`,
 * same as the rest of the backend. Attendance is the read-hungry part: one
 * document per (batch, student, month) means a whole batch's calendar is ONE
 * collection query, not one read per student per day.
 *
 * ── PERMISSIONS ────────────────────────────────────────────────────────────
 * A parent cannot `list` the batches collection — the rules only allow that for
 * an admin. So `listBatches()` for a non-admin walks the `batchIds` recorded on
 * their own children and `get()`s each batch individually, which the rules do
 * allow for members.
 */
import type {
  AllotableStudent,
  AttendanceRecord,
  Batch,
  BatchMember,
  BatchTest,
  ParentDirectoryEntry,
  ParentProfileData,
  StudentProfile,
  TestResult,
} from '../../types';
import type {BatchOps} from './batchTypes';
import {paths, readCollection, readDoc, removeDoc, writeDoc} from '../firebase/firestore';
import {cachedRead, cachedWrite, DEFAULT_TTL_MS, invalidate} from './readCache';
import {emptyAttendanceRecord, scorePercentOf, withDayMark} from './batchTypes';

const keys = {
  all: () => 'batches:all',
  one: (batchId: string) => `batch:${batchId}`,
  forParent: (uid: string) => `batchesFor:${uid}`,
  members: (batchId: string) => `members:${batchId}`,
  students: (batchId: string) => `batchStudents:${batchId}`,
  attendance: (batchId: string) => `att:${batchId}`,
  attendanceOf: (batchId: string, studentId: string) => `att:${batchId}:${studentId}`,
  tests: (batchId: string) => `tests:${batchId}`,
  test: (batchId: string, testId: string) => `test:${batchId}:${testId}`,
  results: (batchId: string, testId: string) => `results:${batchId}:${testId}`,
};

/** Everything a batch write can dirty. Cheap to over-invalidate, hard to miss. */
function invalidateBatch(batchId: string): void {
  invalidate(keys.one(batchId));
  invalidate(keys.all());
  invalidate(keys.members(batchId));
  invalidate(keys.students(batchId));
  invalidate(keys.attendance(batchId));
  invalidate(keys.tests(batchId));
  invalidate(`test:${batchId}:`);
  invalidate(`results:${batchId}:`);
  invalidate('batchesFor:');
  invalidate('allStudents');
  invalidate('allParents');
}

export interface FirebaseBatchDeps {
  currentUid: () => string | null;
  /** True when the caller's uid is in `admins/{uid}`. */
  isAdmin: () => Promise<boolean>;
  /** Read a parent's children — reuses the already-cached `children:{uid}` key. */
  getLinkedStudents: (parentUid?: string | null) => Promise<StudentProfile[]>;
  saveStudent: (student: StudentProfile, parentUid?: string | null) => Promise<void>;
  /** Firestore failures degrade to empty; see `orEmpty` in firebaseBackend.ts. */
  orEmpty: <T>(label: string, work: () => Promise<T>, fallback: T) => Promise<T>;
}

export function createFirebaseBatchOps(deps: FirebaseBatchDeps): BatchOps {
  const {currentUid, isAdmin, getLinkedStudents, saveStudent, orEmpty} = deps;

  // Hoisted as plain consts rather than methods: two operations call other
  // operations, and `this` inside an object literal returned from a factory is
  // not reliably typed (it bit this repo before as TS2339). No `this` anywhere.
  const listTestsImpl = (batchId: string): Promise<BatchTest[]> =>
    cachedRead(
      keys.tests(batchId),
      () => orEmpty(`list tests of ${batchId}`, () => readCollection<BatchTest>(paths.batchTests(batchId)), []),
      DEFAULT_TTL_MS,
    );

  const getTestImpl = (batchId: string, testId: string): Promise<BatchTest | null> =>
    cachedRead(
      keys.test(batchId, testId),
      () => orEmpty(`read test ${testId}`, () => readDoc<BatchTest>(paths.batchTest(batchId, testId)), null),
      DEFAULT_TTL_MS,
    );

  const listBatchMembersImpl = (batchId: string): Promise<BatchMember[]> =>
    cachedRead(
      keys.members(batchId),
      () =>
        orEmpty(
          `list members of ${batchId}`,
          () => readCollection<BatchMember>(paths.batchMembers(batchId)),
          [],
        ),
      DEFAULT_TTL_MS,
    );

  const getAttendanceImpl = (batchId: string, studentId: string): Promise<AttendanceRecord> =>
    cachedRead(
      keys.attendanceOf(batchId, studentId),
      async () => {
        const found = await orEmpty(
          `read attendance ${studentId}`,
          () => readDoc<AttendanceRecord>(paths.batchAttendanceOf(batchId, studentId)),
          null,
        );
        return found ?? emptyAttendanceRecord(batchId, studentId);
      },
      DEFAULT_TTL_MS,
    );

  return {
    /* ── batches ──────────────────────────────────────────────────────────── */

    async listBatches(parentUid) {
      const uid = parentUid ?? currentUid();
      if (!uid) return [];

      // Admins may list the whole collection; parents may not.
      if (await isAdmin()) {
        return orEmpty('list batches', () => readCollection<Batch>(paths.batches()), []);
      }

      return cachedRead(
        keys.forParent(uid),
        async () => {
          const students = await getLinkedStudents(uid);
          const ids = [...new Set(students.flatMap((s) => s.batchIds ?? []))];
          // One `get()` per batch, each individually cached and each allowed by
          // the member rule. Non-member batches simply fail and drop out.
          const batches = await Promise.all(
            ids.map((id) =>
              cachedRead(keys.one(id), () => orEmpty(`read batch ${id}`, () => readDoc<Batch>(paths.batch(id)), null), DEFAULT_TTL_MS),
            ),
          );
          // No `active`/draft filter: allotment is the only visibility control.
          // A parent reaches this list via the batchIds on their own children,
          // so an unallotted batch can never appear here anyway.
          return batches.filter((b): b is Batch => b !== null);
        },
        DEFAULT_TTL_MS,
      );
    },

    async listAllBatches() {
      return cachedRead(
        keys.all(),
        () => orEmpty('list all batches', () => readCollection<Batch>(paths.batches()), []),
        DEFAULT_TTL_MS,
      );
    },

    async getBatch(batchId) {
      return cachedRead(
        keys.one(batchId),
        () => orEmpty(`read batch ${batchId}`, () => readDoc<Batch>(paths.batch(batchId)), null),
        DEFAULT_TTL_MS,
      );
    },

    async saveBatch(batch) {
      await cachedWrite(keys.one(batch.id), () =>
        writeDoc(paths.batch(batch.id), batch as unknown as Record<string, unknown>),
      );
      invalidateBatch(batch.id);
    },

    async deleteBatch(batchId) {
      // Firestore does not cascade: the subcollections must go too. Reads them
      // first so nothing is orphaned (an orphaned subcollection is invisible to
      // the console and still counts against storage).
      const [tests, members, attendance] = await Promise.all([
        listTestsImpl(batchId).catch(() => [] as BatchTest[]),
        listBatchMembersImpl(batchId).catch(() => [] as BatchMember[]),
        readCollection<AttendanceRecord>(paths.batchAttendance(batchId)).catch(() => [] as AttendanceRecord[]),
      ]);

      for (const test of tests) {
        const results = await readCollection<TestResult>(paths.batchTestResults(batchId, test.id)).catch(() => []);
        for (const result of results) {
          await removeDoc(paths.batchTestResult(batchId, test.id, result.id)).catch(() => undefined);
        }
        await removeDoc(paths.batchTest(batchId, test.id)).catch(() => undefined);
      }
      for (const member of members) {
        await removeDoc(paths.batchMember(batchId, member.id)).catch(() => undefined);
      }
      for (const record of attendance) {
        await removeDoc(paths.batchAttendanceOf(batchId, record.studentId)).catch(() => undefined);
      }

      await removeDoc(paths.batch(batchId)).catch(() => undefined);
      invalidateBatch(batchId);
    },

    /* ── membership ───────────────────────────────────────────────────────── */

    listBatchMembers: listBatchMembersImpl,

    async allotStudents(batchId, parentUid, studentIds) {
      const member: BatchMember = {
        id: parentUid,
        parentUid,
        studentIds,
        joinedAt: new Date().toISOString(),
      };
      await cachedWrite(keys.members(batchId), () =>
        writeDoc(paths.batchMember(batchId, parentUid), member as unknown as Record<string, unknown>),
      );

      // Keep StudentProfile.batchIds in sync so listBatches() can find this
      // batch without a collection query the rules would deny.
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

      invalidateBatch(batchId);
    },

    async removeAllotment(batchId, parentUid, studentId) {
      // Read the current membership FIRST. Without it there is no way to remove
      // one child without also dropping their siblings from the same document.
      // Deliberately not cached: a stale member doc here would lose an allotment.
      const existing = await orEmpty<BatchMember | null>(
        `read member ${parentUid}`,
        () => readDoc<BatchMember>(paths.batchMember(batchId, parentUid)),
        null,
      );
      const current = existing?.studentIds ?? [];
      const remaining = studentId ? current.filter((id) => id !== studentId) : [];
      const affected = studentId ? [studentId] : current;

      await cachedWrite(keys.members(batchId), () =>
        remaining.length === 0
          ? removeDoc(paths.batchMember(batchId, parentUid))
          : writeDoc(
              paths.batchMember(batchId, parentUid),
              {
                id: parentUid,
                parentUid,
                studentIds: remaining,
                joinedAt: existing?.joinedAt ?? new Date().toISOString(),
              } as unknown as Record<string, unknown>,
            ),
      );

      const students = await getLinkedStudents(parentUid);
      await Promise.all(
        students
          .filter((s) => affected.includes(s.id) && (s.batchIds ?? []).includes(batchId))
          .map((s) => saveStudent({...s, batchIds: (s.batchIds ?? []).filter((id) => id !== batchId)}, parentUid)),
      );

      invalidateBatch(batchId);
    },

    async listAllStudents() {
      // Admin-only in the rules. A non-admin gets a denied query, which
      // `orEmpty` turns into [] so the picker renders empty instead of erroring.
      if (!(await isAdmin())) return [];

      return cachedRead(
        'allStudents',
        async () => {
          const parents = await orEmpty(
            'list parents',
            () => readCollection<{id: string}>(paths.parents()),
            [],
          );
          const groups = await Promise.all(
            parents.map((parent) =>
              orEmpty(
                `list children of ${parent.id}`,
                () => readCollection<StudentProfile>(paths.children(parent.id)),
                [],
              ).then((kids) => kids.map((kid) => ({...kid, parentUid: parent.id}))),
            ),
          );
          return groups.flat();
        },
        DEFAULT_TTL_MS,
      );
    },

    async listAllParents() {
      // Admin-only: the rules deny `list` on parents/ for anyone else, so a
      // non-admin gets [] and the picker renders empty rather than erroring.
      if (!(await isAdmin())) return [];

      return cachedRead(
        'allParents',
        async () => {
          const parents = await orEmpty(
            'list parents',
            () => readCollection<ParentProfileData & {id: string}>(paths.parents()),
            [],
          );
          // childCount costs one read per parent, but it is what tells the admin
          // which families already have children — without it the picker cannot
          // explain why a student is "missing".
          const counts = await Promise.all(
            parents.map((parent) =>
              orEmpty(
                `count children of ${parent.id}`,
                () => readCollection<StudentProfile>(paths.children(parent.id)),
                [],
              ).then((kids) => kids.length),
            ),
          );
          return parents.map<ParentDirectoryEntry>((parent, i) => ({
            uid: parent.id,
            name: parent.name ?? '',
            mobileNumber: parent.mobileNumber ?? '',
            childCount: counts[i],
          }));
        },
        DEFAULT_TTL_MS,
      );
    },

    async listBatchStudents(batchId) {
      return cachedRead(
        keys.students(batchId),
        async () => {
          const members = await listBatchMembersImpl(batchId);
          const groups = await Promise.all(
            members.map((m) =>
              getLinkedStudents(m.parentUid).then((all) => all.filter((s) => (m.studentIds ?? []).includes(s.id))),
            ),
          );
          return groups.flat();
        },
        DEFAULT_TTL_MS,
      );
    },

    /* ── attendance ───────────────────────────────────────────────────────── */

    getAttendance: getAttendanceImpl,

    async setAttendanceDay(batchId, studentId, day, mark) {
      // Read-modify-write on ONE document. `mark: null` clears the day, which is
      // how an admin undoes a wrong entry. The merge logic lives in
      // `withDayMark` so the mock backend cannot drift from it.
      const current = await getAttendanceImpl(batchId, studentId);
      const next = withDayMark(current, day, mark);

      await cachedWrite(keys.attendanceOf(batchId, studentId), () =>
        writeDoc(paths.batchAttendanceOf(batchId, studentId), next as unknown as Record<string, unknown>),
      );
      return next;
    },

    async listBatchAttendance(batchId) {
      return cachedRead(
        keys.attendance(batchId),
        () =>
          orEmpty(
            `list attendance of ${batchId}`,
            () => readCollection<AttendanceRecord>(paths.batchAttendance(batchId)),
            [],
          ),
        DEFAULT_TTL_MS,
      );
    },

    /* ── tests ────────────────────────────────────────────────────────────── */

    listTests: listTestsImpl,

    getTest: getTestImpl,

    async saveTest(batchId, test) {
      await cachedWrite(keys.tests(batchId), () =>
        writeDoc(paths.batchTest(batchId, test.id), {...test, batchId} as unknown as Record<string, unknown>),
      );
      invalidate(keys.test(batchId, test.id));
    },

    async deleteTest(batchId, testId) {
      const results = await orEmpty(
        `list results of ${testId}`,
        () => readCollection<TestResult>(paths.batchTestResults(batchId, testId)),
        [],
      );
      for (const result of results) {
        await removeDoc(paths.batchTestResult(batchId, testId, result.id)).catch(() => undefined);
      }
      await cachedWrite(keys.tests(batchId), () => removeDoc(paths.batchTest(batchId, testId)));
      invalidate(keys.test(batchId, testId));
      invalidate(keys.results(batchId, testId));
    },

    /* ── results ──────────────────────────────────────────────────────────── */

    async listResults(batchId, testId) {
      return cachedRead(
        keys.results(batchId, testId),
        () =>
          orEmpty(
            `list results of ${testId}`,
            () => readCollection<TestResult>(paths.batchTestResults(batchId, testId)),
            [],
          ),
        DEFAULT_TTL_MS,
      );
    },

    async getResult(batchId, testId, studentId) {
      // Targeted get(), not a filtered list: a parent is allowed to read their
      // own child's result but NOT to list the class, so a query here would be
      // denied outright. One cached read per (test, student).
      return cachedRead(
        `${keys.results(batchId, testId)}:${studentId}`,
        () =>
          orEmpty(
            `read result ${studentId}/${testId}`,
            () => readDoc<TestResult>(paths.batchTestResult(batchId, testId, studentId)),
            null,
          ),
        DEFAULT_TTL_MS,
      );
    },

    async saveResult(batchId, testId, studentId, result) {
      const test = await getTestImpl(batchId, testId);
      // scorePercent is derived, never accepted from the caller — same invariant
      // as recomputeStudent(): a scorecard must not be able to contradict itself.
      const record: TestResult = {
        ...result,
        id: studentId,
        studentId,
        scorePercent: scorePercentOf(result.marksObtained, test?.marksTotal),
      };
      await cachedWrite(keys.results(batchId, testId), () =>
        writeDoc(paths.batchTestResult(batchId, testId, studentId), record as unknown as Record<string, unknown>),
      );
      invalidate(`${keys.results(batchId, testId)}:${studentId}`);
    },

    async deleteResult(batchId, testId, studentId) {
      await cachedWrite(keys.results(batchId, testId), () =>
        removeDoc(paths.batchTestResult(batchId, testId, studentId)),
      );
    },
  };
}
