/**
 * App shell — layout, screen routing and the always-on modals.
 *
 * All application state lives in `src/hooks/useAppData.ts`; this file only
 * decides what is on screen.
 *
 * ── LAYOUT ─────────────────────────────────────────────────────────────────
 * The phone UI is unchanged and now fills the entire viewport at any screen
 * size. See src/lib/layout.ts for the mechanics: the shell is a uniform
 * `transform: scale()` of the 430×880 design the app was built for, so it
 * grows to cover the window instead of floating inside a decorative phone
 * frame. There is no separate desktop design — same components, same
 * proportions, just bigger.
 *
 * Modals and the settings dock are deliberately SIBLINGS of the scaled shell,
 * never children: a CSS transform makes an element the containing block for
 * `position: fixed` descendants, which would trap fixed overlays inside it.
 *
 * ── LOGIN ──────────────────────────────────────────────────────────────────
 * Phone number → 6-digit code issued by an administrator. No SMS is sent or
 * read; the number is stored as a profile field, not a credential.
 *
 * ── ADMIN PANEL ────────────────────────────────────────────────────────────
 * Reachable from the settings dock or by opening the app with `#admin`.
 * Username + password in firebase mode, local passcode in mock mode.
 */
import React, {useState} from 'react';
import {useAppData} from './hooks/useAppData';
import {useBatchView} from './hooks/useBatchView';
import {useDppView} from './hooks/useDppView';
import {fluidShellStyle, useFluidScale} from './lib/layout';
import {OnboardingScreen} from './components/OnboardingScreen';
import {LoginScreen} from './components/LoginScreen';
import {OtpScreen} from './components/OtpScreen';
import {ChildDashboardScreen} from './components/ChildDashboardScreen';
import {ProfileScreen} from './components/ProfileScreen';
import {ParentProfileScreen} from './components/ParentProfileScreen';
import {PurchasesScreen} from './components/PurchasesScreen';
import {AdminPanelScreen} from './components/admin/AdminPanelScreen';
import {SettingsDock} from './components/SettingsDock';
import {HowItWorksModal} from './components/HowItWorksModal';
import {LogoCustomizerModal} from './components/LogoCustomizerModal';
import {IconClipboard} from './components/icons/AppIcons';

