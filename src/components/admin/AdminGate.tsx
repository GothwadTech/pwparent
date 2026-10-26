/**
 * Admin sign-in gate.
 *
 * ── FIREBASE MODE (the real one) ───────────────────────────────────────────
 * Username + password, held by Firebase Auth — the password is NEVER stored in
 * Firestore, not even hashed. The FIRST registration claims the one-and-only
 * admin slot; `adminConfig/singleton` then closes it permanently and the panel
 * only ever offers login again.
 *
 * ── MOCK MODE ──────────────────────────────────────────────────────────────
 * No Firebase, so no email/password provider. Falls back to the
 * `VITE_ADMIN_PASSCODE` gate so offline development and the test suite still
 * work. That passcode is inlined into the public bundle and is not security —
 * it exists only in the mode that has no data worth protecting.
 */
import React, {useEffect, useState} from 'react';
import {ArrowLeft, KeyRound, ShieldAlert, UserPlus} from 'lucide-react';
import {
  type AdminIdentity,
  AdminAuthError,
  isRegistrationOpen,
  loginAdmin,
  registerAdmin,
  validatePassword,
  validateUsername,
} from '../../lib/adminAuth';
import {isAdminUnlocked, lockAdmin, unlockAdmin} from '../../lib/admin';
import {ADMIN_PASSCODE} from '../../lib/config';
import {btnGhost, btnPrimary, Field, inputCls, Note} from './ui';

interface AdminGateProps {
  mode: 'mock' | 'firebase';
  onAuthenticated: (identity: AdminIdentity | null) => void;
  onBack: () => void;
}

