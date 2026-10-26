import React, { useState } from 'react';
import { X, Upload, RotateCcw, Image, Check } from 'lucide-react';
import { PWLogo } from './PWLogo';

interface LogoCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string | null;
  onSaveLogo: (url: string | null) => void;
}

export const LogoCustomizerModal: React.FC<LogoCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  onSaveLogo,
}) => {
  const [urlInput, setUrlInput] = useState(currentLogoUrl || '');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUrlInput(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    onSaveLogo(urlInput.trim() ? urlInput.trim() : null);
    onClose();
  };

  const handleReset = () => {
    setUrlInput('');
    onSaveLogo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#2b2e40] rounded-2xl max-w-sm w-full p-5 text-[#17181C] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#202230]">
          <div className="flex items-center space-x-2">
            <Image size={18} className="text-[#5747D6]" />
            <h3 className="font-bold text-base text-[#17181C]">Custom App Logo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.05] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 text-xs text-neutral-700 leading-relaxed">
          Upload your custom logo anytime. It will instantly appear on the app header and navigation bars.
        </p>

        {/* Live Preview */}
        <div className="mt-4 p-4 rounded-xl bg-[#F4F5F7] border border-[#E4E6EB] flex flex-col items-center justify-center">
          <span className="text-[11px] text-neutral-500 mb-2 font-medium">PREVIEW ON SPLASH BG</span>
          <div className="w-18 h-18 rounded-full bg-[#005677] flex items-center justify-center p-2 shadow-inner">
            <PWLogo size={52} customLogoUrl={urlInput || '/assets/ic_launcher_round.webp'} />
          </div>
        </div>

        {/* Quick select provided icons */}
        <div className="mt-3">
          <span className="text-[11px] text-neutral-600 font-medium block mb-1.5">Select App Icon:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUrlInput('/assets/ic_launcher_round.webp')}
              className={`p-2 rounded-xl border flex items-center space-x-2 text-left transition-colors ${
                urlInput === '/assets/ic_launcher_round.webp' || !urlInput
                  ? 'border-[#5747D6] bg-[#5747D6]/10 text-white'
                  : 'border-[#E4E6EB] bg-white text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <img src="/assets/ic_launcher_round.webp" alt="Round" className="w-7 h-7 rounded-full object-contain" />
              <div className="text-[11px] font-medium leading-tight">
                <div>Round Icon</div>
                <div className="text-[9px] text-neutral-500">Official PW</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setUrlInput('/assets/ic_launcher.webp')}
              className={`p-2 rounded-xl border flex items-center space-x-2 text-left transition-colors ${
                urlInput === '/assets/ic_launcher.webp'
                  ? 'border-[#5747D6] bg-[#5747D6]/10 text-white'
                  : 'border-[#E4E6EB] bg-white text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <img src="/assets/ic_launcher.webp" alt="Square" className="w-7 h-7 rounded-md object-contain" />
              <div className="text-[11px] font-medium leading-tight">
                <div>Adaptive Icon</div>
                <div className="text-[9px] text-neutral-500">Square WebP</div>
              </div>
            </button>
          </div>
        </div>

        {/* File Upload Button */}
        <div className="mt-4">
          <label className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-xl border border-dashed border-[#434863] hover:border-[#5747D6] bg-white cursor-pointer text-xs font-semibold text-neutral-800 hover:text-neutral-900 transition-all">
            <Upload size={16} className="text-[#5747D6]" />
            <span>Upload Image from Device</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Or Paste URL */}
        <div className="mt-3">
          <label className="block text-[11px] text-neutral-600 mb-1">
            Or Paste Image URL:
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full bg-[#F4F5F7] border border-[#2a2c3d] focus:border-[#5747D6] rounded-xl px-3 py-2 text-xs text-[#17181C] outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="w-1/3 py-2.5 rounded-xl border border-[#2a2c3d] text-neutral-600 hover:text-neutral-900 text-xs font-medium flex items-center justify-center space-x-1 transition-colors"
          >
            <RotateCcw size={13} />
            <span>Default</span>
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-2/3 py-2.5 rounded-xl bg-[#D4C7FF] text-[#111218] font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-[#c6b6fc] transition-colors"
          >
            <Check size={14} />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
