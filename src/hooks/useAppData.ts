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
import {useCallback, useEffect, useRef, useState} from 'react';
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

  // ── navigation ───────────────────────────────────────────────────────────
  screen: ScreenId;
  setScreen: (screen: ScreenId) => void;
  openAdmin: () => void;
  closeAdmin: () => void;

  // ── auth flow ────────────────────────────────────────────────────────────
  handleLoginSubmit: (phone: string) => Promise<void>;
  handleOtpVerified: (code: string) => Promise<void>;
  handleSelectStudent: (student: StudentProfile) => void;
  handleLogout: () => void;
  handleSwitchNumber: () => void;
  handleDeleteParentProfile: () => void;

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
  const [screen, setScreen] = useState<ScreenId>(() =>
    hasSeenOnboarding() ? 'login' : 'onboarding1',
  );
  const [previousScreen, setPreviousScreen] = useState<ScreenId>(ADMIN_RETURN_SCREEN);

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeStudent, setActiveStudent] = useState<StudentProfile | null>(null);
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

  /** Pull every collection for one uid. One network round trip, all cached. */
  const hydrate = useCallback(async (instance: Backend, targetUid: string | null | undefined) => {
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
      setActiveStudent((prev) => kids.find((s) => s.id === prev?.id) ?? kids[0] ?? null);
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

      const restored = await instance.restoreSession();
      if (cancelled) return;

      if (restored) {
        setUid(restored.uid);
        setPhoneNumber(restored.phone);
        await hydrate(instance, restored.uid);
        if (!cancelled) setScreen('linked_accounts');
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
      await hydrate(backend, result.uid);
      setScreen('linked_accounts');
    },
    [backend, otpResult, hydrate],
  );

  const handleSelectStudent = useCallback((student: StudentProfile) => {
    setActiveStudent(student);
    setScreen('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    void backend?.signOut().catch(() => undefined);
    sessionRef.current = null;
    setUid(null);
    setAdmin(null);
    setScreen('login');
  }, [backend]);

  const handleSwitchNumber = useCallback(() => {
    // Keep the anonymous uid — only the number changes. Signing out would
    // orphan the stored profile for no reason.
    sessionRef.current = null;
    setPhoneNumber('');
    setOtpResult(null);
    backend?.clearCache();
    setScreen('login');
  }, [backend]);

  const handleDeleteParentProfile = useCallback(() => {
    setStudents([]);
    setActiveStudent(null);
    setUid(null);
    void backend?.signOut().catch(() => undefined);
    setScreen('login');
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
    mode,
    uid,
    phoneNumber,
    admin,
    configError: backendConfigError,
    refreshAdmin,
    students,
    // ChildDashboardScreen expects a non-null student; it is only rendered
    // from linked_accounts after one has been selected.
    activeStudent: (activeStudent ?? students[0] ?? null) as StudentProfile,
    announcements,
    purchases,
    parentProfile,
    otpResult,
    screen,
    setScreen,
    openAdmin,
    closeAdmin,
    handleLoginSubmit,
    handleOtpVerified,
    handleSelectStudent,
    handleLogout,
    handleSwitchNumber,
    handleDeleteParentProfile,
    completeOnboarding,
    handleSaveStudent,
    handleDeleteStudent,
    handleSaveAnnouncement,
    handleDeleteAnnouncement,
    handleSaveProfile,
  };
}
