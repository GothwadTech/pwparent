import {beforeEach, describe, expect, it} from 'vitest';
import {getBackend, newBatchId, newBatchTestId} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';
import {
  attendancePercent,
  monthMarksOf,
  overallAttendancePercent,
  syllabusWeightTotal,
} from '../lib/backend/batchTypes';
import type {Batch, BatchTest} from '../types';

/**
 * The batch-centric model: a batch owns its members, its attendance and its
 * tests, and a test owns one result document per student in that batch.
 *
 * These run against the MOCK backend (localStorage) — the same Backend
 * interface the Firestore implementation satisfies, so the contract is what is
 * being pinned here.
 *
 * The pure helper maths (date keys, attendance percentages, scorePercent) is
 * tested separately in `./batch-helpers.spec.ts` — this file is the
 * storage-backed half: CRUD, allotment, attendance persistence and results.
 */

function makeBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: newBatchId(),
    name: 'MISSION 30 NEET 2026',
    course: 'NEET',
    batchType: 'offline',
    startDate: '2026-04-01',
    active: true,
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

describe('backend: batch CRUD', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('creates, reads, updates and deletes a batch', async () => {
    const backend = await getBackend();
    const batch = makeBatch();

    await backend.saveBatch(batch);
    expect(await backend.getBatch(batch.id)).toMatchObject({name: batch.name, course: 'NEET'});

    await backend.saveBatch({...batch, name: 'Renamed batch'});
    expect((await backend.getBatch(batch.id))?.name).toBe('Renamed batch');

    const all = await backend.listAllBatches();
    expect(all.map((b) => b.id)).toContain(batch.id);

    await backend.deleteBatch(batch.id);
    expect(await backend.getBatch(batch.id)).toBeNull();
    expect(await backend.listAllBatches()).toHaveLength(0);
  });

  it('two batches stay independent', async () => {
    const backend = await getBackend();
    const a = makeBatch({name: 'Batch A'});
    const b = makeBatch({name: 'Batch B'});

    await backend.saveBatch(a);
    await backend.saveBatch(b);

    await backend.deleteBatch(a.id);
    expect(await backend.getBatch(a.id)).toBeNull();
    expect((await backend.getBatch(b.id))?.name).toBe('Batch B');
  });
});

describe('backend: allotment', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('allotting a student records them as a member and lists them', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const students = await backend.getLinkedStudents();
    expect(students.length).toBeGreaterThan(0);

    await backend.allotStudents(batch.id, backend.currentUid()!, [students[0].id]);

    const members = await backend.listBatchMembers(batch.id);
    expect(members).toHaveLength(1);
    expect(members[0].studentIds).toEqual([students[0].id]);

    const inBatch = await backend.listBatchStudents(batch.id);
    expect(inBatch.map((s) => s.id)).toContain(students[0].id);
  });

  it('allotment writes batchIds onto the student profile', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const [student] = await backend.getLinkedStudents();
    await backend.allotStudents(batch.id, backend.currentUid()!, [student.id]);

    const updated = (await backend.getLinkedStudents()).find((s) => s.id === student.id);
    expect(updated?.batchIds).toContain(batch.id);
  });

  it('allotting a SECOND child does not drop the first', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const students = await backend.getLinkedStudents();
    const uid = backend.currentUid()!;

    // Merge-with-existing is the caller's job, and the Admin Panel does it —
    // this pins the behaviour the panel relies on.
    await backend.allotStudents(batch.id, uid, [students[0].id]);
    await backend.allotStudents(batch.id, uid, [students[0].id, students[1].id]);

    const members = await backend.listBatchMembers(batch.id);
    expect(members).toHaveLength(1);
    expect(members[0].studentIds.sort()).toEqual([students[0].id, students[1].id].sort());
  });

  it('removeAllotment clears the member document and the student\'s batchIds', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const [student] = await backend.getLinkedStudents();
    const uid = backend.currentUid()!;
    await backend.allotStudents(batch.id, uid, [student.id]);
    await backend.removeAllotment(batch.id, uid);

    expect(await backend.listBatchMembers(batch.id)).toHaveLength(0);
    const updated = (await backend.getLinkedStudents()).find((s) => s.id === student.id);
    expect(updated?.batchIds ?? []).not.toContain(batch.id);
  });

  it('deleting a batch takes its members with it (no orphans)', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const [student] = await backend.getLinkedStudents();
    await backend.allotStudents(batch.id, backend.currentUid()!, [student.id]);
    await backend.deleteBatch(batch.id);

    expect(await backend.getBatch(batch.id)).toBeNull();
    expect(await backend.listBatchMembers(batch.id)).toHaveLength(0);
  });
});

describe('backend: day-wise attendance', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('an unmarked student returns an EMPTY record, never null', async () => {
    const backend = await getBackend();
    const record = await backend.getAttendance('b1', 's1');

    expect(record).not.toBeNull();
    expect(record.months).toEqual({});
    expect(attendancePercent(monthMarksOf(record, '2026-10'))).toBe(0);
  });

  it('marking a day persists and comes back', async () => {
    const backend = await getBackend();
    await backend.setAttendanceDay('b1', 's1', '2026-10-05', 'P');

    const record = await backend.getAttendance('b1', 's1');
    expect(record.months['2026-10']['2026-10-05']).toBe('P');
  });

  it('marks accumulate across days and across months in ONE record', async () => {
    const backend = await getBackend();
    await backend.setAttendanceDay('b1', 's1', '2026-09-30', 'A');
    await backend.setAttendanceDay('b1', 's1', '2026-10-01', 'P');
    await backend.setAttendanceDay('b1', 's1', '2026-10-02', 'L');

    const record = await backend.getAttendance('b1', 's1');
    expect(monthMarksOf(record, '2026-09')).toEqual({'2026-09-30': 'A'});
    expect(monthMarksOf(record, '2026-10')).toEqual({'2026-10-01': 'P', '2026-10-02': 'L'});
    expect(overallAttendancePercent(record)).toBe(67);   // 2 of 3 present-or-late
  });

  it('passing null CLEARS a day', async () => {
    const backend = await getBackend();
    await backend.setAttendanceDay('b1', 's1', '2026-10-05', 'A');
    await backend.setAttendanceDay('b1', 's1', '2026-10-05', null);

    expect(monthMarksOf(await backend.getAttendance('b1', 's1'), '2026-10')['2026-10-05']).toBeUndefined();
  });

  it('two students in the same batch have separate records', async () => {
    const backend = await getBackend();
    await backend.setAttendanceDay('b1', 's1', '2026-10-05', 'P');
    await backend.setAttendanceDay('b1', 's2', '2026-10-05', 'A');

    expect(monthMarksOf(await backend.getAttendance('b1', 's1'), '2026-10')['2026-10-05']).toBe('P');
    expect(monthMarksOf(await backend.getAttendance('b1', 's2'), '2026-10')['2026-10-05']).toBe('A');
  });

  it('listBatchAttendance returns the whole batch in one call', async () => {
    const backend = await getBackend();
    await backend.setAttendanceDay('b1', 's1', '2026-10-05', 'P');
    await backend.setAttendanceDay('b1', 's2', '2026-10-05', 'A');

    const all = await backend.listBatchAttendance('b1');
    expect(all.map((r) => r.studentId).sort()).toEqual(['s1', 's2']);
  });
});

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
