import React from 'react';
import { AppHeader } from './AppHeader';
import { StudentAvatar } from './StudentAvatar';
import { StudentProfile } from '../types';
import { User } from 'lucide-react';

interface LinkedAccountsScreenProps {
  students: StudentProfile[];
  onSelectStudent: (student: StudentProfile) => void;
  onOpenProfile?: () => void;
  customLogoUrl?: string | null;
  onOpenLogoCustomizer: () => void;
}

export const LinkedAccountsScreen: React.FC<LinkedAccountsScreenProps> = ({
  students,
  onSelectStudent,
  onOpenProfile,
  customLogoUrl,
  onOpenLogoCustomizer,
}) => {
  return (
    <div className="relative w-full h-full min-h-full bg-[#0a0b10] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Header with PW Logo */}
      <div className="w-full flex items-center justify-between pr-4 bg-[#0a0b10]">
        <div className="flex-1">
          <AppHeader
            customLogoUrl={customLogoUrl}
            onLogoClick={onOpenLogoCustomizer}
          />
        </div>
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="p-2 rounded-full bg-[#161826] hover:bg-[#202235] border border-[#25283b] text-neutral-300 hover:text-white transition-colors"
            title="Profile"
          >
            <User size={18} className="text-[#8E75FF]" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-5 pt-7 pb-10 flex flex-col overflow-y-auto">
        {/* Title */}
        <h1 className="text-[27px] sm:text-[29px] font-bold text-white tracking-tight leading-snug">
          {students.length > 0
            ? 'Student account already linked to this number!'
            : 'No student is linked to this number yet'}
        </h1>

        {/* Subtitle — honest about who adds a child. Parents cannot self-add:
            a child is created by the centre's admin, who also picks the batch,
            so the record starts from real data instead of placeholder marks. */}
        <p className="mt-3 text-[#9ca3af] text-[14.5px] leading-relaxed">
          {students.length > 0
            ? 'Choose a student to continue. Children are added by your centre’s administrator.'
            : 'Your centre’s administrator adds students and allots them to a batch. Once that is done, the child appears here — nothing to fill in on this device.'}
        </p>

        {/* 2-Column Grid of Linked Profiles & Add Child */}
        <div className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-[#11121c] border border-[#1e202e] hover:border-[#2f334a] rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-200 shadow-sm"
            >
              {/* Student Avatar */}
              <div className="mt-1">
                <StudentAvatar type="boy" size={68} />
              </div>

              {/* Student Name */}
              <h2 className="mt-3.5 text-white font-bold text-[15px] tracking-tight truncate w-full">
                {student.name}
              </h2>

              {/* Batch / Exam Tag */}
              <span className="mt-0.5 text-neutral-400 text-[12px] font-medium tracking-normal">
                {student.batch}
              </span>

              {/* Continue Button */}
              <button
                type="button"
                onClick={() => onSelectStudent(student)}
                className="mt-4 w-full py-2 px-4 rounded-lg bg-[#D4C7FF] hover:bg-[#c8b7ff] active:bg-[#b8a2fd] text-[#111218] font-bold text-[13px] tracking-tight transition-all active:scale-[0.98] shadow-sm"
              >
                Continue
              </button>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};
