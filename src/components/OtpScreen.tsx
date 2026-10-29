import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AppHeader} from './AppHeader';
import {AlertTriangle, ArrowRight, Pencil} from 'lucide-react';
import {CODE_LENGTH} from '../lib/backend';

interface OtpScreenProps {
  phoneNumber: string;
  /** False when no administrator has set a login code for this number. */
  registered: boolean;
  /** Line to show under the heading — comes from the backend, not hardcoded. */
  notice?: string;
  onEditPhone: () => void;
  /** Receives the typed code. Async: App.tsx verifies it and throws on failure. */
  onVerifySuccess: (code: string) => void | Promise<void>;
  onHowItWorks: () => void;
  /** The (i) door into the settings panel. */
  onOpenSettings?: () => void;
  customLogoUrl?: string | null;
  onOpenLogoCustomizer: () => void;
}

const emptyCode = () => Array<string>(CODE_LENGTH).fill('');

/**
 * Login-code screen.
 *
 * This is NOT an SMS OTP. An administrator sets a fixed 6-digit code per phone
 * number; the number is the username and the code is the password. Nothing is
 * sent to the device and nothing is read from an inbox, so the copy says so
 * plainly instead of pretending to "retrieve" a message.
 */
export const OtpScreen: React.FC<OtpScreenProps> = ({
  phoneNumber,
  registered,
  notice,
  onEditPhone,
  onVerifySuccess,
  onHowItWorks,
  onOpenSettings,
  customLogoUrl,
  onOpenLogoCustomizer,
}) => {
  const [code, setCode] = useState<string[]>(emptyCode);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const formattedPhone = useMemo(
    () => (phoneNumber.startsWith('+91') ? phoneNumber : `+91 ${phoneNumber}`),
    [phoneNumber],
  );

  const typed = code.join('');
  const isComplete = typed.length === CODE_LENGTH;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const submit = async (value: string) => {
    setIsVerifying(true);
    setError('');
    try {
      await onVerifySuccess(value);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Verification failed.');
      setCode(emptyCode());
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (digit && index === CODE_LENGTH - 1 && next.every((d) => d !== '')) {
      void submit(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = emptyCode();
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setCode(next);
    if (pasted.length === CODE_LENGTH) void submit(pasted);
    else inputRefs.current[pasted.length]?.focus();
  };

  return (
    <div className="relative w-full h-full min-h-full bg-[#FFFFFF] text-[#17181C] flex flex-col justify-between overflow-hidden select-none">
      <AppHeader
        showHowItWorks={true}
        onHowItWorksClick={onHowItWorks}
        onOpenSettings={onOpenSettings}
        customLogoUrl={customLogoUrl}
        onLogoClick={onOpenLogoCustomizer}
      />

      <div className="flex-1 px-5 pt-8 flex flex-col">
        <h1 className="text-[21px] sm:text-[22px] font-bold text-[#17181C] tracking-tight leading-snug">
          Enter your code
        </h1>

        <div className="mt-3 flex items-center space-x-2 text-[14px] text-neutral-700">
          <span>
            For <strong className="font-semibold text-[#17181C]">{formattedPhone}</strong>
          </span>
          <button
            type="button"
            onClick={onEditPhone}
            aria-label="Edit mobile number"
            className="p-1 rounded-md text-neutral-700 hover:text-neutral-900 hover:bg-black/[0.05] transition-colors"
          >
            <Pencil size={15} />
          </button>
        </div>

        {/* Code boxes */}
        <div className="mt-8 flex items-center justify-between gap-2 sm:gap-3">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={!registered || isVerifying}
              aria-label={`Digit ${index + 1}`}
              className={`flex-1 min-w-0 aspect-square max-w-[68px] text-center text-2xl font-bold bg-white rounded-xl border transition-all duration-200 outline-none disabled:opacity-40 ${
                digit
                  ? 'border-[#5A4BDA] text-[#17181C] shadow-md shadow-purple-950/20'
                  : 'border-[#E4E6EB] text-[#17181C] focus:border-[#5A4BDA] focus:ring-1 focus:ring-[#8E75FF]/40'
              }`}
            />
          ))}
        </div>

        {/* Backend-supplied notice */}
        {notice && (
          <div
            className={`mt-6 flex items-start gap-2 px-3 py-2.5 rounded-lg border ${
              registered ? 'bg-white border-[#E4E6EB]' : 'bg-[#FBF1D7] border-[#F2DFA8]'
            }`}
          >
            {registered ? (
              <ArrowRight size={14} className="text-[#5A4BDA] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={14} className="text-[#facc15] shrink-0 mt-0.5" />
            )}
            <p className="text-[11px] text-neutral-700 leading-relaxed">{notice}</p>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-[#ff9bb3] leading-relaxed">{error}</p>}
      </div>

      <div className="w-full px-5 pb-8 pt-4 flex flex-col items-center">
        <button
          type="button"
          disabled={!registered || !isComplete || isVerifying}
          onClick={() => void submit(typed)}
          className={`w-full py-4 rounded-xl font-bold text-[16px] text-center tracking-tight transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 ${
            registered && isComplete && !isVerifying
              ? 'bg-[#D4C7FF] hover:bg-[#c6b6fc] text-[#111218] shadow-lg shadow-purple-950/25 cursor-pointer'
              : 'bg-[#F1F2F4]/70 text-neutral-600 cursor-not-allowed opacity-80'
          }`}
        >
          {isVerifying && <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
          {isVerifying ? 'Verifying…' : 'Continue'}
        </button>

        <p className="mt-4 text-[11px] text-[#8e95a5] text-center leading-relaxed">
          No SMS is sent. Your login code is issued by the app administrator.
        </p>
      </div>
    </div>
  );
};
