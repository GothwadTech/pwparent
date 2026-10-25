/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * App shell.
 *
 * ── DATA FLOW ──────────────────────────────────────────────────────────────
 * Every read/write goes through the Backend facade (`src/lib/backend`), which
 * resolves to localStorage-backed demo data in MOCK mode or to
 * Anonymous-Auth + Firestore in FIREBASE mode. Components never import
 * `firebase/*` directly, so the whole UI works with zero configuration.
 *
 * ── LOGIN ──────────────────────────────────────────────────────────────────
 * Phone number -> OTP screen -> `verifyOtp(code)`. The OTP is a DEMO code
 * (no SMS is sent or read). Verification silently creates an anonymous
 * Firebase session, which is what gives us a stable `uid`, and the phone
 * number is stored as a profile field at `parents/{uid}.mobileNumber`.
 *
 * ── ADMIN PANEL ────────────────────────────────────────────────────────────
 * Passcode-gated screen for seeding/editing the academic record. Reachable by
 * clicking the DEMO badge or by opening the app with `#admin` in the URL.
 * See docs/ADMIN_PANEL.md.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AnnouncementItem,
  ParentProfileData,
  PurchaseItem,
  ScreenId,
  StudentProfile,
} from './types';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { LoginScreen } from './components/LoginScreen';
import { OtpScreen } from './components/OtpScreen';
import { LinkedAccountsScreen } from './components/LinkedAccountsScreen';
import { ChildDashboardScreen } from './components/ChildDashboardScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { ParentProfileScreen } from './components/ParentProfileScreen';
import { PurchasesScreen } from './components/PurchasesScreen';
import { HowItWorksModal } from './components/HowItWorksModal';
import { AddChildModal } from './components/AddChildModal';
import { LogoCustomizerModal } from './components/LogoCustomizerModal';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { DemoBadge } from './components/DemoBadge';
import {
  type Backend,
  type SendOtpResult,
  getBackend,
  mockAnnouncements,
  mockParentProfile,
  mockPurchases,
  mockStudents,
} from './lib/backend';

