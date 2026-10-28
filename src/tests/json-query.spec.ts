import {describe, expect, it} from 'vitest';
import type {BatchTest, StudentProfile} from '../types';
import {
  buildResultFromQuery,
  buildTestFromQuery,
  findByTitle,
  parseJsonQuery,
  syllabusFromQuery,
  WHOLE_SUBJECT_CHAPTER,
} from '../lib/jsonQuery';

const student: StudentProfile = {
  id: 'st1',
  name: 'Pawan Kumar',
  batch: 'VP16',
  course: 'NEET',
  attendance: '95%',
  testsCompleted: 12,
  dppsDone: 40,
  videoWatchRate: '90%',
};

const milestone8 = {
  title: 'Milestone:8',
  date: '2026-10-25',
  mode: 'Offline',
  status: 'ATTEMPTED',
  marksObtained: 156,
  marksTotal: 720,
  rank: 2720,
  accuracyPercent: 96.65,
  correctCount: 49,
  topScore: 686,
  avgScore: 318.09,
  subjects: [
    {subject: 'Physics', obtained: 12, chapters: [{chapter: 'Nuclei', marks: 7}, {chapter: 'Wave Optics', marks: -2}]},
    {subject: 'Botany', obtained: 47, note: 'chapters not opened in video'},
  ],
};

describe('parseJsonQuery', () => {
  it('accepts the video-extract shape (top-level tests array)', () => {
    const payload = parseJsonQuery(JSON.stringify({tests: [milestone8]}));
    expect(payload.tests).toHaveLength(1);
  });

  it('rejects garbage and title-less tests', () => {
    expect(() => parseJsonQuery('{nope')).toThrow();
    expect(() => parseJsonQuery(JSON.stringify({tests: [{date: '2026-01-01'}]}))).toThrow();
    expect(() => parseJsonQuery(JSON.stringify({tests: 'x'}))).toThrow();
  });
});

describe('buildTestFromQuery', () => {
  it('maps statuses, mode and the 720-mark paper', () => {
    const test = buildTestFromQuery(undefined, milestone8, 'new-id');
    expect(test).toMatchObject({id: 'new-id', title: 'Milestone:8', date: '2026-10-25', mode: 'Offline'});
    expect(test.status).toBe('completed');
    expect(test.marksTotal).toBe(720);
    expect(buildTestFromQuery(undefined, {...milestone8, status: 'UPCOMING'}, 'x').status).toBe('scheduled');
    expect(buildTestFromQuery(undefined, {...milestone8, mode: 'Online'}, 'x').mode).toBe('Online');
  });

  it('syllabus carries chapters, and a whole-subject stand-in when chapters are unknown', () => {
    const syllabus = syllabusFromQuery(milestone8);
    expect(syllabus).toEqual([
      {subject: 'Physics', topic: 'Nuclei'},
      {subject: 'Physics', topic: 'Wave Optics'},
      {subject: 'Botany', topic: WHOLE_SUBJECT_CHAPTER},
    ]);
  });

  it('updates in place: same title keeps the existing id', () => {
    const existing: BatchTest = {
      id: 'old-id',
      batchId: 'b1',
      title: 'milestone:8',
      date: '2026-01-01',
      mode: 'Offline',
      marksTotal: 300,
      status: 'completed',
      syllabus: [],
    };
    expect(findByTitle([existing], 'Milestone:8')?.id).toBe('old-id');
    const updated = buildTestFromQuery(existing, milestone8, 'new-id');
    expect(updated.id).toBe('old-id');
    expect(updated.date).toBe('2026-10-25');
    expect(updated.marksTotal).toBe(720);
  });
});

describe('buildResultFromQuery', () => {
  it('writes marks, class figures and chapter marks including negatives', () => {
    const test = buildTestFromQuery(undefined, milestone8, 't8');
    const result = buildResultFromQuery(test, milestone8, student);
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      studentId: 'st1',
      status: 'ATTEMPTED',
      marksObtained: 156,
      rank: 2720,
      accuracyPercent: 96.65,
      correctCount: 49,
      topScore: 686,
      avgScore: 318.09,
    });
    expect(result?.topicMarks).toEqual({
      'Physics||Nuclei': 7,
      'Physics||Wave Optics': -2,
      [`Botany||${WHOLE_SUBJECT_CHAPTER}`]: 47,
    });
  });

  it('MISSED writes a missed row, UPCOMING writes nothing', () => {
    const test = buildTestFromQuery(undefined, milestone8, 't8');
    expect(buildResultFromQuery(test, {...milestone8, status: 'MISSED'}, student)).toMatchObject({status: 'MISSED'});
    expect(buildResultFromQuery(test, {...milestone8, status: 'UPCOMING'}, student)).toBeNull();
  });

  it('a subject total counts itself when only chapter marks are given', () => {
    const queried = {
      title: 'T',
      date: '2026-01-01',
      status: 'ATTEMPTED',
      subjects: [{subject: 'Physics', chapters: [{chapter: 'A', marks: 40}, {chapter: 'B', marks: 20}]}],
    };
    const test = buildTestFromQuery(undefined, queried, 't');
    expect(buildResultFromQuery(test, queried, student)?.marksObtained).toBe(60);
  });
});
