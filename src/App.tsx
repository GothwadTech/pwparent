/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScreenId, StudentProfile, ParentProfileData } from './types';
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('splash');
  const [phoneNumber, setPhoneNumber] = useState('9335010032');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>('/assets/ic_launcher_round.webp');

  // Modals state
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isLogoCustomizerOpen, setIsLogoCustomizerOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Initial linked students from user's screenshot
  const [students, setStudents] = useState<StudentProfile[]>([
    {
      id: '1',
      name: 'Ayush Mishra',
      batch: 'Career Pass',
      course: 'Lakshya Batch 2026',
      attendance: '96%',
      testsCompleted: 18,
      dppsDone: 52,
      videoWatchRate: '91%',
    },
    {
      id: '2',
      name: 'Ayush',
      batch: 'NEET',
      course: 'Yakeen NEET Batch',
      attendance: '92%',
      testsCompleted: 14,
      dppsDone: 46,
      videoWatchRate: '86%',
    },
  ]);

  const [activeStudent, setActiveStudent] = useState<StudentProfile>(students[0]);

  // Parent Profile state from user's screenshot
  const [parentProfile, setParentProfile] = useState<ParentProfileData>({
    name: 'Ayush',
    countryCode: 'IN +91',
    mobileNumber: '9335010032',
    email: 'ayushpcpsmishra0110@gmail.com',
  });

  // Handle flow transitions
  const handleSplashContinue = () => {
    setCurrentScreen('onboarding1');
  };

  const handleOnboardingComplete = () => {
    setCurrentScreen('login');
  };

  const handleLoginSubmit = (phone: string) => {
    setPhoneNumber(phone);
    setParentProfile((prev) => ({ ...prev, mobileNumber: phone }));
    setCurrentScreen('otp');
  };

  const handleOtpVerified = () => {
    setCurrentScreen('linked_accounts');
  };

  const handleSelectStudent = (student: StudentProfile) => {
    setActiveStudent(student);
    setCurrentScreen('dashboard');
  };

  const handleAddChild = (newStudent: StudentProfile) => {
    setStudents((prev) => [...prev, newStudent]);
  };

  const handleLogout = () => {
    setCurrentScreen('login');
  };

  const handleDeleteParentProfile = () => {
    setStudents([]);
    setCurrentScreen('login');
  };

  // Render current active screen
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
            onSubmit={handleLoginSubmit}
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
            onSave={(updated) => setParentProfile(updated)}
            onBack={() => setCurrentScreen('profile')}
            onDeleteProfile={handleDeleteParentProfile}
          />
        );
      case 'purchases':
        return (
          <PurchasesScreen
            onBack={() => setCurrentScreen('profile')}
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

      {/* Main App Container: True mobile UI without artificial toolbars */}
      <main className="w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:max-h-[94vh] sm:rounded-[36px] sm:border sm:border-[#1e202e] shadow-2xl overflow-hidden bg-[#0a0b10] flex flex-col relative z-10">
        <div className="flex-1 w-full h-full flex flex-col overflow-hidden min-h-0">
          {renderCurrentScreen()}
        </div>
      </main>

      {/* Modals */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      <AddChildModal
        isOpen={isAddChildOpen}
        onClose={() => setIsAddChildOpen(false)}
        onAdd={handleAddChild}
      />

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
              Physics Wallah Parent&apos;s App is designed to help guardians monitor academic progress, attendance, and test performance in real-time. All data is securely transmitted and encrypted.
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
