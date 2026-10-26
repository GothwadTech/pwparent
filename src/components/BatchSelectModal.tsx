import React from 'react';
import { X, Check } from 'lucide-react';
import { BatchOption } from '../types';

interface BatchSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: BatchOption[];
  selectedBatchId: string;
  onSelectBatch: (batch: BatchOption) => void;
}

export const BatchSelectModal: React.FC<BatchSelectModalProps> = ({
  isOpen,
  onClose,
  options,
  selectedBatchId,
  onSelectBatch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Floating close circle button above modal matching Screenshot_20260918_181001.jpg */}
      <div className="relative z-10 flex justify-center mb-3">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/90 border border-[#E4E6EB] text-[#17181C] flex items-center justify-center shadow-xl hover:bg-neutral-100 transition-colors"
          aria-label="Close"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom Sheet Modal matching screenshot */}
      <div className="relative z-10 w-full max-w-[430px] mx-auto bg-[#F4F5F7] rounded-t-3xl border-t border-[#E4E6EB] p-5 pt-3 pb-8 shadow-2xl">
        {/* Top drag handle indicator */}
        <div className="w-12 h-1 bg-neutral-600 rounded-full mx-auto mb-4" />

        <h2 className="text-base font-bold text-[#17181C] text-center mb-4 tracking-tight">
          Select an Option
        </h2>

        <div className="text-xs font-semibold text-neutral-600 mb-3 px-1">
          Batches
        </div>

        {/* Batches Radio List */}
        <div className="space-y-2.5">
          {options.map((option) => {
            const isSelected = option.id === selectedBatchId;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onSelectBatch(option);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl flex items-center justify-between transition-all text-left ${
                  isSelected
                    ? 'bg-[#F1F2F4] border border-[#7C63FF]/50 text-[#17181C]'
                    : 'bg-[#FFFFFF] border border-[#E4E6EB] hover:border-[#E4E6EB] text-neutral-800'
                }`}
              >
                <span className="text-sm font-semibold tracking-tight">
                  {option.name}
                </span>

                {/* Radio button circle */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                    isSelected
                      ? 'border-[#9D85FF] bg-[#9D85FF]'
                      : 'border-neutral-500 bg-transparent'
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[#FFFFFF]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
