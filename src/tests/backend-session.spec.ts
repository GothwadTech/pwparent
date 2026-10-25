import {beforeEach, describe, expect, it} from 'vitest';
import {MOCK_OTP, getBackend, mockAnnouncements, mockStudents} from '../lib/backend';

/**
 * Session + Admin Panel persistence in MOCK mode.
 *
 * MOCK mode writes to localStorage (src/lib/backend/demoStore.ts) so that what
 * an admin edits survives a reload. These tests exercise that round-trip; the
 * Firestore path shares the same Backend interface and is covered by the
 * facade tests in backend.spec.ts.
 */
describe('mock backend: phone login creates a session', () => {
  beforeEach(async () => {
    const backend = await getBackend();
    backend.resetLocalData();
  });

  it('stores the typed phone number as a PROFILE FIELD, not as a credential', async () => {
    const backend = await getBackend();
    const session = await backend.signInWithPhone('9876543210');

    expect(session.uid).toBeTruthy();
    expect(session.isNewUser).toBe(true);
    expect(session.phone).toBe('9876543210');

    const profile = await backend.getParentProfile();
    expect(profile.mobileNumber).toBe('9876543210');
  });

  it('derives a stable uid from the number so a reload keeps the same account', async () => {
    const backend = await getBackend();

    const first = await backend.signInWithPhone('9876543210');
    const second = await backend.signInWithPhone('9876543210');

    expect(second.uid).toBe(first.uid);
    expect(second.isNewUser).toBe(false);
  });

  it('normalises a formatted number down to 10 digits', async () => {
    const backend = await getBackend();
    const session = await backend.signInWithPhone('+91 98765-43210');

    expect(session.phone).toBe('9876543210');
    expect((await backend.getParentProfile()).mobileNumber).toBe('9876543210');
  });

  it('exposes the session uid to callers (what the UI passes to every read)', async () => {
    const backend = await getBackend();
    expect(backend.currentUid()).toBeNull();

    const session = await backend.signInWithPhone('9876543210');
    expect(backend.currentUid()).toBe(session.uid);
  });

  it('seeds the academic record on first login so the dashboard is never empty', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');

    const students = await backend.getLinkedStudents();
    expect(students.length).toBe(mockStudents.length);
    expect(students[0].name).toBe(mockStudents[0].name);
  });
});

describe('mock backend: OTP demo codes', () => {
  beforeEach(async () => {
    const backend = await getBackend();
    backend.resetLocalData();
  });

  it('accepts the documented demo code and signs the user in', async () => {
    const backend = await getBackend();
    const sent = await backend.sendOtp('9876543210');

    expect(sent.mode).toBe('mock');
    expect(sent.phone).toBe('9876543210');
    expect(sent.mockHint).toContain(MOCK_OTP);

    const result = await backend.verifyOtp(MOCK_OTP, sent);
    expect(result.ok).toBe(true);
    expect(result.uid).toBeTruthy();
    expect((await backend.getParentProfile()).mobileNumber).toBe('9876543210');
  });

  it('remembers the phone from sendOtp even if verifyOtp is called without it', async () => {
    const backend = await getBackend();
    await backend.sendOtp('9876543210');

    const result = await backend.verifyOtp(MOCK_OTP);
    expect(result.ok).toBe(true);
    expect((await backend.getParentProfile()).mobileNumber).toBe('9876543210');
  });

  it('does NOT send or read SMS — the hint says so explicitly', async () => {
    const backend = await getBackend();
    const sent = await backend.sendOtp('9876543210');

    expect(sent.mockHint?.toLowerCase()).toContain('no sms');
  });
});

