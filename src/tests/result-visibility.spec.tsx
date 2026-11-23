import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TestResultsPanel} from '../components/admin/TestResultsPanel';
import {getBackend, newBatchId, newBatchTestId} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';
import type {Backend} from '../lib/backend';
import {testDisplayStatus, visibleResult} from '../lib/testStatus';
import type {Batch, BatchTest, StudentProfile, TestResult} from '../types';

/**
 * "Ek student ka galat result turant chhupa do" — the per-student switch.
 *
 * Withholding must never touch the marks: the admin flips a switch, the parent's
 * card says "result awaited", and flipping it back restores the exact score.
 */

const TODAY = '2026-11-23';

const result = (over: Partial<TestResult> = {}): TestResult => ({
  id: 's1',
  studentId: 's1',
  studentName: 'Aarav',
  status: 'ATTEMPTED',
  marksObtained: 156,
  scorePercent: 21.67,
  ...over,
});

describe('visibleResult / testDisplayStatus with a withheld result', () => {
  it('a visible result is returned as-is', () => {
    expect(visibleResult(result())).not.toBeNull();
  });

  it('a withheld result is dropped', () => {
    expect(visibleResult(result({hidden: true}))).toBeNull();
    expect(visibleResult(null)).toBeNull();
  });

  it('the card falls back to RESULT_AWAITING even though marks exist', () => {
    const test = {status: 'completed' as const, date: '2026-11-01'};
    expect(testDisplayStatus(test, result({hidden: true}), TODAY)).toBe('RESULT_AWAITING');
    expect(testDisplayStatus(test, result(), TODAY)).toBe('ATTEMPTED');
  });

  it('a withheld MISSED result also reads as awaiting — never MISSED', () => {
    expect(
      testDisplayStatus({status: 'completed', date: '2026-11-01'}, result({status: 'MISSED', hidden: true}), TODAY),
    ).toBe('RESULT_AWAITING');
  });
});

describe('backend: setResultVisibility', () => {
  let backend: Backend;
  let batch: Batch;
  let test: BatchTest;
  const student: StudentProfile = {
    id: 's1',
    name: 'Aarav',
    batch: 'NEET',
    course: 'Yakeen',
    attendance: '90%',
    testsCompleted: 1,
    dppsDone: 2,
    videoWatchRate: '80%',
  };

  beforeEach(async () => {
    clearDemoStore();
    backend = await getBackend();
    batch = {id: newBatchId(), name: 'MISSION 30', batchType: 'offline'};
    await backend.saveBatch(batch);
    test = {
      id: newBatchTestId([]),
      batchId: batch.id,
      title: 'Major Test 1',
      date: '2026-11-01',
      mode: 'Offline',
      marksTotal: 720,
      status: 'completed',
      syllabus: [],
    };
    await backend.saveTest(batch.id, test);
    await backend.saveResult(batch.id, test.id, student.id, {
      studentName: student.name,
      marksObtained: 156,
      status: 'ATTEMPTED',
    });
  });

  it('withholds the result without touching a single mark', async () => {
    await backend.setResultVisibility(batch.id, test.id, student.id, true);
    const after = await backend.getResult(batch.id, test.id, student.id);

    expect(after?.hidden).toBe(true);
    expect(after?.marksObtained).toBe(156);
    expect(after?.status).toBe('ATTEMPTED');
    expect(after?.scorePercent).toBe(22); // 156/720 rounded by the backend
  });

  it('releasing it puts the same score back on the parent’s card', async () => {
    await backend.setResultVisibility(batch.id, test.id, student.id, true);
    await backend.setResultVisibility(batch.id, test.id, student.id, false);
    const after = await backend.getResult(batch.id, test.id, student.id);

    expect(after?.hidden).toBeFalsy();
    expect(after?.marksObtained).toBe(156);
  });

  it('is a no-op when nothing has been entered yet (no phantom document)', async () => {
    await backend.setResultVisibility(batch.id, test.id, 'nobody', true);
    expect(await backend.getResult(batch.id, test.id, 'nobody')).toBeNull();
  });
});

describe('admin row: the switch', () => {
  let backend: Backend;
  let batch: Batch;
  let test: BatchTest;
  let kid: {id: string; name: string};
  let uid: string;

  beforeEach(async () => {
    clearDemoStore();
    backend = await getBackend();
    uid = backend.currentUid()!;
    // The mock seeds a child for the signed-in parent; allotment resolves the
    // batch roster through that same parent, so the seeded child is the one to use.
    [kid] = await backend.getLinkedStudents();
    batch = {id: newBatchId(), name: 'MISSION 30', batchType: 'offline'};
    await backend.saveBatch(batch);
    test = {
      id: newBatchTestId([]),
      batchId: batch.id,
      title: 'Major Test 1',
      date: '2026-11-01',
      mode: 'Offline',
      marksTotal: 720,
      status: 'completed',
      syllabus: [],
    };
    await backend.saveTest(batch.id, test);
    await backend.allotStudents(batch.id, uid, [kid.id]);
    await backend.saveResult(batch.id, test.id, kid.id, {
      studentName: kid.name,
      marksObtained: 156,
      status: 'ATTEMPTED',
    });
  });

  const switchFor = (name: string) =>
    screen.findByRole('switch', {name: new RegExp(`show ${name}'s result`, 'i')});

  it('hides a saved result on tap and shows it again on the second tap', async () => {
    render(<TestResultsPanel backend={backend} batch={batch} test={test} flash={vi.fn()} onBack={vi.fn()} />);

    const toggle = await switchFor(kid.name);
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    await userEvent.click(toggle);
    await waitFor(async () => {
      const saved = await backend.getResult(batch.id, test.id, kid.id);
      expect(saved?.hidden).toBe(true);
      expect(saved?.marksObtained).toBe(156);
    });
    expect(screen.getByText('Hidden')).toBeTruthy();

    await userEvent.click(await switchFor(kid.name));
    await waitFor(async () => {
      const saved = await backend.getResult(batch.id, test.id, kid.id);
      expect(saved?.hidden).toBeFalsy();
    });
  });

  it('is enabled for an entered result and reflects the hidden state on load', async () => {
    await backend.setResultVisibility(batch.id, test.id, kid.id, true);

    render(<TestResultsPanel backend={backend} batch={batch} test={test} flash={vi.fn()} onBack={vi.fn()} />);

    const toggle = await switchFor(kid.name);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect((toggle as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText(/hidden from parent/i)).toBeTruthy();
  });
});
