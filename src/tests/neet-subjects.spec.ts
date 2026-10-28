import {describe, expect, it} from 'vitest';
import {
  BATCH_CLASSES,
  chapterOptions,
  classLevelOf,
  NEET_CHAPTERS,
} from '../lib/neetSyllabus';
import {
  BATCH_SUBJECT_TYPES,
  NEET_SUBJECT_MARKS,
  NEET_SUBJECTS,
  subjectOptions,
  subjectTypeOf,
} from '../lib/neetSubjects';

/**
 * A NEET batch's syllabus is built from four fixed sections of 180 marks each,
 * so the admin picks subjects instead of typing them, and never types a
 * weightage percentage. Batches created before `subjectType` existed read as
 * NEET, and legacy free-text subjects stay editable instead of being dropped.
 */
describe('NEET subject model', () => {
  it('four sections, 180 marks each', () => {
    expect(NEET_SUBJECTS).toEqual(['Physics', 'Chemistry', 'Botany', 'Zoology']);
    expect(NEET_SUBJECT_MARKS).toBe(180);
    expect(NEET_SUBJECTS.length * NEET_SUBJECT_MARKS).toBe(720);
  });

  it('only NEET is offered as a batch subject type today', () => {
    expect(BATCH_SUBJECT_TYPES).toEqual(['NEET']);
  });

  it('batches without a stored subject type read as NEET', () => {
    expect(subjectTypeOf(undefined)).toBe('NEET');
    expect(subjectTypeOf({})).toBe('NEET');
    expect(subjectTypeOf({subjectType: 'NEET'})).toBe('NEET');
  });

  it('offers the four sections, keeping any legacy subject editable', () => {
    expect(subjectOptions('NEET', '')).toEqual(NEET_SUBJECTS);
    expect(subjectOptions('NEET', 'Physics')).toEqual(NEET_SUBJECTS);
    expect(subjectOptions('NEET', 'Maths')).toEqual([...NEET_SUBJECTS, 'Maths']);
  });
});

describe('NEET chapter syllabus + class', () => {
  it('every section ships a real chapter list the admin picks from', () => {
    for (const subject of NEET_SUBJECTS) {
      const chapters = NEET_CHAPTERS[subject];
      expect(chapters.length, subject).toBeGreaterThanOrEqual(10);
      expect(new Set(chapters).size, `${subject} duplicates`).toBe(chapters.length);
    }
    expect(NEET_CHAPTERS.Physics).toContain('Electric Charges and Fields');
  });

  it('custom chapters already saved stay pickable', () => {
    expect(chapterOptions('Physics', ['My Own Chapter'])).toContain('My Own Chapter');
    const opts = chapterOptions('Physics', ['Current Electricity']);
    expect(opts.filter((c) => c === 'Current Electricity')).toHaveLength(1);
  });

  it('class defaults to Class 12th for older batches', () => {
    expect(BATCH_CLASSES).toEqual(['Class 12th']);
    expect(classLevelOf(undefined)).toBe('Class 12th');
    expect(classLevelOf({classLevel: 'Class 12th'})).toBe('Class 12th');
  });
});
