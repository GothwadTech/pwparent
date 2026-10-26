/**
 * Admin → Login codes tab.
 *
 * This is what replaces SMS OTP. The admin issues a fixed 6-digit code for a
 * phone number; that (number, code) pair is the credential. The number is the
 * username, the code is the password.
 *
 * Only a PBKDF2 digest is ever written to Firestore — see src/lib/credentials.ts
 * for why, and for the honest limits of verifying a credential in the browser.
 */
import React, {useEffect, useState} from 'react';
import {KeyRound, Plus, RefreshCw, ShieldAlert, Trash2} from 'lucide-react';
import type {Backend, LoginCodeInfo} from '../../lib/backend';
import {isValidCode, normalizePhone, randomSixDigitCode} from '../../lib/credentials';
import {btnDanger, btnGhost, btnPrimary, Field, inputCls, Note} from './ui';

interface LoginCodesTabProps {
  backend: Backend;
  isFirebase: boolean;
  flash: (message: string) => void;
}

export const LoginCodesTab: React.FC<LoginCodesTabProps> = ({backend, isFirebase, flash}) => {
  const [codes, setCodes] = useState<LoginCodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setCodes(await backend.listLoginCodes());
    } catch (loadError_) {
      // `list` on credentials is admin-only in the rules, so a denial here
      // usually means the signed-in uid has no admins/{uid} document.
      setLoadError(loadError_ instanceof Error ? loadError_.message : 'Could not read login codes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const digits = normalizePhone(phone);
  const canSave = digits.length === 10 && isValidCode(code) && !busy;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError('');
    try {
      await backend.setLoginCode(digits, code);
      flash(`Login code saved for ${digits}.`);
      setPhone('');
      setCode('');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the login code.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (target: string) => {
    try {
      await backend.deleteLoginCode(target);
      flash(`Login code removed for ${target}.`);
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove the login code.');
    }
  };

  return (
    <>
      <Note tone="warn">
        <ShieldAlert size={12} className="inline mr-1 -mt-0.5 text-[#facc15]" />
        Codes are stored as <strong className="text-neutral-200">PBKDF2-SHA256 digests</strong>, never in
        plaintext, and <code>credentials/{'{phone}'}</code> is <code>get</code>-only in the rules so the collection
        cannot be enumerated. Verification still happens in the browser, which is weaker than a server-side check —
        see docs/SECURITY.md.
      </Note>

      <form onSubmit={(e) => void save(e)} className="bg-[#11121c] border border-[#8E75FF]/35 rounded-xl p-3.5 space-y-2.5">
        <p className="text-xs font-bold flex items-center gap-1.5">
          <Plus size={13} className="text-[#8E75FF]" /> Issue or replace a login code
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Phone number" htmlFor="code-phone">
            <input
              id="code-phone"
              className={inputCls}
              inputMode="numeric"
              maxLength={10}
              placeholder="10 digits"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </Field>
          <Field label="6-digit code" htmlFor="code-value">
            <div className="flex gap-2">
              <input
                id="code-value"
                className={inputCls}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <button
                type="button"
                className={btnGhost}
                onClick={() => setCode(randomSixDigitCode())}
                aria-label="Generate a random code"
                title="Generate a random code"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </Field>
        </div>

        {error && <p className="text-xs text-[#ff9bb3] leading-relaxed">{error}</p>}

        <button type="submit" disabled={!canSave} className={`${btnPrimary} w-full py-2.5`}>
          <KeyRound size={13} /> {busy ? 'Hashing…' : 'Save code'}
        </button>

        <p className="text-[11px] text-neutral-500 leading-relaxed">
          Saving replaces any existing code for that number. Hashing takes a moment — PBKDF2 runs 210,000 rounds on
          purpose, so an offline brute force of the 10<sup>6</sup> code space is impractical.
        </p>
      </form>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          Registered numbers {codes.length > 0 && `(${codes.length})`}
        </span>
        <button type="button" className={btnGhost} onClick={() => void load()}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loadError && <Note tone="warn">{loadError}</Note>}

      {loading && <p className="text-xs text-neutral-500 text-center py-6">Loading…</p>}

      {!loading && !loadError && codes.length === 0 && (
        <Note>
          No numbers registered yet. Nobody can log in until you issue a code above — this is intentional, there is
          no demo data behind it.
        </Note>
      )}

      {codes.map((entry) => (
        <div key={entry.phone} className="bg-[#11121c] border border-[#262838] rounded-xl p-3.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold font-mono">+91 {entry.phone}</p>
            <p className="text-[11px] text-neutral-500 truncate">
              {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'created before timestamps were tracked'}
              {!entry.currentVersion && ' · old hash format, re-save to upgrade'}
            </p>
          </div>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setPhone(entry.phone);
              setCode(randomSixDigitCode());
              flash('Fill in the code, then Save to replace it.');
            }}
          >
            Replace
          </button>
          <button type="button" className={btnDanger} onClick={() => void remove(entry.phone)} aria-label={`Remove code for ${entry.phone}`}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      {!isFirebase && (
        <Note tone="warn">
          Mock mode stores codes in plaintext in <code>localStorage</code> — there is no Firestore and no hashing.
          Switch to <code>VITE_BACKEND_MODE=firebase</code> for the real behaviour.
        </Note>
      )}
    </>
  );
};
