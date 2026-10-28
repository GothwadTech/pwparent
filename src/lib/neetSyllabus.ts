/**
 * The NEET syllabus, chapter-wise per section, exactly as the administrator
 * picks it while building a test.
 *
 * The four sections are fixed (Physics, Chemistry, Botany, Zoology — 180 marks
 * each), so the admin never types a subject: they only add as many chapters as
 * the paper covers, chosen from these lists (or typed as a custom chapter).
 * Lists follow the NCERT Class 11 + 12 chapters the NEET paper is set from.
 */
export const NEET_CHAPTERS: Record<string, string[]> = {
  Physics: [
    'Units and Measurements',
    'Motion in a Straight Line',
    'Motion in a Plane',
    'Laws of Motion',
    'Work, Energy and Power',
    'System of Particles and Rotational Motion',
    'Gravitation',
    'Mechanical Properties of Solids',
    'Mechanical Properties of Fluids',
    'Thermal Properties of Matter',
    'Thermodynamics',
    'Kinetic Theory',
    'Oscillations',
    'Waves',
    'Electric Charges and Fields',
    'Electrostatic Potential and Capacitance',
    'Current Electricity',
    'Moving Charges and Magnetism',
    'Magnetism and Matter',
    'Electromagnetic Induction',
    'Alternating Current',
    'Electromagnetic Waves',
    'Ray Optics and Optical Instruments',
    'Wave Optics',
    'Dual Nature of Radiation and Matter',
    'Atoms',
    'Nuclei',
    'Semiconductor Electronics',
  ],
  Chemistry: [
    'Some Basic Concepts of Chemistry',
    'Structure of Atom',
    'Classification of Elements and Periodicity in Properties',
    'Chemical Bonding and Molecular Structure',
    'States of Matter',
    'Thermodynamics',
    'Equilibrium',
    'Redox Reactions',
    'Organic Chemistry: Some Basic Principles and Techniques',
    'Hydrocarbons',
    'Solutions',
    'Electrochemistry',
    'Chemical Kinetics',
    'The d- and f-Block Elements',
    'Coordination Compounds',
    'Haloalkanes and Haloarenes',
    'Alcohols, Phenols and Ethers',
    'Aldehydes, Ketones and Carboxylic Acids',
    'Amines',
    'Biomolecules',
  ],
  Botany: [
    'The Living World',
    'Biological Classification',
    'Plant Kingdom',
    'Morphology of Flowering Plants',
    'Anatomy of Flowering Plants',
    'Cell: The Unit of Life',
    'Cell Cycle and Cell Division',
    'Photosynthesis in Higher Plants',
    'Respiration in Plants',
    'Plant Growth and Development',
    'Sexual Reproduction in Flowering Plants',
    'Principles of Inheritance and Variation',
    'Molecular Basis of Inheritance',
    'Microbes in Human Welfare',
    'Biotechnology: Principles and Processes',
    'Biotechnology and its Applications',
    'Organisms and Populations',
    'Ecosystem',
    'Biodiversity and Conservation',
  ],
  Zoology: [
    'Animal Kingdom',
    'Structural Organisation in Animals',
    'Biomolecules',
    'Breathing and Exchange of Gases',
    'Body Fluids and Circulation',
    'Excretory Products and their Elimination',
    'Locomotion and Movement',
    'Neural Control and Coordination',
    'Chemical Coordination and Integration',
    'Reproduction in Organisms',
    'Human Reproduction',
    'Reproductive Health',
    'Evolution',
    'Human Health and Disease',
    'Strategies for Enhancement in Food Production',
  ],
};

/**
 * Which class a batch teaches. Only Class 12th exists today; more classes plug
 * in here later, exactly like BATCH_SUBJECT_TYPES.
 */
export const BATCH_CLASSES = ['Class 12th'];

/** A batch's class, defaulting for batches created before the field existed. */
export const classLevelOf = (batch: {classLevel?: string} | null | undefined): string =>
  batch?.classLevel || 'Class 12th';

/** Chapter options for one subject: the NEET list, plus any custom chapters already saved. */
export const chapterOptions = (subject: string, chosen: string[]): string[] => {
  const base = NEET_CHAPTERS[subject] ?? [];
  const extra = chosen.filter((c) => c.trim() && !base.includes(c));
  return [...base, ...extra];
};
