import {beforeEach, describe, expect, it} from 'vitest';
import {getBackend} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';

/**
 * ONE NUMBER -> ONE STUDENT.
 *
 * The product rule, and the reason these tests exist: anonymous auth cannot
 * enforce it. `ensureSession()` hands the SAME uid to every number used in one
 * browser, so without a binding on the credential, logging in as one child's
 * number and then another's lands on the same `parents/{uid}` subtree and shows
 * both children. That was reported as "I gave one student a code and the other
 * student got it too".
 *
 * The credential carries the binding, so the NUMBER decides which child opens —
 * not the browser, and not whichever child happens to be first in the list.
 *
 * Runs against the MOCK backend; the Firestore path satisfies the same contract.
 */
describe('login binding: one number, one student', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('stores the student binding and reports it back in the code list', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '246810', {
      name: 'Ananya Sharma',
      studentId: 'stu-ananya',
      parentUid: 'fam-1',
    });

    const [entry] = await backend.listLoginCodes();
    expect(entry.phone).toBe('9876543210');
    expect(entry.name).toBe('Ananya Sharma');
    expect(entry.studentId).toBe('stu-ananya');
    expect(entry.parentUid).toBe('fam-1');
  });

  it('verifyOtp returns the bound student, so the app can skip any picker', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '246810', {studentId: 'stu-ananya', parentUid: 'fam-1'});

    const sent = await backend.sendOtp('9876543210');
    const result = await backend.verifyOtp('246810', sent);

    expect(result.ok).toBe(true);
    expect(result.studentId).toBe('stu-ananya');
  });

  it('two numbers bound to two children stay separate', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '246810', {studentId: 'stu-ananya'});
    await backend.setLoginCode('9876543211', '135790', {studentId: 'stu-rahul'});

    const a = await backend.verifyOtp('246810', await backend.sendOtp('9876543210'));
    const b = await backend.verifyOtp('135790', await backend.sendOtp('9876543211'));

    // The whole point: same browser, same anonymous uid, different children.
    expect(a.studentId).toBe('stu-ananya');
    expect(b.studentId).toBe('stu-rahul');
    expect(a.studentId).not.toBe(b.studentId);
  });

  it('refuses to silently re-point a number that is already bound elsewhere', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '246810', {studentId: 'stu-ananya'});

    await expect(
      backend.setLoginCode('9876543210', '111111', {studentId: 'stu-rahul'}),
    ).rejects.toThrow(/already bound to a different student/i);

    // The original binding must survive the refused write.
    const [entry] = await backend.listLoginCodes();
    expect(entry.studentId).toBe('stu-ananya');
  });

  it('allows rotating the code for the SAME student', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '246810', {studentId: 'stu-ananya'});
    await backend.setLoginCode('9876543210', '999999', {studentId: 'stu-ananya'});

    const sent = await backend.sendOtp('9876543210');
    expect((await backend.verifyOtp('246810', sent)).ok).toBe(false);
    expect((await backend.verifyOtp('999999', sent)).ok).toBe(true);
  });

  it('rebind: true moves a number deliberately, and only then', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '246810', {studentId: 'stu-ananya'});
    await backend.setLoginCode('9876543210', '135790', {studentId: 'stu-rahul', rebind: true});

    const result = await backend.verifyOtp('135790', await backend.sendOtp('9876543210'));
    expect(result.ok).toBe(true);
    expect(result.studentId).toBe('stu-rahul');
  });

  it('a legacy code with no binding verifies but reports no student', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '246810');

    const result = await backend.verifyOtp('246810', await backend.sendOtp('9876543210'));
    expect(result.ok).toBe(true);
    expect(result.studentId ?? null).toBeNull();
  });

  it('deleting a code removes its binding with it', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '246810', {studentId: 'stu-ananya'});
    await backend.deleteLoginCode('9876543210');

    const codes = await backend.listLoginCodes();
    expect(codes).toHaveLength(0);
  });
});