describe('mock backend: Admin Panel writes persist', () => {
  beforeEach(async () => {
    const backend = await getBackend();
    backend.resetLocalData();
    await backend.signInWithPhone('9876543210');
  });

  it('saves an edited attendance figure and reads it back', async () => {
    const backend = await getBackend();
    const [first] = await backend.getLinkedStudents();

    await backend.saveStudent({...first, attendance: '42%'});

    const after = await backend.getLinkedStudents();
    expect(after.find((s) => s.id === first.id)?.attendance).toBe('42%');
    expect(after.length).toBe(mockStudents.length); // updated, not duplicated
  });

  it('appends a brand-new student', async () => {
    const backend = await getBackend();
    await backend.saveStudent({
      id: 'new-kid',
      name: 'Second Child',
      batch: 'NEET',
      course: 'Yakeen NEET Batch',
      attendance: '88%',
      testsCompleted: 3,
      dppsDone: 10,
      videoWatchRate: '70%',
      tests: [],
    });

    const after = await backend.getLinkedStudents();
    expect(after.length).toBe(mockStudents.length + 1);
    expect(after.map((s) => s.id)).toContain('new-kid');
  });

  it('deletes a student', async () => {
    const backend = await getBackend();
    const [first] = await backend.getLinkedStudents();

    await backend.deleteStudent(first.id);

    const after = await backend.getLinkedStudents();
    expect(after.map((s) => s.id)).not.toContain(first.id);
  });

  it('persists a full test record including raw marks', async () => {
    const backend = await getBackend();
    const [first] = await backend.getLinkedStudents();

    await backend.saveStudent({
      ...first,
      tests: [
        {
          id: 't99',
          title: 'MISSION 30 : Test 99',
          date: '25-10-2026',
          mode: 'Online',
          status: 'ATTEMPTED',
          marksObtained: 270,
          marksTotal: 300,
          scorePercent: 90,
          accuracyPercent: 92,
        },
      ],
    });

    const saved = (await backend.getLinkedStudents()).find((s) => s.id === first.id);
    expect(saved?.tests?.[0].marksObtained).toBe(270);
    expect(saved?.tests?.[0].scorePercent).toBe(90);
  });

  it('creates, updates and deletes announcements', async () => {
    const backend = await getBackend();

    await backend.saveAnnouncement({
      id: 'x1',
      author: 'Admin',
      timeAgo: 'now',
      isNew: true,
      content: 'Seeded from the Admin Panel.',
      videoLink: '',
    });
    expect((await backend.getAnnouncements()).map((a) => a.id)).toContain('x1');

    await backend.saveAnnouncement({
      id: 'x1',
      author: 'Admin',
      timeAgo: '2m ago',
      isNew: false,
      content: 'Edited.',
      videoLink: '',
    });
    const afterEdit = await backend.getAnnouncements();
    expect(afterEdit.filter((a) => a.id === 'x1')).toHaveLength(1);
    expect(afterEdit.find((a) => a.id === 'x1')?.content).toBe('Edited.');

    await backend.deleteAnnouncement('x1');
    expect((await backend.getAnnouncements()).map((a) => a.id)).not.toContain('x1');
  });

  it('saves a purchase with Tailwind gradient classes for imageBg', async () => {
    const backend = await getBackend();

    await backend.savePurchase({
      id: 'buy1',
      title: 'Lakshya Batch 2026',
      date: '25 Oct 2026',
      status: 'successful',
      totalItem: 1,
      price: 'Free',
      category: 'Batch',
      imageBg: 'from-blue-600 to-indigo-700',
    });

    const saved = (await backend.getPurchases()).find((p) => p.id === 'buy1');
    expect(saved?.imageBg).toMatch(/^from-/);
  });

  it('seedDemoData restores the shipped dataset after admin edits', async () => {
    const backend = await getBackend();
    await backend.deleteStudent((await backend.getLinkedStudents())[0].id);
    expect((await backend.getLinkedStudents()).length).toBe(mockStudents.length - 1);

    await backend.seedDemoData();

    expect((await backend.getLinkedStudents()).length).toBe(mockStudents.length);
    expect(await backend.getAnnouncements()).toEqual(mockAnnouncements);
  });

  it('resetLocalData drops everything and falls back to the shipped seed', async () => {
    const backend = await getBackend();
    await backend.saveStudent({...(await backend.getLinkedStudents())[0], name: 'Renamed'});

    backend.resetLocalData();

    expect(await backend.getLinkedStudents()).toEqual(mockStudents);
    expect(backend.currentUid()).toBeNull();
  });
});