/** Ambient wash. Outside the scaled shell so it always covers the window. */
export const App: React.FC = () => {
  const app = useAppData();
  const scale = useFluidScale();

  /**
   * Batch data for whichever child is currently selected. Called
   * unconditionally at the top level (React's rules of hooks), and it no-ops
   * cheaply when there is no backend, no student or no uid yet.
   */
  const batchView = useBatchView(app.backend, app.activeStudent, app.uid);
  const dppSummary = useDppView(batchView.selectedBatchId, app.activeStudent?.id ?? null);

  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>('/assets/ic_launcher_round.webp');
  /** The settings / Firestore panel is now opened on purpose, never floating. */
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const openSettings = () => setIsSettingsOpen(true);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isLogoCustomizerOpen, setIsLogoCustomizerOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const {
    backend,
    booting,
    refreshData,
    mode,
    uid,
    phoneNumber,
    admin,
    configError,
    students,
    activeStudent,
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
    handleSaveAnnouncement,
    handleDeleteAnnouncement,
    handleSaveProfile,
  } = app;

  const openLogoCustomizer = () => setIsLogoCustomizerOpen(true);

  const renderCurrentScreen = () => {
    switch (screen) {
      case 'onboarding1':
      case 'onboarding2':
        return (
          <OnboardingScreen
            initialSlide={screen === 'onboarding2' ? 1 : 0}
            onComplete={completeOnboarding}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={openLogoCustomizer}
          />
        );

      case 'login':
        return (
          <LoginScreen
            initialPhoneNumber={phoneNumber}
            onSubmit={(phone) => void handleLoginSubmit(phone)}
            onHowItWorks={() => setIsHowItWorksOpen(true)}
            onOpenSettings={openSettings}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={openLogoCustomizer}
          />
        );

      case 'otp':
        return (
          <OtpScreen
            phoneNumber={phoneNumber}
            registered={otpResult?.registered ?? true}
            notice={otpResult?.notice}
            onEditPhone={handleSwitchNumber}
            onVerifySuccess={handleOtpVerified}
            onHowItWorks={() => setIsHowItWorksOpen(true)}
            onOpenSettings={openSettings}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={openLogoCustomizer}
          />
        );

      case 'dashboard':
        // A dashboard with no child to show must NEVER be a blank screen —
        // that is exactly the "OTP ke baad poora white" report. Hydration can
        // come back empty (slow network, a denied read, a record that lives
        // under another uid); say so honestly and offer a retry instead.
        if (!activeStudent) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{background: '#EAEEF9'}}
              >
                <IconClipboard size={26} />
              </div>
              <p className="text-[15px] font-extrabold mb-2">No student record loaded</p>
              <p className="text-[12px] leading-relaxed text-[#6B7280] mb-5">
                The student linked to this number could not be loaded. This usually
                means a read failed — try again, or log in with a different number.
              </p>
              <button
                type="button"
                onClick={() => void refreshData()}
                className="w-full py-3 rounded-xl bg-[#5747D6] text-white text-[13px] font-bold mb-2"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={handleSwitchNumber}
                className="w-full py-3 rounded-xl border border-[#E4E6EB] text-[13px] font-bold"
              >
                Use a different number
              </button>
            </div>
          );
        }
        return (
          <ChildDashboardScreen
            student={activeStudent}
            onBack={() => setScreen('profile')}
            onOpenProfile={() => setScreen('profile')}
            onOpenSettings={openSettings}
            onRefreshData={refreshData}
            customLogoUrl={customLogoUrl}
            onOpenLogoCustomizer={openLogoCustomizer}
            announcements={announcements}
            // Real batch model: the batches this child is allotted to, plus the
            // attendance calendar, tests and subject breakdown derived from
            // them. See src/hooks/useBatchView.ts.
            batches={batchView.batches}
            selectedBatchId={batchView.selectedBatchId}
            onSelectBatch={batchView.selectBatch}
            calendarDays={batchView.calendarDays}
            offlineTests={batchView.offlineTests}
            subjects={batchView.subjects}
            summary={batchView.summary}
            dpp={dppSummary}
            batchTests={batchView.tests}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            students={students}
            activeStudent={activeStudent}
            onSelectStudent={handleSelectStudent}
            onBack={() => setScreen('dashboard')}
            onOpenPurchases={() => setScreen('purchases')}
            onOpenParentProfile={() => setScreen('parent_profile')}
            onOpenTerms={() => setIsTermsOpen(true)}
            onLogout={handleLogout}
          />
        );

      case 'parent_profile':
        return (
          <ParentProfileScreen
            initialData={parentProfile}
            onSave={handleSaveProfile}
            onBack={() => setScreen('profile')}
            onDeleteProfile={handleDeleteParentProfile}
          />
        );

      case 'purchases':
        return <PurchasesScreen onBack={() => setScreen('profile')} items={purchases} />;

      case 'admin':
        return (
          <AdminPanelScreen
            backend={backend}
            mode={mode}
            uid={uid}
            admin={admin}
            configError={configError}
            announcements={announcements}
            onSaveAnnouncement={handleSaveAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onBack={closeAdmin}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-white text-[#17181C] relative font-['Plus_Jakarta_Sans',sans-serif]">

      {/* The scaled shell: the phone UI, grown to fill the window. */}
      <main
        style={fluidShellStyle(scale)}
        className="bg-white flex flex-col relative z-10 overflow-hidden"
      >
        {/* A remembered session holds the first paint instead of flashing the
            login form — a blank hold, not a splash: it clears the moment the
            boot settles either way. */}
        {booting ? null : renderCurrentScreen()}
      </main>

      {/* ── Everything below stays OUTSIDE the scaled subtree ─────────────── */}

      <SettingsDock
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        backend={backend}
        mode={mode}
        uid={uid}
        phone={phoneNumber}
        admin={admin}
        configError={configError}
        onOpenAdmin={() => {
          openAdmin();
        }}
        onSwitchNumber={handleSwitchNumber}
        onSignOut={handleLogout}
      />

      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />

      <LogoCustomizerModal
        isOpen={isLogoCustomizerOpen}
        onClose={() => setIsLogoCustomizerOpen(false)}
        currentLogoUrl={customLogoUrl}
        onSaveLogo={setCustomLogoUrl}
      />

      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E6EB] rounded-2xl max-w-sm w-full p-6 text-[#17181C] shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Terms and Conditions</h3>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              This is a demonstration build of a parent&apos;s companion app. It is not affiliated with, or endorsed
              by, any coaching organisation. Login codes are issued by an administrator of this deployment; no SMS is
              sent or read at any point.
            </p>
            <button
              type="button"
              onClick={() => setIsTermsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#5747D6] hover:bg-[#4b3bc4] font-semibold text-sm transition-colors text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
