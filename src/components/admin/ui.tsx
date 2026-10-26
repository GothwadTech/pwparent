/**
 * Shared primitives for the Admin Panel.
 *
 * Extracted so no single admin file approaches the 500-line ceiling and every
 * tab uses identical spacing/colour tokens.
 */
import React from 'react';

export const inputCls =
  'w-full bg-[#FFFFFF] border border-[#E4E6EB] rounded-lg px-3 py-2 text-sm text-[#17181C] ' +
  'outline-none focus:border-[#5747D6] focus:ring-1 focus:ring-[#5747D6]/40 transition-colors ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

export const labelCls = 'block text-[11px] font-semibold uppercase tracking-wide text-neutral-600 mb-1.5';

export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#5747D6] ' +
  'hover:bg-[#4b3bc4] text-white text-xs font-semibold transition-colors disabled:opacity-40';

export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FFFFFF] ' +
  'hover:bg-[#F1F2F4] border border-[#E4E6EB] text-neutral-700 text-xs font-semibold transition-colors';

export const btnDanger =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FBE0E5] ' +
  'hover:bg-[#F8D4DB] border border-[#F3C1CB] text-[#B02A43] text-xs font-semibold transition-colors';

export const cardCls = 'bg-[#FFFFFF] border border-[#E4E6EB] rounded-xl p-3.5';

interface FieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}

/** Label + control, so every field keeps the same rhythm. */
export const Field: React.FC<FieldProps> = ({label, htmlFor, children, className}) => (
  <div className={className}>
    <label className={labelCls} htmlFor={htmlFor}>
      {label}
    </label>
    {children}
  </div>
);

interface NoteProps {
  tone?: 'info' | 'warn';
  children: React.ReactNode;
}

/** Small explainer block. `warn` is used for the security caveats. */
export const Note: React.FC<NoteProps> = ({tone = 'info', children}) => (
  <p
    className={`text-[11px] leading-relaxed px-3 py-2.5 rounded-lg border ${
      tone === 'warn' ? 'bg-[#FBF1D7] border-[#F2DFA8] text-[#8A6D1A]' : 'bg-[#F4F5F7] border-[#E4E6EB] text-neutral-500'
    }`}
  >
    {children}
  </p>
);

/** Success line that clears itself — avoids pulling in a toast library. */
export const Flash: React.FC<{message: string}> = ({message}) =>
  message ? (
    <div className="shrink-0 px-4 py-2 bg-[#D8F0DE] border-b border-[#A7D9B4] text-[11px] text-[#1E7E43]">
      {message}
    </div>
  ) : null;

export function useFlash(timeoutMs = 2600) {
  const [notice, setNotice] = React.useState('');
  const timer = React.useRef<number | null>(null);

  const flash = React.useCallback(
    (message: string) => {
      setNotice(message);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setNotice(''), timeoutMs);
    },
    [timeoutMs],
  );

  React.useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return {notice, flash};
}
