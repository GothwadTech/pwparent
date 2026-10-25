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
  | 'purchases'
  | 'admin';

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

/**
 * One test attempt in a student's academic record.
 *
 * Everything except `id`/`title` is optional so older mock data (and any doc
 * already in Firestore) keeps type-checking. The Admin Panel writes all fields.
 */
export interface TestRecord {
  id: string;
  title: string;
  date: string;
  mode: 'Online' | 'Offline';
  status: 'ATTEMPTED' | 'MISSED';
  marksObtained?: number;
  marksTotal?: number;
  scorePercent?: number;
  accuracyPercent?: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  batch: string;
  avatarBg?: string;
  course: string;
  /** Kept as a display string ("96%") for backwards compatibility with the UI. */
  attendance: string;
  testsCompleted: number;
  dppsDone: number;
  videoWatchRate: string;

  // ---- Admin-editable academic record (optional; falls back to UI defaults) ----
  /** Denominator shown as "testsCompleted / testsTotal". */
  testsTotal?: number;
  avgScorePercent?: number;
  accuracyPercent?: number;
  tests?: TestRecord[];
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
