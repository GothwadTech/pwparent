/**
 * useAppData — every piece of application state and every data call the app
 * makes, in one place.
 *
 * Extracted out of App.tsx so the shell only decides what is on screen, and so
 * the read budget has a single owner to reason about.
 *
 * There is no demo-data seeding in here. In firebase mode the app starts empty
 * and stays empty until an administrator issues a login code for the number.
 *
 * READ BUDGET
 * The backend wraps every read in `cachedRead` (60s TTL, in-flight
 * de-duplication) and every write in `cachedWrite` (invalidate afterwards), so
 * moving between screens costs zero additional Firestore reads. Nothing here
 * has to remember that.
 */
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {AnnouncementItem, ParentProfileData, PurchaseItem, ScreenId, StudentProfile} from '../types';
import {
  activeBackendMode,
  backendConfigError,
  emptyProfile,
  getBackend,
  usingMockData,
  type Backend,
  type SendOtpResult,
} from '../lib/backend';
import {recomputeStudent} from '../lib/admin';
import {hasSeenOnboarding, markOnboarded} from '../lib/firstVisit';
import {clearStoredSession, hasStoredSession, storedSessionPhone, writeStoredSession} from '../lib/sessionStore';
import {saveSlice} from '../lib/backend/demoStore';
import {visibleStudentsFor} from '../lib/studentScope';
import {currentAdmin, type AdminIdentity} from '../lib/adminAuth';

/** Where "back" from the Admin Panel should land. */
const ADMIN_RETURN_SCREEN: ScreenId = 'login';

export interface AppData {
  // ── backend / session ────────────────────────────────────────────────────
  backend: Backend | null;
  mode: 'mock' | 'firebase';
  uid: string | null;
  phoneNumber: string;
  admin: AdminIdentity | null;
  configError: string | null;
  refreshAdmin: () => Promise<void>;

  // ── domain data ──────────────────────────────────────────────────────────
  students: StudentProfile[];
  activeStudent: StudentProfile;
  announcements: AnnouncementItem[];
  purchases: PurchaseItem[];
  parentProfile: ParentProfileData;
  otpResult: SendOtpResult | null;

  /**
   * True while a remembered session is being resumed. The shell holds its first
   * paint instead of flashing the login form — the flash is exactly what read as
   * "refresh pe login hat gaya". A hold, not a splash: nothing renders, nothing
   * auto-advances, and it always clears when the boot settles.
   */
  booting: boolean;

  // ── navigation ──────────────────────────────────────────────────────────
  screen: ScreenId;
  setScreen: (screen: ScreenId) => void;
  openAdmin: () => void;
  closeAdmin: () => void;

  // ── auth flow ────────────────────────────────────────────────────────────
  /** Header sync button: bypass the cache and re-read everything once. */
  refreshData: () => Promise<void>;
  handleLoginSubmit: (phone: string) => Promise<void>;
  handleOtpVerified: (code: string) => Promise<void>;
  handleSelectStudent: (student: StudentProfile) => void;
  handleLogout: () => void;
  handleSwitchNumber: () => void;
  handleDeleteParentProfile: () => void;
  /** Instant demo student login with sample data */
  handleDemoLogin: () => Promise<void>;

  // ── mutations ────────────────────────────────────────────────────────────
  completeOnboarding: () => void;
  handleSaveStudent: (student: StudentProfile) => void;
  handleDeleteStudent: (studentId: string) => void;
  handleSaveAnnouncement: (item: AnnouncementItem) => void;
  handleDeleteAnnouncement: (id: string) => void;
  handleSaveProfile: (profile: ParentProfileData) => void;
}

