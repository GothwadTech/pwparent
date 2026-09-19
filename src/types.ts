export type ScreenId =
  | 'splash'
  | 'onboarding1'
  | 'onboarding2'
  | 'login'
  | 'otp'
  | 'linked_accounts'
  | 'dashboard'
  | 'profile'
  | 'parent_profile'
  | 'purchases';

export type MainTabId = 'dashboard' | 'announcements' | 'support';

export interface BatchOption {
  id: string;
  name: string;
  isPopular?: boolean;
  batchType?: 'online' | 'offline';
}

export interface AnnouncementItem {
  id: string;
  author: string;
  timeAgo: string;
  isNew: boolean;
  content: string;
  videoLink: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer?: string[];
  isHelpfulPrompt?: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  batch: string;
  avatarBg?: string;
  course: string;
  attendance: string;
  testsCompleted: number;
  dppsDone: number;
  videoWatchRate: string;
}

export interface ParentProfileData {
  name: string;
  countryCode: string;
  mobileNumber: string;
  email: string;
}

export interface PurchaseItem {
  id: string;
  title: string;
  date: string;
  status: 'successful' | 'pending';
  totalItem: number;
  price: string;
  category: string;
  imageBg: string;
}

export interface AppConfig {
  customLogoUrl: string | null;
  phoneNumber: string;
  activeStudent: StudentProfile | null;
  isMockPhoneFrame: boolean;
}
