import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Settings,
  X,
  Trash2,
  Check,
  Edit3,
} from 'lucide-react';
import { ParentProfileData } from '../types';

interface ParentProfileScreenProps {
  initialData: ParentProfileData;
  onSave: (data: ParentProfileData) => void;
  onBack: () => void;
  onDeleteProfile: () => void;
}

export const ParentProfileScreen: React.FC<ParentProfileScreenProps> = ({
  initialData,
  onSave,
  onBack,
  onDeleteProfile,
}) => {
  const [formData, setFormData] = useState<ParentProfileData>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0d0e15] text-white flex flex-col justify-between overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar matching Screenshot_20260918_180825.jpg */}
      <div className="w-full px-4 pt-4 pb-3 flex items-center justify-between bg-[#0d0e15] border-b border-[#1c1d29]/40 z-20">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="p-1 -ml-1 text-white hover:text-neutral-300 transition-colors flex items-center justify-center"
            aria-label="Back"
          >
            <ChevronLeft size={26} strokeWidth={2.2} />
          </button>
          <h1 className="ml-2 text-lg font-bold text-white tracking-tight">
            Parent&apos;s Profile
          </h1>
        </div>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`p-2 rounded-lg transition-colors ${
            isEditing
              ? 'text-[#A088FF] bg-[#A088FF]/10'
              : 'text-neutral-300 hover:text-white'
          }`}
          title={isEditing ? 'Cancel edit' : 'Edit profile'}
        >
          <Edit3 size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Main Content Form */}
      <div className="flex-1 px-5 pt-6 pb-6 overflow-y-auto">
        {/* Success saved banner */}
        {showSavedToast && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <Check size={16} />
            <span>Profile changes saved successfully!</span>
          </div>
        )}

        {/* Form Fields Stack */}
        <div className="space-y-5">
          {/* Field 1: Name */}
          <div className="relative rounded-lg border border-[#3b3d4f] focus-within:border-[#8E75FF] bg-transparent px-3.5 pt-3 pb-2.5 transition-colors">
            <label className="absolute -top-2.5 left-3 bg-[#0d0e15] px-1 text-[11px] font-medium text-neutral-400">
              Name
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-transparent text-[15px] font-medium text-white placeholder-neutral-500 focus:outline-none disabled:text-neutral-200"
              placeholder="Enter parent name"
            />
          </div>

          {/* Field 2: Mobile number */}
          <div className="relative rounded-lg border border-[#3b3d4f] focus-within:border-[#8E75FF] bg-transparent px-3.5 pt-3 pb-2.5 transition-colors">
            <label className="absolute -top-2.5 left-3 bg-[#0d0e15] px-1 text-[11px] font-medium text-neutral-400">
              Mobile number
            </label>
            <div className="flex items-center space-x-3 text-[15px]">
              <div className="flex items-center space-x-1 text-white font-semibold pr-2 border-r border-[#262838]">
                <span>{formData.countryCode || 'IN +91'}</span>
                <ChevronDown size={14} className="text-neutral-400" />
              </div>
              <input
                type="tel"
                disabled={!isEditing}
                value={formData.mobileNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                  })
                }
                className="w-full bg-transparent text-[15px] font-medium text-white placeholder-neutral-500 focus:outline-none disabled:text-neutral-200"
                placeholder="Mobile number"
              />
            </div>
          </div>

          {/* Field 3: Email */}
          <div className="relative rounded-lg border border-[#3b3d4f] focus-within:border-[#8E75FF] bg-transparent px-3.5 pt-3 pb-2.5 transition-colors">
            <label className="absolute -top-2.5 left-3 bg-[#0d0e15] px-1 text-[11px] font-medium text-neutral-400">
              Email
            </label>
            <input
              type="email"
              disabled={!isEditing}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-transparent text-[15px] font-medium text-white placeholder-neutral-500 focus:outline-none disabled:text-neutral-200"
              placeholder="name@gmail.com"
            />
          </div>
        </div>

        {/* Profile Settings Option matching screenshot */}
        <div className="mt-7 pt-4 border-t border-[#1a1c2b]">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center space-x-3 text-neutral-300 hover:text-white py-2 transition-colors group"
          >
            <Settings
              size={20}
              className="text-neutral-400 group-hover:text-white transition-colors"
            />
            <span className="text-[15px] font-medium text-neutral-200 group-hover:text-white">
              Profile Settings
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Action Bar when Editing (Screenshot_20260918_180854.jpg) */}
      {isEditing && (
        <div className="p-4 bg-[#0d0e15] border-t border-[#1e2030] flex items-center space-x-3 z-20">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-3.5 rounded-xl bg-black border border-[#2b2d3d] text-white font-semibold text-sm hover:bg-[#161722] active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-xl bg-[#D4C7FF] text-[#12131f] font-bold text-sm hover:bg-[#c2b0ff] active:scale-[0.98] transition-all shadow-md"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Profile Settings Bottom Sheet Modal (Screenshot_20260918_180839.jpg) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Dimmed backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSettingsOpen(false)}
          />

          {/* Centered Close (X) circle button above sheet matching screenshot */}
          <div className="relative z-10 flex justify-center mb-4">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="w-11 h-11 rounded-full bg-black/90 border border-neutral-700 text-white flex items-center justify-center shadow-lg hover:bg-neutral-800 transition-colors"
              aria-label="Close"
            >
              <X size={20} strokeWidth={2.4} />
            </button>
          </div>

          {/* Bottom sheet content */}
          <div className="relative z-10 w-full max-w-[420px] mx-auto bg-[#0d0e15] rounded-t-3xl border-t border-neutral-800 p-5 pt-3 pb-8 shadow-2xl">
            {/* Top drag handle pill */}
            <div className="w-12 h-1 bg-neutral-600 rounded-full mx-auto mb-5" />

            {/* Delete Profile button card matching screenshot */}
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(false);
                onDeleteProfile();
              }}
              className="w-full py-3.5 px-4 rounded-xl border border-neutral-800 hover:border-red-900/60 bg-[#141520] flex items-center space-x-3 text-left transition-colors group"
            >
              <Trash2
                size={19}
                className="text-neutral-400 group-hover:text-red-400 transition-colors"
              />
              <span className="text-sm font-semibold text-neutral-200 group-hover:text-red-300">
                Delete Profile
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