export function useAppData(): AppData {
  const [backend, setBackend] = useState<Backend | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);

  /**
   * First paint is already the right screen: onboarding on a genuine first
   * visit, login on every visit after that. Read synchronously from
   * localStorage inside the initializer so there is no flash and no delay.
   */
  /**
   * A device that remembers a session opens ON THE DASHBOARD, not on login.
   * Opening on login and hopping across once the restore lands is the blink
   * users read as "logged out again"; the boot hold below keeps the paint
   * still until the restore has actually decided, so the wrong screen is
   * never shown even for one frame.
   */
  const [screen, setScreen] = useState<ScreenId>(() =>
    !hasSeenOnboarding() ? 'onboarding1' : hasStoredSession() ? 'dashboard' : 'login',
  );
  /** Only ever true when this device remembers a session to resume. */
  const [booting, setBooting] = useState<boolean>(() => hasStoredSession());
  const [previousScreen, setPreviousScreen] = useState<ScreenId>(ADMIN_RETURN_SCREEN);

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeStudent, setActiveStudent] = useState<StudentProfile | null>(null);
  /**
   * The child THIS LOGIN NUMBER is bound to.
   *
   * Held in state, not just passed through hydration, because every screen has
   * to agree on it — not only the first one rendered after login. Anonymous auth
   * hands the same uid to every number used in one browser, so `students` can
   * legitimately hold siblings; this is what says which one of them you are.
   */
  const [boundStudentId, setBoundStudentId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [parentProfile, setParentProfile] = useState<ParentProfileData>(emptyProfile());
  const [otpResult, setOtpResult] = useState<SendOtpResult | null>(null);

  /** Guards a hydration racing a sign-out and resurrecting stale data. */
  const sessionRef = useRef<string | null>(null);

  const mode = backend?.mode ?? activeBackendMode;

  const refreshAdmin = useCallback(async () => {
    if (usingMockData) return;
    setAdmin(await currentAdmin());
  }, []);

  /**
   * Pull every collection for one uid. One network round trip, all cached.
   *
   * `sessionStudentId` is the child this LOGIN NUMBER is bound to. It decides
   * which dashboard opens, because the rule is one number -> one student and
   * there is no picker screen to fall back on. Anonymous auth cannot supply it:
   * `ensureSession()` hands the same uid to every number used in one browser, so
   * the credential — not the uid — is the only thing that knows which child you
   * meant. Legacy codes have no binding, hence the optional.
   */
  const hydrate = useCallback(async (
    instance: Backend,
    targetUid: string | null | undefined,
    sessionStudentId?: string | null,
  ) => {
    const key = targetUid ?? '';
    sessionRef.current = key;
    const stale = () => sessionRef.current !== key;

    try {
      const [kids, notes, orders, profile] = await Promise.all([
        instance.getLinkedStudents(targetUid),
        instance.getAnnouncements(),
        instance.getPurchases(targetUid),
        instance.getParentProfile(targetUid),
      ]);
      if (stale()) return;

      setStudents(kids);
      setAnnouncements(notes);
      setPurchases(orders);
      setParentProfile(profile);
      // The bound child wins. Then whatever was already open (so a background
      // refresh cannot switch the child under the parent's thumb). Then the only
      // child there is. `kids[0]` on a multi-child legacy account is a fallback
      // of last resort, not a choice being made for the user.
      setActiveStudent(
        (prev) =>
          (sessionStudentId ? kids.find((s) => s.id === sessionStudentId) : undefined) ??
          kids.find((s) => s.id === prev?.id) ??
          kids[0] ??
          null,
      );
      if (profile.mobileNumber) setPhoneNumber(profile.mobileNumber);
    } catch (error) {
      console.error('[app] hydration failed:', error);
    }
  }, []);

  // Boot: resolve the backend, then resume an existing session if there is one.
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const instance = await getBackend();
      if (cancelled) return;
      setBackend(instance);

      let restored;
      try {
        restored = await instance.restoreSession();
      } finally {
        // Never leave the shell held: a failed restore still has to land on a
        // real screen.
        if (!cancelled) setBooting(false);
      }
      if (cancelled) return;

      if (restored) {
        setUid(restored.uid);
        setPhoneNumber(restored.phone);
        setBoundStudentId(restored.studentId ?? null);
        await hydrate(instance, restored.uid, restored.studentId ?? null);
        // Straight to the child. No picker: one number is one student.
        if (!cancelled) setScreen('dashboard');
      } else {
        // Nothing resumable: land on login (we may have opened optimistically
        // on the dashboard) and remember whatever number this device held.
        setScreen('login');
        if (storedSessionPhone()) setPhoneNumber(storedSessionPhone());
      }
      void refreshAdmin();
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [hydrate, refreshAdmin]);

  // `#admin` deep link — kept so the panel stays reachable without the dock.
  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash.replace(/^#/, '') !== 'admin') return;
      setScreen((current) => {
        if (current === 'admin') return current;
        setPreviousScreen(current);
        return 'admin';
      });
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const openAdmin = useCallback(() => {
    setScreen((current) => {
      if (current !== 'admin') setPreviousScreen(current);
      return 'admin';
    });
    if (window.location.hash !== '#admin') window.location.hash = 'admin';
    void refreshAdmin();
  }, [refreshAdmin]);

  const closeAdmin = useCallback(() => {
    window.location.hash = '';
    setScreen(previousScreen);
  }, [previousScreen]);

  // ── auth flow ──────────────────────────────────────────────────────────────

  const handleLoginSubmit = useCallback(
    async (phone: string) => {
      setPhoneNumber(phone);
      setParentProfile((prev) => ({...prev, mobileNumber: phone}));
      setScreen('otp');
      if (!backend) return;
      try {
        setOtpResult(await backend.sendOtp(phone));
      } catch (error) {
        console.warn('[app] sendOtp failed:', error);
      }
    },
    [backend],
  );

  const handleOtpVerified = useCallback(
    async (code: string) => {
      if (!backend) throw new Error('Backend is still starting — try again in a second.');

      const result = await backend.verifyOtp(code, otpResult ?? undefined);
      if (!result.ok) throw new Error(result.error ?? 'Verification failed.');

      setUid(result.uid ?? null);
      setBoundStudentId(result.studentId ?? null);
      await hydrate(backend, result.uid, result.studentId ?? null);
      // The number decided the child, so there is nothing left to pick.
      setScreen('dashboard');
    },
    [backend, otpResult, hydrate],
  );

  /**
   * The header's circular sync button: drop the read cache and pull every
   * collection once more, so an admin's edit shows up immediately instead of
   * after the TTL. One user-triggered round trip, never automatic.
   */
  const refreshData = useCallback(async () => {
    if (!backend) return;
    backend.clearCache();
    await hydrate(backend, uid, boundStudentId);
  }, [backend, uid, boundStudentId, hydrate]);

  const handleSelectStudent = useCallback((student: StudentProfile) => {
    setActiveStudent(student);
    setScreen('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    void backend?.signOut().catch(() => undefined);
    clearStoredSession();
    setBooting(false);
    sessionRef.current = null;
    setUid(null);
    setAdmin(null);
    setBoundStudentId(null);
    setScreen('login');
  }, [backend]);

  const handleSwitchNumber = useCallback(() => {
    // Keep the anonymous uid — only the number changes. Signing out would
    // orphan the stored profile for no reason.
    sessionRef.current = null;
    clearStoredSession();
    setBooting(false);
    setPhoneNumber('');
    setOtpResult(null);
    // A different number means a different child — never carry the old binding
    // into the next session, or the previous family's profile would show up.
    setBoundStudentId(null);
    backend?.clearCache();
    setScreen('login');
  }, [backend]);

  const handleDeleteParentProfile = useCallback(() => {
    clearStoredSession();
    setBooting(false);
    setStudents([]);
    setActiveStudent(null);
    setBoundStudentId(null);
    setUid(null);
    void backend?.signOut().catch(() => undefined);
    setScreen('login');
  }, [backend]);

  /** Instant demo student login with sample data */
  const handleDemoLogin = useCallback(async () => {
    const demoPhone = '9876543210';
    const demoStudent: StudentProfile = {
      id: '1',
      name: 'Ayush Mishra',
      batch: 'Vidyapeeth 16-LN121E01',
      course: 'Lakshya Batch 2026',
      attendance: '95%',
      testsCompleted: 18,
      dppsDone: 52,
      videoWatchRate: '91%',
      testsTotal: 19,
      avgScorePercent: 78,
      accuracyPercent: 82,
      batchIds: ['batch-vp16'],
      tests: [
        {
          id: 't19',
          title: 'MISSION 30 : Test 19',
          date: '21-6-2026',
          mode: 'Online',
          status: 'ATTEMPTED',
          marksObtained: 234,
          marksTotal: 300,
          scorePercent: 78,
          accuracyPercent: 82,
        },
        {
          id: 't18',
          title: 'MISSION 30 : Test 18',
          date: '19-6-2026',
          mode: 'Online',
          status: 'ATTEMPTED',
          marksObtained: 198,
          marksTotal: 300,
          scorePercent: 66,
          accuracyPercent: 74,
        },
        {
          id: 't17',
          title: 'MISSION 30 : Test 17',
          date: '17-6-2026',
          mode: 'Offline',
          status: 'MISSED',
          marksTotal: 300,
        },
      ],
    };

    // 1. Immediately record stored session so reloads resume this session
    writeStoredSession({
      uid: 'demo-parent-uid',
      phone: demoPhone,
      studentId: '1',
    });

    // 2. Set all React state synchronously for instant zero-latency transition
    setPhoneNumber(demoPhone);
    setUid('demo-parent-uid');
    setBoundStudentId('1');
    setStudents([demoStudent]);
    setActiveStudent(demoStudent);
    setParentProfile({
      name: 'Demo Parent',
      countryCode: '+91',
      mobileNumber: demoPhone,
      email: 'parent@pw.live',
    });
    setBooting(false);
    sessionRef.current = 'demo-parent-uid';

    // 3. Immediately switch screen to dashboard
    setScreen('dashboard');

    // 4. Update the mock localStorage demo store so subsequent reads find it
    try {
      saveSlice('uid', 'demo-parent-uid');
      saveSlice('phone', demoPhone);
      saveSlice('students', [demoStudent]);
      saveSlice('profile', {
        name: 'Demo Parent',
        countryCode: '+91',
        mobileNumber: demoPhone,
        email: 'parent@pw.live',
      });
      backend?.clearCache();
    } catch {
      // ignore
    }
  }, [backend]);

  /**
   * Onboarding complete — remember it so the next open goes straight to login.
   * The write happens BEFORE the navigation so a reload mid-transition cannot
   * show the slides a second time.
   */
  const completeOnboarding = useCallback(() => {
    markOnboarded();
    setScreen('login');
  }, []);

  /**
   * What the PARENT app is allowed to see: exactly one child.
   *
   * `students` may hold siblings, because anonymous auth gives the same uid to
   * every number used in one browser and children live under that uid. Handing
   * the whole list to the UI is what made another family's child appear in this
   * parent's Profile section. The rule lives in `src/lib/studentScope.ts` so it
   * is one named, unit-tested decision rather than something every screen has to
   * remember to do.
   */
  const visibleStudents = useMemo<StudentProfile[]>(
    () => visibleStudentsFor(students, boundStudentId, activeStudent),
    [students, boundStudentId, activeStudent],
  );

  // ── mutations ──────────────────────────────────────────────────────────────

  const handleSaveStudent = useCallback(
    (student: StudentProfile) => {
      // Derived figures are recalculated, never taken as typed.
      const next = recomputeStudent(student);
      setStudents((prev) =>
        prev.some((s) => s.id === next.id) ? prev.map((s) => (s.id === next.id ? next : s)) : [...prev, next],
      );
      setActiveStudent((active) => (active?.id === next.id ? next : active));
      void backend?.saveStudent(next, uid).catch((error) => console.warn('[app] saveStudent failed:', error));
    },
    [backend, uid],
  );

  const handleDeleteStudent = useCallback(
    (studentId: string) => {
      setStudents((prev) => {
        const next = prev.filter((s) => s.id !== studentId);
        setActiveStudent((active) => (active?.id === studentId ? next[0] ?? null : active));
        return next;
      });
      void backend?.deleteStudent(studentId, uid).catch((error) => console.warn('[app] deleteStudent failed:', error));
    },
    [backend, uid],
  );

  const handleSaveAnnouncement = useCallback(
    (item: AnnouncementItem) => {
      setAnnouncements((prev) =>
        prev.some((a) => a.id === item.id) ? prev.map((a) => (a.id === item.id ? item : a)) : [item, ...prev],
      );
      void backend?.saveAnnouncement(item).catch((error) => console.warn('[app] saveAnnouncement failed:', error));
    },
    [backend],
  );

  const handleDeleteAnnouncement = useCallback(
    (id: string) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      void backend?.deleteAnnouncement(id).catch((error) => console.warn('[app] deleteAnnouncement failed:', error));
    },
    [backend],
  );

  const handleSaveProfile = useCallback(
    (profile: ParentProfileData) => {
      setParentProfile(profile);
      if (profile.mobileNumber) setPhoneNumber(profile.mobileNumber);
      void backend?.saveParentProfile(profile, uid).catch((error) =>
        console.warn('[app] saveParentProfile failed:', error),
      );
    },
    [backend, uid],
  );

  return {
    backend,
    booting,
    mode,
    uid,
    phoneNumber,
    admin,
    configError: backendConfigError,
    refreshAdmin,
    // One child only — see `visibleStudents`.
    students: visibleStudents,
    // ChildDashboardScreen expects a non-null student, and is only rendered when
    // there is one. The bound child was already picked during hydration; this
    // fallback just keeps a later refresh from clearing it.
    activeStudent: (activeStudent ?? visibleStudents[0] ?? null) as StudentProfile,
    announcements,
    purchases,
    parentProfile,
    otpResult,
    screen,
    setScreen,
    openAdmin,
    closeAdmin,
    refreshData,
    handleLoginSubmit,
    handleOtpVerified,
    handleSelectStudent,
    handleLogout,
    handleSwitchNumber,
    handleDeleteParentProfile,
    handleDemoLogin,
    completeOnboarding,
    handleSaveStudent,
    handleDeleteStudent,
    handleSaveAnnouncement,
    handleDeleteAnnouncement,
    handleSaveProfile,
  };
}
