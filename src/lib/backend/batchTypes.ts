/**
 * Batch operations — the admin-owned half of the Backend contract.
 *
 * Split into its own interface (which `Backend` extends) so neither this file
 * nor `types.ts` grows past the repo's 500-line ceiling as the batch model
 * gains operations.
 *
 * WHO MAY CALL WHAT
 *   create / edit / delete batch, allot members, set attendance, create tests,
 *   enter results  -> administrator only (enforced in firestore.rules)
 *   read a batch, its tests, its results, its attendance
 *                  -> administrator, or a parent whose uid is in
 *                     `batches/{batchId}/members/{parentUid}`
 */
import type {
  AttendanceMark,
  AttendanceRecord,
  Batch,
  BatchMember,
  BatchTest,
  MonthMarks,
  AllotableStudent,
  StudentProfile,
  SyllabusTopic,
  TestResult,
} from '../../types';

export interface BatchOps {
  /* ── batches ────────────────────────────────────────────────────────────── */
  /**
   * Batches visible to the caller. For an admin this is every batch; for a
   * parent it is only the batches their uid appears in.
   *
   * `parentUid` defaults to the current session uid.
   */
  listBatches(parentUid?: string | null): Promise<Batch[]>;
  /** Every batch, admin-only. Powers the Admin Panel's batch list. */
  listAllBatches(): Promise<Batch[]>;
  getBatch(batchId: string): Promise<Batch | null>;
  saveBatch(batch: Batch): Promise<void>;
  deleteBatch(batchId: string): Promise<void>;

  /* ── membership (allotment) ─────────────────────────────────────────────── */
  listBatchMembers(batchId: string): Promise<BatchMember[]>;
  /**
   * Allot students to a batch. Creates or updates the member document for that
   * parent uid and keeps `StudentProfile.batchIds` in sync.
   */
  allotStudents(batchId: string, parentUid: string, studentIds: string[]): Promise<void>;
  removeAllotment(batchId: string, parentUid: string): Promise<void>;
  /**
   * The students in a batch, resolved to profiles so the admin UI can show
   * names without a second round of reads.
   */
  listBatchStudents(batchId: string): Promise<StudentProfile[]>;
  /**
   * Admin-only: every student belonging to every parent, each tagged with the
   * parent uid that owns it. Powers the "allot students" picker — an admin
   * cannot allot a student they cannot find.
   *
   * Costs one read per parent plus one per children subcollection, so it is
   * cached like everything else. Returns `[]` for a non-admin rather than
   * throwing, because the rules deny the query and the UI should show an empty
   * picker, not an error screen.
   */
  listAllStudents(): Promise<AllotableStudent[]>;

  /* ── attendance ─────────────────────────────────────────────────────────── */
  /**
   * One student's whole attendance record in this batch — every month, one
   * document, one read. Never null: an untouched student returns an empty
   * record so the calendar renders "nothing marked yet" instead of crashing.
   */
  getAttendance(batchId: string, studentId: string): Promise<AttendanceRecord>;
  /**
   * Set (or with `null`, CLEAR) one day's mark. Read-modify-writes the student's
   * record, which is why the whole record comes back.
   */
  setAttendanceDay(
    batchId: string,
    studentId: string,
    day: string,
    mark: AttendanceMark | null,
  ): Promise<AttendanceRecord>;
  /** Every student's record in the batch — one collection query. Admin-only. */
  listBatchAttendance(batchId: string): Promise<AttendanceRecord[]>;

  /* ── tests ──────────────────────────────────────────────────────────────── */
  listTests(batchId: string): Promise<BatchTest[]>;
  getTest(batchId: string, testId: string): Promise<BatchTest | null>;
  saveTest(batchId: string, test: BatchTest): Promise<void>;
  deleteTest(batchId: string, testId: string): Promise<void>;

  /* ── results ────────────────────────────────────────────────────────────── */
  /**
   * Admin-only: every result on a test. A parent calling this gets a denied
   * query and an empty array — `list` on results would expose the whole class.
   */
  listResults(batchId: string, testId: string): Promise<TestResult[]>;
  /**
   * ONE student's result, by targeted `get()`. This is what a parent uses: the
   * rules allow reading your own child's result but not listing the class.
   * Returns null when nothing has been entered yet.
   */
  getResult(batchId: string, testId: string, studentId: string): Promise<TestResult | null>;
  /**
   * Save one student's result. `scorePercent` is recomputed here from
   * marksObtained / test.marksTotal, never taken from the caller.
   */
  saveResult(
    batchId: string,
    testId: string,
    studentId: string,
    result: Omit<TestResult, 'id' | 'studentId' | 'scorePercent'>,
  ): Promise<void>;
  deleteResult(batchId: string, testId: string, studentId: string): Promise<void>;
}

