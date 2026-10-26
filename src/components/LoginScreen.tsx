import React, { useState } from 'react';
import { AppHeader } from './AppHeader';
import { ChevronDown } from 'lucide-react';

interface LoginScreenProps {
  initialPhoneNumber?: string;
  onSubmit: (phone: string) => void;
  onHowItWorks: () => void;
  customLogoUrl?: string | null;
  onOpenLogoCustomizer: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  initialPhoneNumber = '',
  onSubmit,
  onHowItWorks,
  customLogoUrl,
  onOpenLogoCustomizer,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || '');
  const [isFocused, setIsFocused] = useState(false);

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const isValid = cleanPhone.length === 10;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isValid) {
      onSubmit(cleanPhone);
    }
  };

  return (
    <div className="relative w-full h-full min-h-full bg-[#F4F5F7] text-[#17181C] flex flex-col justify-between overflow-hidden select-none">
      {/* Header with PW Logo and "How it works" */}
      <AppHeader
        showHowItWorks={true}
        onHowItWorksClick={onHowItWorks}
        customLogoUrl={customLogoUrl}
        onLogoClick={onOpenLogoCustomizer}
      />

      {/* Main Form Content */}
      <div className="flex-1 px-5 pt-8 flex flex-col">
        {/* Title */}
        <h1 className="text-[21px] sm:text-[22px] font-bold text-[#17181C] tracking-tight leading-snug">
          Enter your number
        </h1>

        {/* Input Container with floating label on top-left border */}
        <div className="mt-8 relative">
          <div
            className={`relative flex items-center bg-[#F4F5F7] rounded-xl border transition-all duration-200 px-4 py-4.5 ${
              isFocused || phoneNumber.length > 0
                ? 'border-[#5747D6] ring-1 ring-[#8E75FF]/30 shadow-lg shadow-purple-950/20'
                : 'border-[#E4E6EB]'
            }`}
          >
            {/* Floating label cut into top border */}
            <span
              className={`absolute -top-2.5 left-4 px-1.5 text-[11px] font-medium bg-[#F4F5F7] transition-colors ${
                isFocused || phoneNumber.length > 0
                  ? 'text-[#5747D6]'
                  : 'text-[#9ca3af]'
              }`}
            >
              Mobile number
            </span>

            {/* Country Selector: IN +91 */}
            <div className="flex items-center space-x-1.5 pr-3 text-neutral-800 cursor-default select-none border-r border-[#E4E6EB]">
              <span className="text-[15px] font-semibold tracking-wide">
                IN +91
              </span>
              <ChevronDown size={15} className="text-neutral-600" />
            </div>

            {/* Phone Number Input */}
            <input
              type="tel"
              maxLength={10}
              autoFocus
              value={phoneNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhoneNumber(val);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter mobile number"
              className="flex-1 bg-transparent pl-3.5 pr-2 py-0.5 text-[#17181C] font-medium text-[16px] outline-none placeholder:text-neutral-600 tracking-wide"
            />
          </div>

          {/* Subtext below input */}
          {/* HONEST copy. This app sends no SMS: the 6-digit code is set per
              number by an administrator and verified locally against a stored
              digest. Claiming "we will send a code by SMS" would be a lie the
              user can disprove the moment they wait for a message that never
              arrives — so the text says what actually happens. */}
          <p className="mt-3 text-[13px] text-[#9ca3af] leading-normal font-normal">
            No SMS is sent. You will need the 6-digit code set for this number.
          </p>
        </div>
      </div>

      {/* Bottom Area: Get OTP button and Terms note */}
      <div className="w-full px-5 pb-8 pt-4 flex flex-col items-center">
        {/* Get OTP Button */}
        <button
          type="button"
          disabled={!isValid}
          onClick={() => handleSubmit()}
          className={`w-full py-4 rounded-xl font-bold text-[16px] text-center tracking-tight transition-all duration-200 active:scale-[0.99] ${
            isValid
              ? 'bg-[#D4C7FF] hover:bg-[#c6b6fc] text-[#111218] shadow-lg shadow-purple-950/25 cursor-pointer'
              : 'bg-[#F1F2F4]/70 text-neutral-600 cursor-not-allowed opacity-80'
          }`}
        >
          Get OTP
        </button>

        {/* Terms note */}
        <p className="mt-4 text-[12px] text-[#8e95a5] text-center leading-relaxed font-normal">
          By Continuing you agree to our{' '}
          <span className="text-[#17181C] hover:underline cursor-pointer">
            Terms of use
          </span>{' '}
          &{' '}
          <span className="text-[#17181C] hover:underline cursor-pointer">
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
};