const Shell: React.FC<{title: string; subtitle: string; icon: React.ReactNode; onBack: () => void; children: React.ReactNode}> = ({
  title,
  subtitle,
  icon,
  onBack,
  children,
}) => (
  <div className="w-full h-full bg-[#0a0b10] text-white flex flex-col select-none">
    <header className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-[#1c1d29]">
      <button type="button" onClick={onBack} aria-label="Back" className="p-1.5 rounded-lg hover:bg-white/5">
        <ArrowLeft size={18} />
      </button>
      <h1 className="text-base font-bold">Admin</h1>
    </header>
    <div className="flex-1 overflow-y-auto px-5 py-8">
      <div className="mx-auto w-full max-w-sm flex flex-col">
        <div className="w-14 h-14 rounded-2xl bg-[#8E75FF]/15 border border-[#8E75FF]/30 flex items-center justify-center mb-4 mx-auto">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-center">{title}</h2>
        <p className="mt-2 text-xs text-neutral-400 leading-relaxed text-center">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  </div>
);

export const AdminGate: React.FC<AdminGateProps> = ({mode, onAuthenticated, onBack}) => {
  // ── mock-mode passcode path ──────────────────────────────────────────────
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState('');

  // ── firebase-mode credential path ────────────────────────────────────────
  const [registering, setRegistering] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'firebase') return;
    let cancelled = false;
    void isRegistrationOpen()
      .then((open) => {
        if (!cancelled) setRegistering(open);
      })
      .catch(() => {
        if (!cancelled) setRegistering(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Mock mode may already be unlocked from an earlier visit this tab-session.
  useEffect(() => {
    if (mode === 'mock' && isAdminUnlocked()) onAuthenticated(null);
  }, [mode, onAuthenticated]);

  if (mode === 'mock') {
    const submitPasscode = (e: React.FormEvent) => {
      e.preventDefault();
      if (unlockAdmin(passcode)) {
        onAuthenticated(null);
      } else {
        setPassError('Incorrect passcode.');
      }
    };

    return (
      <Shell
        title="Restricted area"
        subtitle="Mock mode has no Firebase Auth, so this build uses the local passcode gate."
        icon={<KeyRound size={22} className="text-[#8E75FF]" />}
        onBack={onBack}
      >
        <form onSubmit={submitPasscode} className="space-y-3">
          <Field label="Passcode" htmlFor="admin-passcode">
            <input
              id="admin-passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoFocus
              className={inputCls}
              placeholder="Passcode"
            />
          </Field>
          {passError && <p className="text-xs text-[#ff9bb3]">{passError}</p>}
          <button type="submit" className={`${btnPrimary} w-full py-3 text-sm`}>
            Unlock
          </button>
          <Note tone="warn">
            Default <code className="text-neutral-300">{ADMIN_PASSCODE}</code>, changeable with{' '}
            <code className="text-neutral-300">VITE_ADMIN_PASSCODE</code>. This is a client-side gate, not real
            security — set <code className="text-neutral-300">VITE_BACKEND_MODE=firebase</code> for username +
            password auth.
          </Note>
        </form>
      </Shell>
    );
  }

  if (registering === null) {
    return (
      <Shell
        title="Checking admin status…"
        subtitle="Reading Firestore to see whether an administrator already exists."
        icon={<KeyRound size={22} className="text-[#8E75FF] animate-pulse" />}
        onBack={onBack}
      >
        <div className="h-1 w-full rounded-full bg-[#1a1b2a] overflow-hidden">
          <div className="h-full w-1/3 bg-[#8E75FF] animate-pulse" />
        </div>
      </Shell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registering) {
      const nameError = validateUsername(username);
      if (nameError) return setError(nameError);
      const passError2 = validatePassword(password);
      if (passError2) return setError(passError2);
      if (password !== confirm) return setError('Passwords do not match.');
    }

    setBusy(true);
    try {
      const identity = registering ? await registerAdmin(username, password) : await loginAdmin(username, password);
      onAuthenticated(identity);
    } catch (submitError) {
      setError(
        submitError instanceof AdminAuthError || submitError instanceof Error
          ? submitError.message
          : 'Something went wrong.',
      );
      // Registration may have been claimed by someone else between page load
      // and submit; re-check so the form flips to login instead of failing again.
      if (!registering) return;
      const stillOpen = await isRegistrationOpen().catch(() => true);
      setRegistering(stillOpen);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title={registering ? 'Create the admin account' : 'Admin sign in'}
      subtitle={
        registering
          ? 'The first account created becomes the one and only administrator. This cannot be undone from the app.'
          : 'Registration is closed — an administrator already exists.'
      }
      icon={
        registering ? (
          <UserPlus size={22} className="text-[#8E75FF]" />
        ) : (
          <KeyRound size={22} className="text-[#8E75FF]" />
        )
      }
      onBack={onBack}
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <Field label="Username" htmlFor="admin-username">
          <input
            id="admin-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            className={inputCls}
            placeholder="3-30 chars: a-z 0-9 . - _"
          />
        </Field>

        <Field label="Password" htmlFor="admin-password">
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={registering ? 'new-password' : 'current-password'}
            className={inputCls}
            placeholder={registering ? 'Min 8 chars, with a letter and a number' : 'Password'}
          />
        </Field>

        {registering && (
          <Field label="Confirm password" htmlFor="admin-confirm">
            <input
              id="admin-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className={inputCls}
              placeholder="Repeat password"
            />
          </Field>
        )}

        {error && (
          <p className="text-xs text-[#ff9bb3] leading-relaxed px-3 py-2.5 rounded-lg bg-[#2a1620] border border-[#4d2436]">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3 text-sm`}>
          {busy ? 'Please wait…' : registering ? 'Create admin account' : 'Sign in'}
        </button>

        {registering ? (
          <Note tone="warn">
            <ShieldAlert size={12} className="inline mr-1 -mt-0.5 text-[#facc15]" />
            <strong className="text-neutral-200">Whoever registers first wins, permanently.</strong> Do this
            immediately after your first deploy. Resetting later means deleting the user in Firebase console →
            Authentication → Users, and the <code>adminConfig/singleton</code> document in Firestore.
            <br />
            <br />
            Requires <strong className="text-neutral-200">Email/Password</strong> enabled in Authentication →
            Sign-in method.
          </Note>
        ) : (
          <button type="button" className={`${btnGhost} w-full`} onClick={() => lockAdmin()}>
            Clear local unlock flag
          </button>
        )}
      </form>
    </Shell>
  );
};
