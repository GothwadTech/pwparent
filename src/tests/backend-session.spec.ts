import {beforeEach, describe, expect, it} from 'vitest';
import {CODE_LENGTH, MOCK_OTP, getBackend, mockStudents} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';

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
    clearDemoStore();
    const backend = await getBackend();
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
    clearDemoStore();
    const backend = await getBackend();
  });

  it('accepts the documented demo code and signs the user in', async () => {
    const backend = await getBackend();
    const sent = await backend.sendOtp('9876543210');

    expect(sent.mode).toBe('mock');
    expect(sent.phone).toBe('9876543210');
    expect(sent.notice).toContain(MOCK_OTP);

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

    expect(sent.notice?.toLowerCase()).toContain('no sms');
  });
});

describe('mock backend: Admin Panel writes persist', () => {
  beforeEach(async () => {
    clearDemoStore();
    const backend = await getBackend();
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


  it('clearing the store drops the session and the seeded students', async () => {
    const backend = await getBackend();
    await backend.saveStudent({...(await backend.getLinkedStudents())[0], name: 'Renamed'});
    expect(backend.currentUid()).toBeTruthy();

    clearDemoStore();

    expect(backend.currentUid()).toBeNull();
    expect(await backend.restoreSession()).toBeNull();
  });
});

describe('mock backend: session restore', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('restoreSession() is null before anyone signs in', async () => {
    const backend = await getBackend();
    expect(await backend.restoreSession()).toBeNull();
  });

  it('restoreSession() returns the uid + number after a login, without re-writing the profile', async () => {
    const backend = await getBackend();
    const first = await backend.signInWithPhone('9876543210');

    const restored = await backend.restoreSession();
    expect(restored).not.toBeNull();
    expect(restored?.uid).toBe(first.uid);
    expect(restored?.phone).toBe('9876543210');
    expect(restored?.isNewUser).toBe(false);
  });

  it('restoreSession() is null once signed out', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    await backend.signOut();

    expect(await backend.restoreSession()).toBeNull();
  });
});

describe('login codes: an admin-set code replaces the mock default', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('the mock code is 6 digits, matching CODE_LENGTH', () => {
    expect(CODE_LENGTH).toBe(6);
    expect(MOCK_OTP).toHaveLength(CODE_LENGTH);
    expect(MOCK_OTP).toMatch(/^\d{6}$/);
  });

  it('setLoginCode -> verifyOtp accepts the issued code', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '314159');
    const sent = await backend.sendOtp('9876543210');

    expect(sent.registered).toBe(true);
    expect((await backend.verifyOtp('314159', sent)).ok).toBe(true);
  });

  it('an issued code overrides the mock default for that number only', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '314159');
    const sent = await backend.sendOtp('9876543210');

    expect((await backend.verifyOtp(MOCK_OTP, sent)).ok).toBe(false);

    const other = await backend.sendOtp('9000000000');
    expect((await backend.verifyOtp(MOCK_OTP, other)).ok).toBe(true);
  });

  it('listLoginCodes exposes the number and never the code', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '314159');

    const codes = await backend.listLoginCodes();
    expect(codes.map((c) => c.phone)).toContain('9876543210');
    // The phone must not leak the code. (Deliberately not a substring
    // of the number itself, or this assertion would be meaningless.)
    expect(JSON.stringify(codes)).not.toContain('314159');
  });

  it('deleteLoginCode falls back to the mock default afterwards', async () => {
    const backend = await getBackend();
    await backend.setLoginCode('9876543210', '314159');
    await backend.deleteLoginCode('9876543210');

    const sent = await backend.sendOtp('9876543210');
    expect((await backend.verifyOtp(MOCK_OTP, sent)).ok).toBe(true);
  });
});

describe('read cache', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('repeated reads are served from cache and counted', async () => {
    // The mock backend reads localStorage directly, so exercise the cache the
    // FIREBASE backend actually uses — that is where the 50k/day budget is won.
    const {DEFAULT_TTL_MS, cacheStats, cachedRead, resetCache} = await import('../lib/backend/readCache');
    resetCache();

    let networkReads = 0;
    const loader = async () => {
      networkReads += 1;
      return ['a', 'b'];
    };

    await cachedRead('children:u1', loader, DEFAULT_TTL_MS);
    await cachedRead('children:u1', loader, DEFAULT_TTL_MS);
    await cachedRead('children:u1', loader, DEFAULT_TTL_MS);

    expect(networkReads).toBe(1);

    const stats = cacheStats();
    expect(stats.reads).toBe(1);
    expect(stats.hits).toBe(2);
    expect(stats.entries).toBe(1);
    expect(stats.hitRate).toMatch(/%$/);
  });

  it('concurrent reads of the same key collapse into ONE network read', async () => {
    const {DEFAULT_TTL_MS, cachedRead, resetCache} = await import('../lib/backend/readCache');
    resetCache();

    let networkReads = 0;
    const loader = async () => {
      networkReads += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return networkReads;
    };

    // N simultaneous mounts (React 19 StrictMode double-invokes effects, so this
    // is not hypothetical) must cost 1 read, not N.
    const results = await Promise.all(
      Array.from({length: 6}, () => cachedRead('parent:u1', loader, DEFAULT_TTL_MS)),
    );

    expect(networkReads).toBe(1);
    expect(new Set(results).size).toBe(1);
  });

  it('invalidate() forces the next read to hit the network again', async () => {
    const {DEFAULT_TTL_MS, cachedRead, invalidate, resetCache} = await import('../lib/backend/readCache');
    resetCache();

    let value = 1;
    const loader = async () => value;

    expect(await cachedRead('purchases:u1', loader, DEFAULT_TTL_MS)).toBe(1);
    value = 2;
    expect(await cachedRead('purchases:u1', loader, DEFAULT_TTL_MS)).toBe(1); // still cached

    invalidate('purchases:u1');
    expect(await cachedRead('purchases:u1', loader, DEFAULT_TTL_MS)).toBe(2);
  });

  it('errors are never cached — a failed read retries next time', async () => {
    const {DEFAULT_TTL_MS, cachedRead, resetCache} = await import('../lib/backend/readCache');
    resetCache();

    let attempts = 0;
    const loader = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('permission-denied');
      return 'ok';
    };

    await expect(cachedRead('announcements', loader, DEFAULT_TTL_MS)).rejects.toThrow('permission-denied');
    await expect(cachedRead('announcements', loader, DEFAULT_TTL_MS)).resolves.toBe('ok');
    expect(attempts).toBe(2);
  });

  it('clearCache() empties the cache without touching stored data', async () => {
    const {cacheStats} = await import('../lib/backend/readCache');
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');

    backend.clearCache();
    expect(cacheStats().entries).toBe(0);

    // Clearing the cache must never touch stored data.
    expect((await backend.getLinkedStudents()).length).toBe(mockStudents.length);
  });
});
