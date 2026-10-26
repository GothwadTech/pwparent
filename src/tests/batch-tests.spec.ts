import {beforeEach, describe, expect, it} from 'vitest';
import {getBackend, newBatchId, newBatchTestId} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';
import {monthMarksOf, syllabusWeightTotal} from '../lib/backend/batchTypes';
import type {Batch, BatchTest} from '../types';

/**
 * Batch-owned tests and their per-student results.
 *
 * A test belongs to a BATCH, not to a student: `batches/{id}/tests/{testId}`
 * holds the paper (title, date, mode, total marks, structured syllabus) and
 * `.../tests/{testId}/results/{studentId}` holds one result document per child.
 * That split is what lets the rules give every batch member the paper while
 * keeping marks readable only by that child's own parent.
 *
 * Runs against the MOCK backend (localStorage) — the same `Backend` interface
 * the Firestore implementation satisfies, so the contract is what is pinned.
 * CRUD, allotment and attendance live in `./batches.spec.ts`.
 */

function makeBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: newBatchId(),
    name: 'MISSION 30 NEET 2026',
    batchType: 'offline',
    ...overrides,
  };
}

function makeTest(batchId: string, existing: BatchTest[], overrides: Partial<BatchTest> = {}): BatchTest {
  return {
    id: newBatchTestId(existing),
    batchId,
    title: 'Major Test 1',
    date: '2026-10-05',
    mode: 'Offline',
    marksTotal: 720,
    status: 'completed',
    syllabus: [],
    ...overrides,
  };
}

describe('backend: batch tests', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('a test belongs to the BATCH, and its results are per student', async () => {
    const backend = await getBackend();
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const test = makeTest(batch.id, []);
    await backend.saveTest(batch.id, test);

    expect(await backend.listTests(batch.id)).toHaveLength(1);
    expect((await backend.getTest(batch.id, test.id))?.title).toBe('Major Test 1');

    await backend.saveResult(batch.id, test.id, 's1', {
      studentName: 'Aarav',
      marksObtained: 592,
      status: 'ATTEMPTED',
    });
    await backend.saveResult(batch.id, test.id, 's2', {
      studentName: 'Diya',
      marksObtained: 480,
      status: 'ATTEMPTED',
    });

    const results = await backend.listResults(batch.id, test.id);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.studentId).sort()).toEqual(['s1', 's2']);
  });

  it('scorePercent is DERIVED from marksTotal — never taken from the caller', async () => {
    const backend = await getBackend();
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const test = makeTest(batch.id, [], {marksTotal: 720});
    await backend.saveTest(batch.id, test);

    // The caller has no way to pass scorePercent: the parameter type omits it.
    await backend.saveResult(batch.id, test.id, 's1', {
      studentName: 'Aarav',
      marksObtained: 592,
      status: 'ATTEMPTED',
    });

    const result = await backend.getResult(batch.id, test.id, 's1');
    expect(result?.scorePercent).toBe(82);   // 592/720
  });

  it('getResult reads ONE student without listing the class', async () => {
    const backend = await getBackend();
    const batch = makeBatch();
    await backend.saveBatch(batch);
    const test = makeTest(batch.id, []);
    await backend.saveTest(batch.id, test);

    expect(await backend.getResult(batch.id, test.id, 'nobody')).toBeNull();

    await backend.saveResult(batch.id, test.id, 's1', {
      studentName: 'Aarav',
      marksObtained: 100,
      status: 'ATTEMPTED',
    });

    expect((await backend.getResult(batch.id, test.id, 's1'))?.studentName).toBe('Aarav');
    expect(await backend.getResult(batch.id, test.id, 's2')).toBeNull();
  });

  it('a MISSED test keeps no marks but is still recorded', async () => {
    const backend = await getBackend();
    const batch = makeBatch();
    await backend.saveBatch(batch);
    const test = makeTest(batch.id, []);
    await backend.saveTest(batch.id, test);

    await backend.saveResult(batch.id, test.id, 's1', {studentName: 'Aarav', status: 'MISSED'});

    const result = await backend.getResult(batch.id, test.id, 's1');
    expect(result?.status).toBe('MISSED');
    expect(result?.marksObtained).toBeUndefined();
    expect(result?.scorePercent).toBe(0);
  });

  it('syllabus is stored as structured topics with weightage', async () => {
    const backend = await getBackend();
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const test = makeTest(batch.id, [], {
      syllabus: [
        {subject: 'Physics', topic: 'Optics', weightage: 40},
        {subject: 'Physics', topic: 'Modern Physics', weightage: 20},
        {subject: 'Chemistry', topic: 'Organic', weightage: 40},
      ],
    });
    await backend.saveTest(batch.id, test);

    const stored = await backend.getTest(batch.id, test.id);
    expect(stored?.syllabus).toHaveLength(3);
    expect(syllabusWeightTotal(stored?.syllabus)).toBe(100);
  });

  it('deleting a test takes every result row with it', async () => {
    const backend = await getBackend();
    const batch = makeBatch();
    await backend.saveBatch(batch);
    const test = makeTest(batch.id, []);
    await backend.saveTest(batch.id, test);

    await backend.saveResult(batch.id, test.id, 's1', {
      studentName: 'Aarav',
      marksObtained: 100,
      status: 'ATTEMPTED',
    });
    await backend.deleteTest(batch.id, test.id);

    expect(await backend.listTests(batch.id)).toHaveLength(0);
    expect(await backend.listResults(batch.id, test.id)).toHaveLength(0);
  });

  it('deleting a batch takes its tests and their results with it', async () => {
    const backend = await getBackend();
    const batch = makeBatch();
    await backend.saveBatch(batch);
    const test = makeTest(batch.id, []);
    await backend.saveTest(batch.id, test);
    await backend.saveResult(batch.id, test.id, 's1', {
      studentName: 'Aarav',
      marksObtained: 100,
      status: 'ATTEMPTED',
    });

    await backend.deleteBatch(batch.id);

    expect(await backend.listTests(batch.id)).toHaveLength(0);
    expect(await backend.listResults(batch.id, test.id)).toHaveLength(0);
  });

  it('clearing one result leaves the others alone', async () => {
    const backend = await getBackend();
    const batch = makeBatch();
    await backend.saveBatch(batch);
    const test = makeTest(batch.id, []);
    await backend.saveTest(batch.id, test);

    for (const id of ['s1', 's2']) {
      await backend.saveResult(batch.id, test.id, id, {
        studentName: id,
        marksObtained: 100,
        status: 'ATTEMPTED',
      });
    }
    await backend.deleteResult(batch.id, test.id, 's1');

    expect(await backend.getResult(batch.id, test.id, 's1')).toBeNull();
    expect(await backend.getResult(batch.id, test.id, 's2')).not.toBeNull();
  });

  it('newBatchTestId never collides with an id already in use', () => {
    const taken = [{id: 't1'} as BatchTest, {id: 't2'} as BatchTest];
    expect(newBatchTestId(taken)).toBe('t3');

    // The contract is "must not collide", NOT "fills the lowest gap": with t1
    // and t3 taken it starts from length+1 = 3, finds t3 taken, and steps on to
    // t4. Reusing the deleted t2 would be wrong — a stale client holding that
    // id would silently write into the new test.
    const gapped = [{id: 't1'} as BatchTest, {id: 't3'} as BatchTest];
    const next = newBatchTestId(gapped);
    expect(next).not.toBe('t1');
    expect(next).not.toBe('t3');
    expect(next).toBe('t4');
  });
});

