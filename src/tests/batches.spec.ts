import {beforeEach, describe, expect, it} from 'vitest';
import {getBackend, newBatchId} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';
import {attendancePercent, monthMarksOf, overallAttendancePercent} from '../lib/backend/batchTypes';
import type {Batch} from '../types';

/**
 * The batch-centric model: a batch owns its members, its attendance and its
 * tests, and a test owns one result document per student in that batch.
 *
 * These run against the MOCK backend (localStorage) — the same Backend
 * interface the Firestore implementation satisfies, so the contract is what is
 * being pinned here.
 *
 * The pure helper maths (date keys, attendance percentages, scorePercent) is
 * tested separately in `./batch-helpers.spec.ts`, and test/result persistence
 * in `./batch-tests.spec.ts`. This file is CRUD, allotment and attendance.
 */

function makeBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: newBatchId(),
    name: 'MISSION 30 NEET 2026',
    batchType: 'offline',
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
    expect(await backend.getBatch(batch.id)).toMatchObject({name: batch.name, batchType: 'offline'});

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

  it('removeAllotment with a studentId removes ONLY that child, keeping siblings', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const students = await backend.getLinkedStudents();
    const uid = backend.currentUid()!;
    await backend.allotStudents(batch.id, uid, students.map((s) => s.id));

    // Membership is ONE document per parent holding studentIds[], so the naive
    // "delete the member document" would un-enrol the whole family. This is the
    // regression that made a second allotted child disappear from the batch.
    await backend.removeAllotment(batch.id, uid, students[0].id);

    const members = await backend.listBatchMembers(batch.id);
    expect(members).toHaveLength(1);
    expect(members[0].studentIds).toEqual([students[1].id]);

    const after = await backend.getLinkedStudents();
    expect(after.find((s) => s.id === students[0].id)?.batchIds ?? []).not.toContain(batch.id);
    expect(after.find((s) => s.id === students[1].id)?.batchIds ?? []).toContain(batch.id);
  });

  it('removeAllotment deletes the member document once the last child goes', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const students = await backend.getLinkedStudents();
    const uid = backend.currentUid()!;
    await backend.allotStudents(batch.id, uid, [students[0].id]);
    await backend.removeAllotment(batch.id, uid, students[0].id);

    // An empty studentIds[] document would still satisfy the rules' membership
    // `exists()` check and grant a parent read access to a batch with nobody in
    // it, so the document must actually be removed.
    expect(await backend.listBatchMembers(batch.id)).toHaveLength(0);
  });

  it('a Batch carries no course, startDate or active flag', async () => {
    const backend = await getBackend();
    const batch = makeBatch();
    await backend.saveBatch(batch);

    const stored = await backend.getBatch(batch.id);
    // These were removed on purpose: course duplicated the name, startDate drove
    // nothing, and `active` was a meaningless "visible to parents" toggle —
    // allotment is already the only thing that makes a batch visible.
    expect(stored).not.toHaveProperty('course');
    expect(stored).not.toHaveProperty('startDate');
    expect(stored).not.toHaveProperty('active');
    expect(Object.keys(stored ?? {}).sort()).toEqual(['batchType', 'id', 'name']);
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
