import React, { useState, useEffect, useRef } from 'react';
import { AppHeader } from './AppHeader';
import { Pencil, CheckCircle2 } from 'lucide-react';

interface OtpScreenProps {
  phoneNumber: string;
  onEditPhone: () => void;
  onVerifySuccess: () => void;
  onHowItWorks: () => void;
  customLogoUrl?: string | null;
  onOpenLogoCustomizer: () => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
  phoneNumber,
  onEditPhone,
  onVerifySuccess,
  onHowItWorks,
  customLogoUrl,
  onOpenLogoCustomizer,
}) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(26);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format phone display
  const formattedPhone = phoneNumber.startsWith('+91')
    ? phoneNumber
    : `+91 ${phoneNumber || '9335010032'}`;

  // Countdown timer from 26s as shown in screenshot
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle OTP input change
  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto advance focus to next box
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify when all 4 digits entered
    if (digit && index === 3 && newOtp.every((d) => d !== '')) {
      handleComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pastedData) return;
    const newOtp = ['', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    if (pastedData.length === 4) {
      handleComplete(pastedData);
    }
  };

  const handleComplete = (code: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      onVerifySuccess();
    }, 700);
  };

  const handleAutoFill = () => {
    const code = ['4', '2', '8', '6'];
    setOtp(code);
    handleComplete('4286');
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0a0b10] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Header with PW logo and How it works */}
      <AppHeader
        showHowItWorks={true}
        onHowItWorksClick={onHowItWorks}
        customLogoUrl={customLogoUrl}
        onLogoClick={onOpenLogoCustomizer}
      />

      {/* Main Content */}
      <div className="flex-1 px-5 pt-8 flex flex-col">
        {/* Title */}
        <h1 className="text-[28px] sm:text-[30px] font-bold text-white tracking-tight leading-snug">
          OTP Verification
        </h1>

        {/* Subtitle with Phone Number and Pencil Edit Icon */}
        <div className="mt-3 flex items-center space-x-2 text-[14.5px] text-neutral-300">
          <span>Enter the code sent on <strong className="font-semibold text-white">{formattedPhone}</strong></span>
          <button
            type="button"
            onClick={onEditPhone}
            aria-label="Edit mobile number"
            className="p-1 rounded-md text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Pencil size={15} />
          </button>
        </div>

        {/* 4 OTP Input Boxes */}
        <div className="mt-8 flex items-center space-x-3.5 sm:space-x-4">
          {[0, 1, 2, 3].map((index) => {
            const hasVal = Boolean(otp[index]);
            return (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={otp[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                autoFocus={index === 0}
                className={`w-[62px] h-[62px] sm:w-[68px] sm:h-[68px] text-center text-2xl font-bold bg-[#11121c] rounded-xl border transition-all duration-200 outline-none ${
                  hasVal
                    ? 'border-[#8E75FF] text-white shadow-md shadow-purple-950/20'
                    : 'border-[#262838] text-white focus:border-[#8E75FF] focus:ring-1 focus:ring-[#8E75FF]/40'
                }`}
              />
            );
          })}
        </div>

        {/* Countdown Timer in lavender/purple */}
        <div className="mt-6">
          <span className="text-[17px] font-bold text-[#a78bfa] tracking-wider">
            {`00:${timer.toString().padStart(2, '0')}`}
          </span>
        </div>

        {/* Status Message from screenshot: "We are trying to retrieving your OTP \n Please Wait •••" */}
        <div className="mt-3 text-[14px] text-neutral-300 leading-relaxed">
          <p>We are trying to retrieving your OTP</p>
          <div className="flex items-center space-x-1.5 mt-0.5 text-neutral-300">
            <span>Please Wait</span>
            <span className="inline-flex space-x-1 items-center text-[#8E75FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E75FF] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E75FF] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E75FF] animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        </div>

        {/* Auto-fill test shortcut button */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isVerifying}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#181926] hover:bg-[#222436] text-xs text-[#c6b6fc] border border-[#2f3246] transition-all"
          >
            <CheckCircle2 size={14} className="text-[#8E75FF]" />
            <span>Simulate SMS auto-read (Fill 4286)</span>
          </button>
        </div>
      </div>

      {/* Bottom spacer / verify state */}
      <div className="w-full px-5 pb-8 pt-2">
        {isVerifying && (
          <div className="w-full py-3.5 rounded-xl bg-[#D4C7FF] text-[#111218] font-bold text-center flex items-center justify-center space-x-2">
            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>Verifying OTP...</span>
          </div>
        )}
      </div>
    </div>
  );
};
