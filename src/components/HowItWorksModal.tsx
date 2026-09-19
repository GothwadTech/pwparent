import React from 'react';
import { X, Smartphone, ShieldCheck, UserCheck, BarChart3 } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#12131d] border border-[#2b2e40] rounded-2xl max-w-sm w-full p-5 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#202230]">
          <h3 className="font-bold text-lg text-white">How PW Parent's App Works</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-neutral-300">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#8E75FF]/15 text-[#8E75FF] flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone size={17} />
            </div>
            <div>
              <p className="font-semibold text-white">1. Enter Registered Mobile</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Use the mobile number registered as the Parent/Guardian number in Physics Wallah app.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#8E75FF]/15 text-[#8E75FF] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={17} />
            </div>
            <div>
              <p className="font-semibold text-white">2. Secure OTP Verification</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                A 4-digit verification code will be sent to confirm your identity.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#8E75FF]/15 text-[#8E75FF] flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck size={17} />
            </div>
            <div>
              <p className="font-semibold text-white">3. Access Linked Students</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                All children enrolled in PW Batches (e.g., NEET, JEE, Career Pass) automatically appear.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#8E75FF]/15 text-[#8E75FF] flex items-center justify-center shrink-0 mt-0.5">
              <BarChart3 size={17} />
            </div>
            <div>
              <p className="font-semibold text-white">4. Track Live Progress</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Check daily lecture watch time, DPP submission percentage, test series ranks, and subject analytics.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-[#D4C7FF] text-[#111218] font-bold text-sm tracking-tight hover:bg-[#c4b3fb] transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
