import React from 'react';
import { ChevronRight, LogOut, Check, ChevronLeft } from 'lucide-react';
import { StudentProfile } from '../types';
import { StudentAvatar } from './StudentAvatar';

interface ProfileScreenProps {
  students: StudentProfile[];
  activeStudent: StudentProfile;
  onSelectStudent: (student: StudentProfile) => void;
  onBack: () => void;
  onOpenPurchases: () => void;
  onOpenParentProfile: () => void;
  onOpenTerms: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  students,
  activeStudent,
  onSelectStudent,
  onBack,
  onOpenPurchases,
  onOpenParentProfile,
  onOpenTerms,
  onLogout,
}) => {
  return (
    <div className="relative w-full h-full min-h-full bg-[#FFFFFF] text-[#17181C] flex flex-col justify-between overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top App Bar matching Screenshot_20260918_180819.jpg */}
      <div className="w-full px-4 pt-4 pb-3 flex items-center bg-[#FFFFFF] border-b border-[#E4E6EB]/40 z-20">
        <button
          type="button"
          onClick={onBack}
          className="p-1 -ml-1 text-[#17181C] hover:text-neutral-700 transition-colors flex items-center justify-center"
          aria-label="Back"
        >
          <ChevronLeft size={26} strokeWidth={2.2} />
        </button>
        <h1 className="ml-2 text-lg font-bold text-[#17181C] tracking-tight">
          Profile
        </h1>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Student Profile Section with subtle purple gradient */}
        <div className="px-5 pt-5 pb-6 bg-gradient-to-b from-[#EDEFF5]/80 to-[#FFFFFF] border-b border-[#E4E6EB]">
          <h2 className="text-[14px] font-semibold text-neutral-800 mb-4">
            {students.length === 1 ? 'Student' : 'Student Profile'}
          </h2>

          {/* Horizontal Avatars List */}
          <div className="flex items-center space-x-6 overflow-x-auto py-1">
            {/* One number logs in as one child, so this list has a single entry.
                The ring + checkmark are a SELECTION affordance — with nothing to
                choose between they only imply other children exist, which is the
                exact confusion this screen used to cause. */}
            {students.map((student) => {
              const onlyOne = students.length === 1;
              const isSelected = !onlyOne && student.id === activeStudent.id;
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => onSelectStudent(student)}
                  className="flex flex-col items-center group focus:outline-none"
                >
                  <div className="relative">
                    {/* Ring for active avatar */}
                    <div
                      className={`w-15 h-15 rounded-full p-0.5 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#7C63FF] bg-white'
                          : 'bg-white'
                      }`}
                    >
                      <StudentAvatar type="boy" size={54} />
                    </div>

                    {/* Active checkmark badge */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#7C63FF] text-white flex items-center justify-center border-2 border-[#E4E6EB] shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <span
                    className={`mt-2 text-xs font-medium truncate max-w-[68px] ${
                      isSelected ? 'text-[#17181C]' : 'text-neutral-600'
                    }`}
                  >
                    {student.name}
                  </span>
                </button>
              );
            })}

          </div>
        </div>

        {/* Menu Items List */}
        <div className="divide-y divide-[#181a27] bg-[#FFFFFF]">
          {/* Ayush's Purchases */}
          <button
            type="button"
            onClick={onOpenPurchases}
            className="w-full px-5 py-4.5 flex items-center justify-between hover:bg-white transition-colors text-left"
          >
            <span className="text-[15px] font-semibold text-[#17181C]">
              {activeStudent.name}&apos;s Purchases
            </span>
            <ChevronRight size={19} className="text-neutral-500" />
          </button>

          {/* Parent Profile */}
          <button
            type="button"
            onClick={onOpenParentProfile}
            className="w-full px-5 py-4.5 flex items-center justify-between hover:bg-white transition-colors text-left"
          >
            <span className="text-[15px] font-semibold text-[#17181C]">
              Parent Profile
            </span>
            <ChevronRight size={19} className="text-neutral-500" />
          </button>

          {/* Terms and Conditions */}
          <button
            type="button"
            onClick={onOpenTerms}
            className="w-full px-5 py-4.5 flex items-center justify-between hover:bg-white transition-colors text-left"
          >
            <span className="text-[15px] font-semibold text-[#17181C]">
              Terms and Conditions
            </span>
            <ChevronRight size={19} className="text-neutral-500" />
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full px-5 py-4.5 flex items-center justify-between hover:bg-white transition-colors text-left"
          >
            <span className="text-[15px] font-semibold text-[#17181C]">
              Logout
            </span>
            <LogOut size={19} className="text-neutral-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
