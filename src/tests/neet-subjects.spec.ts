import {describe, expect, it} from 'vitest';
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