/* ── shared helpers (used by both backend implementations and the UI) ──────── */

/** `YYYY-MM` for a given date. */
export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** `YYYY-MM-DD` for a given date. */
export function dayKey(date: Date = new Date()): string {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Today's `YYYY-MM-DD`. */
export const todayKey = () => dayKey(new Date());

/** Number of days in a `YYYY-MM` month. */
export function daysInMonth(month: string): number {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon, 0).getDate();
}

/** Every `YYYY-MM-DD` in a month, in order. */
export function monthDays(month: string): string[] {
  const total = daysInMonth(month);
  return Array.from({length: total}, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
}

/**
 * Attendance percentage from a month document.
 *
 * Late counts as present (the student did attend). Days with no mark at all are
 * EXCLUDED from the denominator, so a month in progress does not read as a
 * string of absences. Returns 0 when nothing has been marked yet.
 */
export function attendancePercent(days: MonthMarks | undefined): number {
  const marks = Object.values(days ?? {});
  if (marks.length === 0) return 0;
  const present = marks.filter((m) => m === 'P' || m === 'L').length;
  return Math.round((present / marks.length) * 100);
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  marked: number;
  percent: number;
}

export function summarizeAttendance(days: MonthMarks | undefined): AttendanceSummary {
  const marks = Object.values(days ?? {});
  const present = marks.filter((m) => m === 'P').length;
  const late = marks.filter((m) => m === 'L').length;
  const absent = marks.filter((m) => m === 'A').length;
  return {
    present,
    absent,
    late,
    marked: marks.length,
    percent: attendancePercent(days),
  };
}

/** Total syllabus weightage, for spotting a paper that does not add up to 100. */
export function syllabusWeightTotal(syllabus: SyllabusTopic[] | undefined): number {
  return (syllabus ?? []).reduce((sum, t) => sum + (typeof t.weightage === 'number' ? t.weightage : 0), 0);
}

/** `marksObtained / marksTotal * 100`, rounded. 0 when either side is missing. */
export function scorePercentOf(marksObtained: number | undefined, marksTotal: number | undefined): number {
  if (typeof marksObtained !== 'number' || !marksTotal || marksTotal <= 0) return 0;
  return Math.round((marksObtained / marksTotal) * 100);
}

/** An empty record, so callers never have to null-check `months`. */
export function emptyAttendanceRecord(batchId: string, studentId: string): AttendanceRecord {
  return {id: studentId, batchId, studentId, months: {}};
}

/** One month's marks out of a full record, without null-checking at call sites. */
export function monthMarksOf(record: AttendanceRecord | null | undefined, month: string): MonthMarks {
  return record?.months?.[month] ?? {};
}

/** Percentage across EVERY month in a record — the all-time figure. */
export function overallAttendancePercent(record: AttendanceRecord | null | undefined): number {
  const all = Object.values(record?.months ?? {}).flatMap((m) => Object.values(m));
  if (all.length === 0) return 0;
  const present = all.filter((m) => m === 'P' || m === 'L').length;
  return Math.round((present / all.length) * 100);
}

/**
 * Apply one day's mark to a record, returning a NEW record.
 *
 * Pure, so both backends share the exact same read-modify-write logic and the
 * `null` (clear) case cannot drift between the mock and Firebase paths.
 */
export function withDayMark(
  record: AttendanceRecord,
  day: string,
  mark: AttendanceMark | null,
): AttendanceRecord {
  const month = day.slice(0, 7);
  const days: MonthMarks = {...(record.months?.[month] ?? {})};
  if (mark === null) delete days[day];
  else days[day] = mark;

  return {...record, months: {...(record.months ?? {}), [month]: days}};
}

/** New batch id — short, sortable, collision-resistant enough for one admin. */
export function newBatchId(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** New test id within a batch. */
export function newBatchTestId(existing: BatchTest[]): string {
  let n = existing.length + 1;
  const taken = new Set(existing.map((t) => t.id));
  while (taken.has(`t${n}`)) n += 1;
  return `t${n}`;
}
