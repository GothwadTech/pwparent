/**
 * The admin's JSON query runner, pure logic.
 *
 * A query is the same shape as docs/video-extracted-test-data.md: a list of
 * tests with dates, modes, statuses, scores, class figures and per-subject
 * chapter marks. Running it UPSERTs: a test whose title already exists in the
 * batch is updated in place (same id), anything else is created — so re-running
 * a corrected query never duplicates papers.
 */
import type {BatchTest, StudentProfile, SyllabusTopic, TestResult} from '../types';

export interface JsonQueryChapter {
  chapter: string;
  marks: number;
}
export interface JsonQuerySubject {
  subject: string;
  obtained?: number | null;
  chapters?: JsonQueryChapter[];
  note?: string;
}
export interface JsonQueryTest {
  title: string;
  date: string;
  mode?: string;
  status?: string;
  marksObtained?: number | null;
  marksTotal?: number;
  scorePercent?: number | null;
  rank?: number | null;
  accuracyPercent?: number | null;
  correctCount?: number | null;
  topScore?: number | null;
  avgScore?: number | null;
  note?: string;
  subjects?: JsonQuerySubject[];
}
export interface JsonQueryPayload {
  tests: JsonQueryTest[];
}

/**
 * Stand-in chapter row for a subject whose obtained figure is known but whose
 * chapters were never visible in the source (collapsed accordions in the
 * video). Keeps every sum consistent: subject total = sum of its rows.
 */
export const WHOLE_SUBJECT_CHAPTER = '(whole subject)';

export const parseJsonQuery = (text: string): JsonQueryPayload => {
  const raw = JSON.parse(text) as {tests?: unknown} | JsonQueryTest[];
  const tests = Array.isArray(raw) ? raw : (raw as {tests?: unknown}).tests;
  if (!Array.isArray(tests)) throw new Error('JSON me "tests" array honi chahiye.');
  for (const t of tests as JsonQueryTest[]) {
    if (!t || typeof t.title !== 'string' || !t.title.trim()) throw new Error('Har test ka title zaroori hai.');
    if (typeof t.date !== 'string' || !t.date.trim()) throw new Error(`"${t.title}" ki date zaroori hai.`);
  }
  return {tests: tests as JsonQueryTest[]};
};

/** Syllabus rows from the query: one per chapter, plus whole-subject stand-ins. */
export const syllabusFromQuery = (t: JsonQueryTest): SyllabusTopic[] =>
  (t.subjects ?? []).flatMap<SyllabusTopic>((s) => {
    const chapters = (s.chapters ?? []).filter((c) => c.chapter.trim());
    if (chapters.length > 0) return chapters.map((c) => ({subject: s.subject, topic: c.chapter}));
    if (typeof s.obtained === 'number') return [{subject: s.subject, topic: WHOLE_SUBJECT_CHAPTER}];
    return [];
  });

const statusOf = (t: JsonQueryTest): BatchTest['status'] =>
  (t.status ?? '').toUpperCase() === 'UPCOMING' || (t.status ?? '').toUpperCase() === 'SCHEDULED'
    ? 'scheduled'
    : 'completed';

/** Upsert shape: same id when the title already exists in the batch. */
export const buildTestFromQuery = (
  existing: BatchTest | undefined,
  t: JsonQueryTest,
  newId: string,
): BatchTest => ({
  id: existing?.id ?? newId,
  batchId: existing?.batchId ?? '',
  title: t.title.trim(),
  date: t.date.trim(),
  mode: (t.mode ?? '').toLowerCase() === 'online' ? 'Online' : 'Offline',
  paperType: existing?.paperType ?? 'Objective',
  marksTotal: t.marksTotal ?? existing?.marksTotal ?? 720,
  status: statusOf(t),
  syllabus: syllabusFromQuery(t),
  createdAt: existing?.createdAt,
});

export const findByTitle = (tests: BatchTest[], title: string): BatchTest | undefined => {
  const key = title.trim().toLowerCase();
  return tests.find((t) => t.title.trim().toLowerCase() === key);
};

/**
 * The student's result for one queried test. UPCOMING tests and tests with no
 * marks data produce nothing; MISSED produces a MISSED row without marks.
 */
export const buildResultFromQuery = (
  test: BatchTest,
  t: JsonQueryTest,
  student: StudentProfile,
): TestResult | null => {
  const status = (t.status ?? '').toUpperCase();
  const base = {id: student.id, studentId: student.id, studentName: student.name};
  if (status === 'UPCOMING' || status === 'SCHEDULED') return null;
  if (status === 'MISSED') return {...base, status: 'MISSED'};

  const topicMarks: Record<string, number> = {};
  for (const s of t.subjects ?? []) {
    const chapters = (s.chapters ?? []).filter((c) => c.chapter.trim());
    if (chapters.length > 0) {
      for (const c of chapters) topicMarks[`${s.subject}||${c.chapter}`] = c.marks;
    } else if (typeof s.obtained === 'number') {
      topicMarks[`${s.subject}||${WHOLE_SUBJECT_CHAPTER}`] = s.obtained;
    }
  }
  const hasMarks = typeof t.marksObtained === 'number' || Object.keys(topicMarks).length > 0;
  if (!hasMarks) return null;

  const chapterSum = Object.values(topicMarks).reduce((a, b) => a + b, 0);
  return {
    ...base,
    status: 'ATTEMPTED',
    marksObtained: typeof t.marksObtained === 'number' ? t.marksObtained : chapterSum,
    accuracyPercent: t.accuracyPercent ?? undefined,
    correctCount: t.correctCount ?? undefined,
    rank: t.rank ?? undefined,
    topScore: t.topScore ?? undefined,
    avgScore: t.avgScore ?? undefined,
    topicMarks: Object.keys(topicMarks).length > 0 ? topicMarks : undefined,
  };
};
