/**
 * NEET paper structure, as the administrator enters it.
 *
 * A NEET paper is four sections of 180 marks each (720 total): Physics,
 * Chemistry and Biology — where Biology is examined as two separate sections,
 * Botany and Zoology. So the syllabus of a test is built from these four
 * subjects, each topic sitting under one of them, and every subject carries a
 * fixed 180 marks. That is why the admin never types a weightage percentage
 * any more: the obtained marks per topic are entered per student, and a
 * subject's obtained figure is simply the sum of its topics.
 */
export const NEET_SUBJECTS = ['Physics', 'Chemistry', 'Botany', 'Zoology'];

/** Marks carried by each NEET section. Fixed by the exam, not by us. */
export const NEET_SUBJECT_MARKS = 180;

/**
 * Subject types a batch can be created as. Only NEET exists today; more
 * (JEE, boards…) arrive later as options here — the batch stores whichever
 * string was chosen, so old batches keep reading fine.
 */
export const BATCH_SUBJECT_TYPES = ['NEET'];

/** A batch's subject type, defaulting to NEET for batches created before it. */
export const subjectTypeOf = (batch: {subjectType?: string} | null | undefined): string =>
  batch?.subjectType || 'NEET';

/**
 * Options for the syllabus subject picker: the batch type's subject list,
 * plus any legacy free-text subject already stored on the test so editing an
 * old test never silently drops its data.
 */
export const subjectOptions = (subjectType: string, current: string): string[] => {
  // Only NEET exists today; future subject types plug their list in here.
  const base = subjectType === 'NEET' || !subjectType ? [...NEET_SUBJECTS] : [...NEET_SUBJECTS];
  const trimmed = (current || '').trim();
  if (trimmed && !base.includes(trimmed)) base.push(trimmed);
  return base;
};
