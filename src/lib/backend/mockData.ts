import type {AnnouncementItem, ParentProfileData, PurchaseItem, StudentProfile} from '../../types';

/**
 * Demo dataset used when VITE_BACKEND_MODE=mock (the default).
 * Mirrors what App.tsx renders out of the box, so the UI is never empty.
 */

export const mockStudents: StudentProfile[] = [
  {
    id: '1',
    name: 'Ayush Mishra',
    batch: 'Career Pass',
    course: 'Lakshya Batch 2026',
    attendance: '96%',
    testsCompleted: 18,
    dppsDone: 52,
    videoWatchRate: '91%',
    testsTotal: 19,
    avgScorePercent: 78,
    accuracyPercent: 82,
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
    testsTotal: 17,
    avgScorePercent: 64,
    accuracyPercent: 71,
    tests: [
      {
        id: 't14',
        title: 'MISSION 30 : Test 14',
        date: '13-6-2026',
        mode: 'Online',
        status: 'ATTEMPTED',
        marksObtained: 192,
        marksTotal: 300,
        scorePercent: 64,
        accuracyPercent: 71,
      },
    ],
  },
];

/**
 * MOCK MODE ONLY. Never reaches the Firebase path — `emptyProfile()` returns
 * blank fields there.
 *
 * The number is an obvious placeholder (9000000000) rather than a real-looking
 * one, so a stray demo value can never be mistaken for somebody's actual
 * number. `backend.spec.ts` only asserts the shape (`/^\d{10}$/`), not the
 * digits.
 */
export const mockParentProfile: ParentProfileData = {
  name: 'Demo Parent',
  countryCode: 'IN +91',
  mobileNumber: '9000000000',
  email: 'parent@example.com',
};

export const mockAnnouncements: AnnouncementItem[] = [
  {
    id: 'a1',
    author: 'PW Academics',
    timeAgo: '2h ago',
    isNew: true,
    content: 'Lakshya Batch 2026 — Test #19 schedule published. Syllabus: Rotational Motion + Chemical Bonding.',
    videoLink: 'https://example.pwvideos.dev/announcements/test-19',
  },
  {
    id: 'a2',
    author: 'Branch Coordinator',
    timeAgo: '1d ago',
    isNew: false,
    content: 'Parent-teacher meeting this Sunday, 10:00 AM. Attendance report will be shared on the app.',
    videoLink: '',
  },
];

/**
 * `imageBg` holds Tailwind gradient classes, NOT a hex colour —
 * PurchasesScreen renders it as `bg-gradient-to-br ${item.imageBg}`.
 */
export const mockPurchases: PurchaseItem[] = [
  {
    id: 'p1',
    title: 'Lakshya Batch 2026 (Career Pass)',
    date: '12 Apr 2026',
    status: 'successful',
    totalItem: 1,
    price: '₹12,900',
    category: 'Course',
    imageBg: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'p2',
    title: 'DPP Booklet — Physics Vol. 2',
    date: '02 May 2026',
    status: 'pending',
    totalItem: 1,
    price: '₹499',
    category: 'Material',
    imageBg: 'from-amber-600 to-rose-700',
  },
];

/**
 * Login code accepted in MOCK mode only.
 *
 * Real (firebase) mode verifies a per-phone 6-digit code that an ADMIN set,
 * stored as a PBKDF2 digest at `credentials/{phone}`. This constant is never
 * consulted there.
 */
export const MOCK_OTP = '123456';

/** Length of a login code. The OTP screen renders exactly this many boxes. */
export const CODE_LENGTH = 6;
