import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { StudentProfile } from '../types';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newStudent: StudentProfile) => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [batch, setBatch] = useState('JEE Main & Advanced 2026');
  const [course, setCourse] = useState('Lakshya JEE');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const student: StudentProfile = {
      id: Date.now().toString(),
      name: name.trim(),
      batch: batch,
      course: course,
      attendance: '92%',
      testsCompleted: 14,
      dppsDone: 48,
      videoWatchRate: '88%',
    };

    onAdd(student);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#12131d] border border-[#2b2e40] rounded-2xl max-w-sm w-full p-5 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#202230]">
          <div className="flex items-center space-x-2">
            <UserPlus size={18} className="text-[#8E75FF]" />
            <h3 className="font-bold text-lg text-white">Add Child Profile</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Child's Full Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aryan Sharma"
              className="w-full bg-[#0d0e15] border border-[#2f3246] focus:border-[#8E75FF] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Exam / Goal
            </label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full bg-[#0d0e15] border border-[#2f3246] focus:border-[#8E75FF] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            >
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="Career Pass">Career Pass</option>
              <option value="Foundation (Class 10)">Foundation (Class 10)</option>
              <option value="UPSC">UPSC</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              PW Batch Enrolled
            </label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Yakeen NEET 2026"
              className="w-full bg-[#0d0e15] border border-[#2f3246] focus:border-[#8E75FF] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-[#2a2c3d] text-neutral-300 font-medium text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 rounded-xl bg-[#D4C7FF] text-[#111218] font-bold text-sm hover:bg-[#c6b6fc] transition-colors"
            >
              Link Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
