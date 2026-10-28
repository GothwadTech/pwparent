/**
 * There is deliberately NO 'linked_accounts' entry either. The rule is one
 * number -> one student, so after login there is nothing to choose: the app
 * opens straight on that child's dashboard.
 *
 * There is deliberately NO 'splash' entry. The app used to open on a 2.8-second
 * branded splash screen; that was pure delay, so it is gone. The initial screen
 * is decided synchronously in `useAppData` (onboarding once, then login), so the
 * first paint is already a usable screen.
 */
export type ScreenId =
  | 'onboarding1'
  | 'onboarding2'
  | 'login'
  | 'otp'
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
  /**
   * Admin-seeded all-time attendance history. Day-wise marks are only kept for
   * the running week, so the lifetime "Total Study Days / Total Present Days"
   * figures are entered here and the week's live marks add on top.
   */
  baseStudyDays?: number;
  basePresentDays?: number;
}

export interface AnnouncementItem {
  id: string;
  author: string;
  timeAgo: string;
  isNew: boolean;
  content: string;
  videoLink?: string;
  imageUrl?: string;
}

/* ==========================================================================
   BATCH-CENTRIC MODEL
   ==========================================================================
   A batch is the unit everything hangs off: attendance is per batch, tests are
   per batch, and a test's results are one document per student IN that batch.
   Only an administrator can create or edit a batch (see firestore.rules).

   Firestore layout:

     batches/{batchId}                              Batch
     batches/{batchId}/members/{parentUid}          BatchMember
     batches/{batchId}/attendance/{studentId}       AttendanceMonth (one per month)
     batches/{batchId}/tests/{testId}               BatchTest
     batches/{batchId}/tests/{testId}/results/{studentId}   TestResult

   `members` is keyed by PARENT uid, not student id: the rules need to answer
   "may this caller read this batch?" with a single `exists()`, and a parent may
   have several children in the same batch.
   ========================================================================== */

/** Day-wise attendance mark. `L` = late, counted as present in the percentage. */
export type AttendanceMark = 'P' | 'A' | 'L';

/**
 * A batch. Deliberately minimal.
 *
 * `course`, `startDate` and `active` were REMOVED:
 *   • course   — duplicated the name and meant nothing on its own; the batch
 *                name is what shows everywhere now.
 *   • startDate— nothing derives from it, so it was a field to get wrong.
 *   • active   — a "visible to parents" toggle is meaningless here: a parent
 *                only ever sees batches they have been allotted to, so
 *                allotment IS the visibility control. A draft toggle that
 *                hides a batch nobody was allotted to yet changes nothing.
 *
 * `batchType` stays because it is functional, not cosmetic — it decides whether
 * the parent dashboard renders the offline/centre view or the online view.
 */
export interface Batch {
  id: string;
  name: string;
  batchType: 'online' | 'offline';
  /**
   * Which exam paper list this batch follows — 'NEET' today. Decides the
   * subject list a test's syllabus is built from (four NEET sections of 180
   * marks each). Optional so batches created before the field keep working.
   */
  subjectType?: string;
  /**
   * Which class the batch teaches — 'Class 12th' today, more later. Chosen at
   * creation like `subjectType`; optional so older batches keep reading.
   */
  classLevel?: string;
  createdAt?: string;
  createdBy?: string;
  /** Admin-seeded lifetime attendance history; the running week adds on top. */
  baseStudyDays?: number;
  basePresentDays?: number;
}

/**
 * One row in the admin's parent directory.
 *
 * Students live under `parents/{uid}/children`, so an administrator who wants
 * to create a student has to choose WHICH parent owns it first. This is that
 * choice, reduced to what the picker needs to show.
 */
export interface ParentDirectoryEntry {
  uid: string;
  name: string;
  mobileNumber: string;
  /** How many children this parent already has. */
  childCount: number;
}

/**
 * A student paired with the parent uid that owns it.
 *
 * The Admin Panel needs the owner uid to write an allotment, because membership
 * documents are keyed by parent — a student id alone is not enough.
 */
export interface AllotableStudent extends StudentProfile {
  parentUid: string;
}

