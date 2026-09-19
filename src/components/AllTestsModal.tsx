import React from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface AllTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchName: string;
}

export const AllTestsModal: React.FC<AllTestsModalProps> = ({
  isOpen,
  onClose,
  batchName,
}) => {
  if (!isOpen) return null;

  const allTests = [
    { id: '17', name: 'MISSION 30 : Test 17', date: '19-6-2026', mode: 'Online', status: 'MISSED' },
    { id: '16', name: 'MISSION 30 : Test 16', date: '17-6-2026', mode: 'Online', status: 'MISSED' },
    { id: '15', name: 'MISSION 30 : Test 15', date: '15-6-2026', mode: 'Online', status: 'MISSED' },
    { id: '14', name: 'MISSION 30 : Test 14', date: '13-6-2026', mode: 'Online', status: 'MISSED' },
    { id: '13', name: 'MISSION 30 : Test 13', date: '10-6-2026', mode: 'Online', status: 'MISSED' },
    { id: '12', name: 'MISSION 30 : Test 12', date: '08-6-2026', mode: 'Online', status: 'MISSED' },
    { id: '11', name: 'MISSION 30 : Test 11', date: '05-6-2026', mode: 'Online', status: 'MISSED' },
    { id: '10', name: 'MISSION 30 : Test 10', date: '02-6-2026', mode: 'Online', status: 'MISSED' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[430px] mx-auto bg-[#0a0b12] rounded-t-3xl border-t border-neutral-800 p-5 pt-3 pb-8 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Drag handle */}
        <div className="w-12 h-1 bg-neutral-600 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              All Tests (17)
            </h2>
            <p className="text-xs text-neutral-400">{batchName}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800/80 text-neutral-300 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tests List */}
        <div className="space-y-2.5 overflow-y-auto pr-1">
          {allTests.map((test) => (
            <div
              key={test.id}
              className="bg-[#131420] border border-[#23253a] rounded-xl p-3 flex items-center justify-between hover:border-[#3a3d5a] transition-colors"
            >
              <div>
                <h4 className="text-xs font-bold text-white">{test.name}</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {test.date} &bull; {test.mode}
                </p>
              </div>

              <span className="px-2.5 py-0.5 rounded-md bg-[#38161D] border border-red-900/40 text-[#FF7A7A] text-[10px] font-bold tracking-wider">
                {test.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