/** Screen the user returns to when they leave the Admin Panel. */
const ADMIN_RETURN_SCREEN: ScreenId = 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('splash');
  const [previousScreen, setPreviousScreen] = useState<ScreenId>(ADMIN_RETURN_SCREEN);

  // Backend facade + session
  const [backend, setBackend] = useState<Backend | null>(null);
  const [backendMode, setBackendMode] = useState<'mock' | 'firebase'>('mock');
  const [uid, setUid] = useState<string | null>(null);
  const [otpResult, setOtpResult] = useState<SendOtpResult | null>(null);

  // User-supplied / persisted data
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>('/assets/ic_launcher_round.webp');

  // Modals
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isLogoCustomizerOpen, setIsLogoCustomizerOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Data — seeded with the demo dataset so the first paint is never empty,
  // then hydrated from the backend once a session exists.
  const [students, setStudents] = useState<StudentProfile[]>(mockStudents);
  const [activeStudent, setActiveStudent] = useState<StudentProfile>(mockStudents[0]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(mockAnnouncements);
  const [purchases, setPurchases] = useState<PurchaseItem[]>(mockPurchases);
  const [parentProfile, setParentProfile] = useState<ParentProfileData>(mockParentProfile);

  // ── Resolve the backend once, on mount ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const resolved = await getBackend();
      if (cancelled) return;
      setBackend(resolved);
      setBackendMode(resolved.mode);

      // Returning visitor? Anonymous auth persists across reloads, so restore
      // the session and hydrate straight through to the dashboard.
      const existingUid = resolved.currentUid();
      if (!existingUid) return;
      setUid(existingUid);

      const [kids, notes, orders, profile] = await Promise.all([
        resolved.getLinkedStudents(existingUid),
        resolved.getAnnouncements(),
        resolved.getPurchases(existingUid),
        resolved.getParentProfile(existingUid),
      ]);
      if (cancelled) return;

      if (kids.length > 0) {
        setStudents(kids);
        setActiveStudent(kids[0]);
      }
      if (notes.length > 0) setAnnouncements(notes);
      if (orders.length > 0) setPurchases(orders);
      setParentProfile(profile);
      if (profile.mobileNumber) setPhoneNumber(profile.mobileNumber);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── #admin deep link ─────────────────────────────────────────────────────
  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash.replace(/^#/, '') === 'admin') {
        setCurrentScreen((current) => {
          if (current === 'admin') return current;
          setPreviousScreen(current === 'splash' ? ADMIN_RETURN_SCREEN : current);
          return 'admin';
        });
      }
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const openAdmin = useCallback(() => {
    setCurrentScreen((current) => {
      if (current !== 'admin') setPreviousScreen(current);
      return 'admin';
    });
    if (window.location.hash !== '#admin') window.location.hash = 'admin';
  }, []);

  const closeAdmin = useCallback(() => {
    window.location.hash = '';
    setCurrentScreen(previousScreen);
  }, [previousScreen]);

  // ── Flow transitions ─────────────────────────────────────────────────────
  const handleSplashContinue = () => setCurrentScreen('onboarding1');
  const handleOnboardingComplete = () => setCurrentScreen('login');

  const handleLoginSubmit = async (phone: string) => {
    setPhoneNumber(phone);
    setParentProfile((prev) => ({ ...prev, mobileNumber: phone }));
    setCurrentScreen('otp');

    // Records the phone for verifyOtp(). Sends no SMS in either mode.
    if (backend) {
      try {
        setOtpResult(await backend.sendOtp(phone));
      } catch (error) {
        console.warn('[app] sendOtp failed:', error);
      }
    }
  };

  /**
   * The OTP screen calls this with the 4 digits. Throwing surfaces the message
   * in the screen's error slot; resolving advances to the linked-accounts list.
   */
  const handleOtpVerified = async (code: string) => {
    if (!backend) throw new Error('Backend is still starting — try again in a second.');

    const result = await backend.verifyOtp(code, otpResult ?? undefined);
    if (!result.ok) throw new Error(result.error ?? 'Verification failed.');

    setUid(result.uid ?? null);

    const [kids, notes, orders, profile] = await Promise.all([
      backend.getLinkedStudents(result.uid),
      backend.getAnnouncements(),
      backend.getPurchases(result.uid),
      backend.getParentProfile(result.uid),
    ]);

    if (kids.length > 0) {
      setStudents(kids);
      setActiveStudent(kids[0]);
    }
    if (notes.length > 0) setAnnouncements(notes);
    if (orders.length > 0) setPurchases(orders);
    setParentProfile(profile);

    setCurrentScreen('linked_accounts');
  };

  const handleSelectStudent = (student: StudentProfile) => {
    setActiveStudent(student);
    setCurrentScreen('dashboard');
  };

  const handleAddChild = (newStudent: StudentProfile) => {
    setStudents((prev) => [...prev, newStudent]);
    void backend?.saveStudent(newStudent, uid).catch((error) => {
      console.warn('[app] saveStudent failed:', error);
    });
  };

  const handleLogout = () => {
    void backend?.signOut().catch(() => undefined);
    setUid(null);
    setCurrentScreen('login');
  };

  const handleDeleteParentProfile = () => {
    setStudents([]);
    setUid(null);
    void backend?.signOut().catch(() => undefined);
    setCurrentScreen('login');
  };

  // ── Admin Panel mutations ────────────────────────────────────────────────
  const handleSaveStudent = (student: StudentProfile) => {
    setStudents((prev) => {
      const next = prev.some((s) => s.id === student.id)
        ? prev.map((s) => (s.id === student.id ? student : s))
        : [...prev, student];
      setActiveStudent((active) => (active.id === student.id ? student : active));
      return next;
    });
    void backend?.saveStudent(student, uid).catch((error) => {
      console.warn('[app] saveStudent failed:', error);
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setActiveStudent((active) => (active.id === studentId ? students[0] ?? active : active));
    void backend?.deleteStudent(studentId, uid).catch((error) => {
      console.warn('[app] deleteStudent failed:', error);
    });
  };

  const handleSaveAnnouncement = (item: AnnouncementItem) => {
    setAnnouncements((prev) =>
      prev.some((a) => a.id === item.id) ? prev.map((a) => (a.id === item.id ? item : a)) : [item, ...prev],
    );
    void backend?.saveAnnouncement(item).catch((error) => {
      console.warn('[app] saveAnnouncement failed:', error);
    });
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    void backend?.deleteAnnouncement(id).catch((error) => {
      console.warn('[app] deleteAnnouncement failed:', error);
    });
  };

  const handleSeedDemoData = async () => {
    if (!backend) return;
    try {
      await backend.seedDemoData(uid);
      const [kids, notes, orders] = await Promise.all([
        backend.getLinkedStudents(uid),
        backend.getAnnouncements(),
        backend.getPurchases(uid),
      ]);
      setStudents(kids);
      setActiveStudent(kids[0] ?? activeStudent);
      setAnnouncements(notes);
      setPurchases(orders);
    } catch (error) {
      console.warn('[app] seedDemoData failed:', error);
    }
  };

  const handleResetLocalData = () => {
    backend?.resetLocalData();
    setStudents(mockStudents);
    setActiveStudent(mockStudents[0]);
    setAnnouncements(mockAnnouncements);
    setPurchases(mockPurchases);
    setParentProfile(mockParentProfile);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreen
            onContinue={handleSplashContinue}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={() => setIsLogoCustomizerOpen(true)}
          />
        );
      case 'onboarding1':
        return (
          <OnboardingScreen
            initialSlide={0}
            onComplete={handleOnboardingComplete}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={() => setIsLogoCustomizerOpen(true)}
          />
        );
      case 'onboarding2':
        return (
          <OnboardingScreen
            initialSlide={1}
            onComplete={handleOnboardingComplete}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={() => setIsLogoCustomizerOpen(true)}
          />
        );
      case 'login':
        return (
          <LoginScreen
            initialPhoneNumber={phoneNumber}
            onSubmit={(phone) => void handleLoginSubmit(phone)}
            onHowItWorks={() => setIsHowItWorksOpen(true)}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={() => setIsLogoCustomizerOpen(true)}
          />
        );
      case 'otp':
        return (
          <OtpScreen
            phoneNumber={phoneNumber}
            onEditPhone={() => setCurrentScreen('login')}
            onVerifySuccess={handleOtpVerified}
            onHowItWorks={() => setIsHowItWorksOpen(true)}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={() => setIsLogoCustomizerOpen(true)}
            hint={otpResult?.mockHint}
          />
        );
      case 'linked_accounts':
        return (
          <LinkedAccountsScreen
            students={students}
            onSelectStudent={handleSelectStudent}
            onAddChild={() => setIsAddChildOpen(true)}
            onOpenProfile={() => setCurrentScreen('profile')}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={() => setIsLogoCustomizerOpen(true)}
          />
        );
      case 'dashboard':
        return (
          <ChildDashboardScreen
            student={activeStudent}
            onBack={() => setCurrentScreen('linked_accounts')}
            onOpenProfile={() => setCurrentScreen('profile')}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={() => setIsLogoCustomizerOpen(true)}
            announcements={announcements}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            students={students}
            activeStudent={activeStudent}
            onSelectStudent={(student) => setActiveStudent(student)}
            onAddChild={() => setIsAddChildOpen(true)}
            onBack={() => setCurrentScreen('dashboard')}
            onOpenPurchases={() => setCurrentScreen('purchases')}
            onOpenParentProfile={() => setCurrentScreen('parent_profile')}
            onOpenTerms={() => setIsTermsOpen(true)}
            onLogout={handleLogout}
          />
        );
      case 'parent_profile':
        return (
          <ParentProfileScreen
            initialData={parentProfile}
            onSave={(updated) => {
              setParentProfile(updated);
              void backend?.saveParentProfile(updated, uid).catch((error) => {
                console.warn('[app] saveParentProfile failed:', error);
              });
            }}
            onBack={() => setCurrentScreen('profile')}
            onDeleteProfile={handleDeleteParentProfile}
          />
        );
      case 'purchases':
        return <PurchasesScreen onBack={() => setCurrentScreen('profile')} items={purchases} />;
      case 'admin':
        return (
          <AdminPanelScreen
            mode={backendMode}
            uid={uid}
            students={students}
            announcements={announcements}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            onSaveAnnouncement={handleSaveAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onSeedDemoData={() => void handleSeedDemoData()}
            onResetLocalData={handleResetLocalData}
            onBack={closeAdmin}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col items-center justify-center relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#005677]/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-950/20 rounded-full blur-[140px]" />
      </div>

      {/* Main App Container: true mobile UI without artificial toolbars */}
      <main className="w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:max-h-[94vh] sm:rounded-[36px] sm:border sm:border-[#1e202e] shadow-2xl overflow-hidden bg-[#0a0b10] flex flex-col relative z-10">
        <div className="flex-1 w-full h-full flex flex-col overflow-hidden min-h-0">
          {renderCurrentScreen()}
        </div>
      </main>

      {/* Demo marker + Admin Panel entry point */}
      <DemoBadge backendMode={backendMode} onOpenAdmin={openAdmin} />

      {/* Modals */}
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />

      <AddChildModal isOpen={isAddChildOpen} onClose={() => setIsAddChildOpen(false)} onAdd={handleAddChild} />

      <LogoCustomizerModal
        isOpen={isLogoCustomizerOpen}
        onClose={() => setIsLogoCustomizerOpen(false)}
        currentLogoUrl={customLogoUrl}
        onSaveLogo={setCustomLogoUrl}
      />

      {/* Terms & Conditions Modal */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#12131d] border border-[#232535] rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Terms and Conditions</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              This is a demonstration build of a parent&apos;s companion app. It is not affiliated with, or
              endorsed by, any coaching organisation. Academic records shown here are editable sample data
              managed from the Admin Panel, and the sign-in step sends no SMS.
            </p>
            <button
              type="button"
              onClick={() => setIsTermsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#8E75FF] hover:bg-[#7d62fc] font-semibold text-sm transition-colors text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
