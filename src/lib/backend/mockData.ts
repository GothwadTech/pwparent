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
];

export const mockParentProfile: ParentProfileData = {
  name: 'Ayush',
  countryCode: 'IN +91',
  mobileNumber: '9335010032',
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

export const mockPurchases: PurchaseItem[] = [
  {
    id: 'p1',
    title: 'Lakshya Batch 2026 (Career Pass)',
    date: '12 Apr 2026',
    status: 'successful',
    totalItem: 1,
    price: '₹12,900',
    category: 'Course',
    imageBg: '#005677',
  },
  {
    id: 'p2',
    title: 'DPP Booklet — Physics Vol. 2',
    date: '02 May 2026',
    status: 'pending',
    totalItem: 1,
    price: '₹499',
    category: 'Material',
    imageBg: '#8E75FF',
  },
];

/** OTP accepted in mock mode so the whole flow is clickable without a backend. */
export const MOCK_OTP = '1234';