/** One parent's children inside one batch. Keyed by parent uid in Firestore. */
export interface BatchMember {
  id: string;
  parentUid: string;
  studentIds: string[];
  joinedAt: string;
}

/** `{'2026-10-05': 'P', '2026-10-06': 'A'}` — unmarked days are simply absent. */
export type MonthMarks = Record<string, AttendanceMark>;

/**
 * One student's ENTIRE attendance history in one batch — a single document.
 *
 * Deliberately one document per student rather than one per month:
 *
 *   • **Rules become expressible.** `batches/{b}/attendance/{studentId}` can be
 *     gated on "is this caller the parent of `studentId`?" directly. A
 *     `{studentId}__{month}` document id would force the rule to split a string
 *     to find the student, which is obscure and easy to get wrong.
 *   • **Fewer reads.** Loading a student's calendar is one read, cached,
 *     instead of one read per month navigated.
 *   • **It is small.** A full year is 12 × 31 = 372 two-character entries —
 *     kilobytes against Firestore's 1 MB document limit.
 *
 * The whole batch's month view is then one collection query (admin-only).
 */
export interface AttendanceRecord {
  /** Always equal to `studentId` — the document id IS the student id. */
  id: string;
  batchId: string;
  studentId: string;
  /** `{'2026-10': {'2026-10-05': 'P'}, '2026-11': {...}}` */
  months: Record<string, MonthMarks>;
}

/** One syllabus line on a test. Weightage is a percentage of the paper. */
export interface SyllabusTopic {
  subject: string;
  topic: string;
  /** 0-100. Optional: not every test is broken down by weight. */
  weightage?: number;
}

export type BatchTestStatus = 'scheduled' | 'completed';

/**
 * A test belonging to a BATCH, not to a student.
 *
 * This is the inversion of the old model, where `TestRecord` was embedded in
 * each student's document. Marks now live in `results/{studentId}` so every
 * student allotted to the batch appears on the same test.
 */
export interface BatchTest {
  id: string;
  batchId: string;
  title: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  mode: 'Online' | 'Offline';
  /**
   * Which paper list the test belongs to on the All Tests screen.
   * Defaults to Objective when absent (every test created before this field).
   */
  paperType?: 'Objective' | 'Subjective';
  marksTotal: number;
  status: BatchTestStatus;
  syllabus: SyllabusTopic[];
  createdAt?: string;
}

/** One student's outcome on one batch test. */
export interface TestResult {
  id: string;
  studentId: string;
  /** Denormalised so a results list renders without reading every profile. */
  studentName: string;
  marksObtained?: number;
  accuracyPercent?: number;
  status: 'ATTEMPTED' | 'MISSED';
  /** Derived: marksObtained / marksTotal * 100. Never typed by hand. */
  scorePercent?: number;

  /** Questions answered correctly. Admin-entered. */
  correctCount?: number;
  /** Questions actually attempted. Accuracy is derived from these two. */
  attemptedCount?: number;
  /**
   * Class-level figures, denormalised ON PURPOSE.
   *
   * A rank, a top score and a class average each need EVERY student's marks on
   * the paper — and the security rules let a parent read only their own child's
   * result (listing `results` is admin-only). So they cannot be derived on the
   * parent's device without breaking isolation; the administrator enters them
   * once per result and they are stored, exactly like `studentName`.
   */
  rank?: number;
  topScore?: number;
  avgScore?: number;

  /**
   * Marks obtained per syllabus line, keyed `${subject}||${topic}`.
   * Powers the subject-wise accordion on the test detail screen; the subject
   * row's figure is the sum of its topics, never typed separately.
   */
  topicMarks?: Record<string, number>;
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
  /** Display name of the currently selected batch. Kept for UI compatibility. */
  batch: string;
  avatarBg?: string;
  course: string;
  /** Kept as a display string ("96%") for backwards compatibility with the UI. */
  attendance: string;
  testsCompleted: number;
  dppsDone: number;
  videoWatchRate: string;

  /**
   * Batches this student is allotted to. A student may be in several at once,
   * which is why this is a list and not a single `batchId`.
   *
   * `batch` above stays as the display name of whichever batch is currently
   * selected, so existing components keep rendering unchanged.
   */
  batchIds?: string[];

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
