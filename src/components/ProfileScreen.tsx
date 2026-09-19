import React from 'react';
import { ChevronRight, LogOut, Plus, Check, ChevronLeft } from 'lucide-react';
import { StudentProfile } from '../types';
import { StudentAvatar } from './StudentAvatar';

interface ProfileScreenProps {
  students: StudentProfile[];
  activeStudent: StudentProfile;
  onSelectStudent: (student: StudentProfile) => void;
  onAddChild: () => void;
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
  onAddChild,
  onBack,
  onOpenPurchases,
  onOpenParentProfile,
  onOpenTerms,
  onLogout,
}) => {
  return (
    <div className="relative w-full h-full min-h-screen bg-[#0d0e15] text-white flex flex-col justify-between overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top App Bar matching Screenshot_20260918_180819.jpg */}
      <div className="w-full px-4 pt-4 pb-3 flex items-center bg-[#0d0e15] border-b border-[#1c1d29]/40 z-20">
        <button
          type="button"
          onClick={onBack}
          className="p-1 -ml-1 text-white hover:text-neutral-300 transition-colors flex items-center justify-center"
          aria-label="Back"
        >
          <ChevronLeft size={26} strokeWidth={2.2} />
        </button>
        <h1 className="ml-2 text-lg font-bold text-white tracking-tight">
          Profile
        </h1>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Student Profile Section with subtle purple gradient */}
        <div className="px-5 pt-5 pb-6 bg-gradient-to-b from-[#1c1a32]/80 to-[#10111a] border-b border-[#1e2030]">
          <h2 className="text-[14px] font-semibold text-neutral-200 mb-4">
            Student Profile
          </h2>

          {/* Horizontal Avatars List */}
          <div className="flex items-center space-x-6 overflow-x-auto py-1">
            {students.map((student) => {
              const isSelected = student.id === activeStudent.id;
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
                          ? 'ring-2 ring-[#7C63FF] bg-[#1a1b29]'
                          : 'bg-[#151622]'
                      }`}
                    >
                      <StudentAvatar type="boy" size={54} />
                    </div>

                    {/* Active checkmark badge */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#7C63FF] text-white flex items-center justify-center border-2 border-[#0d0e15] shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <span
                    className={`mt-2 text-xs font-medium truncate max-w-[68px] ${
                      isSelected ? 'text-white' : 'text-neutral-400'
                    }`}
                  >
                    {student.name}
                  </span>
                </button>
              );
            })}

            {/* Add Child Button */}
            <button
              type="button"
              onClick={onAddChild}
              className="flex flex-col items-center group focus:outline-none"
            >
              <div className="w-15 h-15 rounded-full border border-dashed border-[#34374c] bg-[#161724]/70 hover:bg-[#1f2133] hover:border-[#7C63FF]/60 flex items-center justify-center text-neutral-400 hover:text-white transition-all">
                <Plus size={22} strokeWidth={2} />
              </div>
              <span className="mt-2 text-xs font-medium text-neutral-400">
                Add
              </span>
            </button>
          </div>
        </div>

        {/* Menu Items List */}
        <div className="divide-y divide-[#181a27] bg-[#0d0e15]">
          {/* Ayush's Purchases */}
          <button
            type="button"
            onClick={onOpenPurchases}
            className="w-full px-5 py-4.5 flex items-center justify-between hover:bg-[#141522] transition-colors text-left"
          >
            <span className="text-[15px] font-semibold text-white">
              {activeStudent.name}&apos;s Purchases
            </span>
            <ChevronRight size={19} className="text-neutral-500" />
          </button>

          {/* Parent Profile */}
          <button
            type="button"
            onClick={onOpenParentProfile}
            className="w-full px-5 py-4.5 flex items-center justify-between hover:bg-[#141522] transition-colors text-left"
          >
            <span className="text-[15px] font-semibold text-white">
              Parent Profile
            </span>
            <ChevronRight size={19} className="text-neutral-500" />
          </button>

          {/* Terms and Conditions */}
          <button
            type="button"
            onClick={onOpenTerms}
            className="w-full px-5 py-4.5 flex items-center justify-between hover:bg-[#141522] transition-colors text-left"
          >
            <span className="text-[15px] font-semibold text-white">
              Terms and Conditions
            </span>
            <ChevronRight size={19} className="text-neutral-500" />
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full px-5 py-4.5 flex items-center justify-between hover:bg-[#141522] transition-colors text-left"
          >
            <span className="text-[15px] font-semibold text-white">
              Logout
            </span>
            <LogOut size={19} className="text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
