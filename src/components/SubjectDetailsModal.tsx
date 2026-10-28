import React from 'react';
import { SubjectDetailsScreen } from './SubjectDetailsScreen';

/** One subject's progress row. Kept for type compatibility. */
export interface SubjectProgress {
  name: string;
  teacher: string;
  lecturesCompleted: number;
  totalLectures: number;
  dppsDone: number;
  totalDpps: number;
  accuracy: string;
  color: string;
}

interface SubjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: 'lectures' | 'dpp' | 'tests';
  batchName: string;
  subjects?: SubjectProgress[];
}

/**
 * SubjectDetailsModal now presents the pixel-perfect empty state matching the reference screenshot:
 * Header: Test Details, with the rounded card and "Sorry!, Subject wise data is not available yet."
 */
export const SubjectDetailsModal: React.FC<SubjectDetailsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-white font-['Plus_Jakarta_Sans',sans-serif]">
      <SubjectDetailsScreen title="Test Details" onBack={onClose} />
    </div>
  );
};

export { SubjectDetailsScreen } from './SubjectDetailsScreen';