describe('backend: multi-batch membership', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('one student can be in several batches at once', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    const uid = backend.currentUid()!;

    const a = makeBatch({name: 'Batch A'});
    const b = makeBatch({name: 'Batch B'});
    await backend.saveBatch(a);
    await backend.saveBatch(b);

    const [student] = await backend.getLinkedStudents();
    await backend.allotStudents(a.id, uid, [student.id]);
    await backend.allotStudents(b.id, uid, [student.id]);

    const updated = (await backend.getLinkedStudents()).find((s) => s.id === student.id);
    expect(updated?.batchIds?.sort()).toEqual([a.id, b.id].sort());

    expect((await backend.listBatchStudents(a.id)).map((s) => s.id)).toContain(student.id);
    expect((await backend.listBatchStudents(b.id)).map((s) => s.id)).toContain(student.id);
  });

  it('leaving one batch does not remove the student from the other', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    const uid = backend.currentUid()!;

    const a = makeBatch({name: 'Batch A'});
    const b = makeBatch({name: 'Batch B'});
    await backend.saveBatch(a);
    await backend.saveBatch(b);

    const [student] = await backend.getLinkedStudents();
    await backend.allotStudents(a.id, uid, [student.id]);
    await backend.allotStudents(b.id, uid, [student.id]);
    await backend.removeAllotment(a.id, uid);

    const updated = (await backend.getLinkedStudents()).find((s) => s.id === student.id);
    expect(updated?.batchIds).toEqual([b.id]);
    expect((await backend.listBatchStudents(b.id)).map((s) => s.id)).toContain(student.id);
  });

  it('attendance is tracked PER BATCH — the same day can differ', async () => {
    const backend = await getBackend();
    await backend.setAttendanceDay('batchA', 's1', '2026-10-05', 'P');
    await backend.setAttendanceDay('batchB', 's1', '2026-10-05', 'A');

    expect(monthMarksOf(await backend.getAttendance('batchA', 's1'), '2026-10')['2026-10-05']).toBe('P');
    expect(monthMarksOf(await backend.getAttendance('batchB', 's1'), '2026-10')['2026-10-05']).toBe('A');
  });
});
