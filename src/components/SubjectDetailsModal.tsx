import React from 'react';
import { X, BookOpen, FileCheck2, Award, Clock } from 'lucide-react';

/** One subject's progress row. Shape matches the built-in list below. */
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
  /**
   * Real subject progress. When omitted the built-in zeros render, so existing
   * call sites are unaffected.
   */
  subjects?: SubjectProgress[];
}

export const SubjectDetailsModal: React.FC<SubjectDetailsModalProps> = ({
  isOpen,
  onClose,
  area,
  batchName,
  subjects,
}) => {
  if (!isOpen) return null;

  const fallbackSubjects: SubjectProgress[] = [
    {
      name: 'Physics',
      teacher: 'Rajwant Sir',
      lecturesCompleted: 0,
      totalLectures: 42,
      dppsDone: 0,
      totalDpps: 28,
      accuracy: '0.0%',
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
    },
    {
      name: 'Chemistry',
      teacher: 'Pankaj Sir',
      lecturesCompleted: 0,
      totalLectures: 38,
      dppsDone: 0,
      totalDpps: 26,
      accuracy: '0.0%',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      name: 'Botany',
      teacher: 'Harshit Sir',
      lecturesCompleted: 0,
      totalLectures: 30,
      dppsDone: 0,
      totalDpps: 20,
      accuracy: '0.0%',
      color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400',
    },
    {
      name: 'Zoology',
      teacher: 'Samapti Mam',
      lecturesCompleted: 0,
      totalLectures: 28,
      dppsDone: 0,
      totalDpps: 14,
      accuracy: '0.0%',
      color: 'from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-400',
    },
  ];

  const subjectRows = subjects ?? fallbackSubjects;

  const titleMap = {
    lectures: 'Lectures Subject Details',
    dpp: 'Daily Practice Paper Subject Details',
    tests: 'Test Subject Details',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[430px] mx-auto bg-[#0d0e17] rounded-t-3xl border-t border-[#E4E6EB] p-5 pt-3 pb-8 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Top Handle */}
        <div className="w-12 h-1 bg-neutral-600 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#17181C] tracking-tight">
              {titleMap[area]}
            </h2>
            <p className="text-xs text-neutral-600">{batchName}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-100 text-neutral-700 hover:text-neutral-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subject Cards */}
        <div className="space-y-3 overflow-y-auto pr-1">
          {subjectRows.map((subj) => (
            <div
              key={subj.name}
              className={`p-3.5 rounded-xl bg-[#141523] border ${subj.color.split(' ')[2]} space-y-2.5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#17181C]">{subj.name}</h3>
                  <span className="text-[11px] text-neutral-600">
                    Faculty: {subj.teacher}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                  {area === 'lectures' && `${subj.lecturesCompleted}/${subj.totalLectures} Lrc`}
                  {area === 'dpp' && `${subj.dppsDone}/${subj.totalDpps} DPPs`}
                  {area === 'tests' && `Accuracy ${subj.accuracy}`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5747D6]"
                  style={{
                    width:
                      area === 'lectures'
                        ? `${(subj.lecturesCompleted / subj.totalLectures) * 100}%`
                        : `${(subj.dppsDone / subj.totalDpps) * 100}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-600 pt-0.5">
                <span className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>Watch: 0h 0m</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FileCheck2 size={12} />
                  <span>Accuracy: {subj.accuracy}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
