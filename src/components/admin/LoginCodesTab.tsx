/**
 * Admin → Login codes.
 *
 * This is what replaces SMS OTP. The admin issues a fixed 6-digit code for a
 * phone number; that (number, code) pair is the credential. The number is the
 * username, the code is the password.
 *
 * WHY NAMES: one family routinely has several numbers — the father's, the
 * mother's, the student's own phone — and a child may be given a different code
 * on each. A list of bare 10-digit numbers is unreadable at that point, so every
 * entry carries a NAME and the list groups by it. The name is the label you
 * recognise; the numbers underneath are the ways in.
 *
 * WHY THE CODE IS MASKED IN THE LIST: only a PBKDF2-SHA256 digest is ever
 * written to Firestore, so a stored code genuinely cannot be read back — not by
 * the app, not by an admin, not by anyone with database access. The plaintext is
 * shown exactly once, in the banner immediately after you save it. Lose it and
 * you replace it. See src/lib/credentials.ts and docs/SECURITY.md.
 */
import React, {useEffect, useMemo, useState} from 'react';
import {KeyRound, Pencil, Plus, RefreshCw, ShieldAlert, Trash2, User} from 'lucide-react';
import type {Backend, LoginCodeInfo} from '../../lib/backend';
import {isValidCode, normalizePhone, randomSixDigitCode} from '../../lib/credentials';
import {btnDanger, btnGhost, btnPrimary, Field, inputCls, Note} from './ui';

interface LoginCodesTabProps {
  backend: Backend;
  isFirebase: boolean;
  flash: (message: string) => void;
  /** Pre-fills the Name field so a family's numbers stay grouped. */
  initialName?: string;
  /**
   * Scope this panel to ONE child.
   *
   * The rule is one number -> one student, so when this panel is embedded in a
   * child's details it must show that child's numbers and nothing else. Without
   * the scope it listed every credential in the project, which is why a code
   * issued for one student appeared to be "given to" the next one you opened.
   */
  studentId?: string;
  /** Subtree the scoped child lives in; written onto the credential. */
  parentUid?: string;
}

/** Entries with no name still have to appear somewhere, not vanish. */
const UNNAMED = '(no name given)';

interface Issued {
  name: string;
  phone: string;
  code: string;
}

export const LoginCodesTab: React.FC<LoginCodesTabProps> = ({backend, isFirebase, flash, initialName, studentId, parentUid}) => {
  const [codes, setCodes] = useState<LoginCodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [name, setName] = useState(initialName ?? '');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /** The code just saved, shown in plaintext exactly once. */
  const [issued, setIssued] = useState<Issued | null>(null);

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

  // The panel stays mounted while the admin drills between children, so the
  // pre-filled name has to follow the child rather than stick to the first one.
  useEffect(() => {
    if (initialName !== undefined) setName(initialName);
  }, [initialName]);

  /**
   * Grouped by name so one family's several numbers sit together. Sorted with
   * real names first (alphabetically) and the unnamed bucket last, because
   * "who is this?" is the question the list exists to answer.
   */
  /**
   * Codes issued before the binding existed carry no studentId. They are kept
   * visible (and bindable) rather than hidden, because silently dropping them is
   * how a family loses access and reports it as data loss.
   */
  const scoped = useMemo(() => {
    if (!studentId) return {mine: codes, unbound: [] as LoginCodeInfo[]};
    return {
      mine: codes.filter((c) => c.studentId === studentId),
      unbound: codes.filter((c) => !c.studentId),
    };
  }, [codes, studentId]);

  const groups = useMemo(() => {
    const byName = new Map<string, LoginCodeInfo[]>();
    for (const entry of scoped.mine) {
      const key = entry.name?.trim() || UNNAMED;
      const bucket = byName.get(key);
      if (bucket) bucket.push(entry);
      else byName.set(key, [entry]);
    }
    return [...byName.entries()]
      .sort(([a], [b]) => {
        if (a === UNNAMED) return 1;
        if (b === UNNAMED) return -1;
        return a.localeCompare(b);
      })
      .map(([label, entries]) => ({
        label,
        entries: entries.sort((x, y) => x.phone.localeCompare(y.phone)),
      }));
  }, [scoped.mine]);

  const digits = normalizePhone(phone);
  const canSave = digits.length === 10 && isValidCode(code) && !busy;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError('');
    const label = name.trim();
    try {
      await backend.setLoginCode(digits, code, {
        name: label || undefined,
        studentId: studentId || undefined,
        parentUid: parentUid || undefined,
      });
      // Capture the plaintext NOW — after this it exists nowhere but on screen.
      setIssued({name: label, phone: digits, code});
      flash(`Login code saved for ${label || digits}.`);
      setName('');
      setPhone('');
      setCode('');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the login code.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (target: LoginCodeInfo) => {
    const who = target.name ? `${target.name} (${target.phone})` : target.phone;
    try {
      await backend.deleteLoginCode(target.phone);
      flash(`Login code removed for ${who}.`);
      if (issued?.phone === target.phone) setIssued(null);
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove the login code.');
    }
  };

  /**
   * Edit pre-fills the form and generates a fresh code. It cannot pre-fill the
   * old one, because the old one was never stored — only its digest was.
   */
  const edit = (entry: LoginCodeInfo) => {
    setName(entry.name ?? '');
    setPhone(entry.phone);
    setCode(randomSixDigitCode());
    setIssued(null);
    flash('Editing — a new code was generated. Save to apply it.');
  };

  return (
    <>
      <Note tone="warn">
        <ShieldAlert size={12} className="inline mr-1 -mt-0.5 text-[#facc15]" />
        Codes are stored as <strong className="text-neutral-800">PBKDF2-SHA256 digests</strong>, never in
        plaintext, and <code>credentials/{'{phone}'}</code> is <code>get</code>-only in the rules so the collection
        cannot be enumerated. A saved code cannot be read back — write it down when you issue it, or replace it.
      </Note>

      {issued && (
        <div className="bg-[#D8F0DE] border border-[#4ade80]/45 rounded-xl p-3.5 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4ade80]">
            Just issued — shown once
          </p>
          {issued.name && <p className="text-sm font-bold">{issued.name}</p>}
          <p className="text-xs font-mono text-neutral-700">+91 {issued.phone}</p>
          <p className="text-2xl font-mono font-bold tracking-[0.3em] text-[#4ade80]">{issued.code}</p>
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            Give this to the family now. It is not stored anywhere readable, so it will not appear in the list below.
          </p>
          <button type="button" className={btnGhost} onClick={() => setIssued(null)}>
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={(e) => void save(e)} className="bg-white border border-[#5A4BDA]/35 rounded-xl p-3.5 space-y-2.5">
        <p className="text-xs font-bold flex items-center gap-1.5">
          <Plus size={13} className="text-[#5A4BDA]" /> Issue or replace a login code
        </p>

        <Field label="Name" htmlFor="code-name">
          <input
            id="code-name"
            className={inputCls}
            placeholder="e.g. Ananya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <p className="text-[11px] text-neutral-500 -mt-1 leading-relaxed">
          Whose number is this? Give the same name to every number in one family and they will be grouped together.
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
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
          {studentId ? 'Numbers for this student' : 'Registered'}{' '}
          {scoped.mine.length > 0 && `(${scoped.mine.length} ${scoped.mine.length === 1 ? 'number' : 'numbers'})`}
        </span>
        <button type="button" className={btnGhost} onClick={() => void load()}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loadError && <Note tone="warn">{loadError}</Note>}

      {loading && <p className="text-xs text-neutral-500 text-center py-6">Loading…</p>}

      {!loading && !loadError && scoped.mine.length === 0 && (
        <Note>
          {studentId
            ? 'This student has no login number yet. Issue one above — it will be bound to this child only, so logging in with it opens this child and nobody else.'
            : 'No numbers registered yet. Nobody can log in until you issue a code above — this is intentional, there is no demo data behind it.'}
        </Note>
      )}

      {scoped.unbound.length > 0 && (
        <Note tone="warn">
          {scoped.unbound.length} older code{scoped.unbound.length === 1 ? '' : 's'} not bound to any student{' '}
          {scoped.unbound.map((c) => c.phone).join(', ')}. Press Edit on one below to bind it to this child.
        </Note>
      )}

      {groups.map((group) => (
        <div key={group.label} className="bg-white border border-[#E4E6EB] rounded-xl p-3.5 space-y-2.5">
          <p className="text-sm font-bold flex items-center gap-1.5">
            <User size={13} className="text-[#5A4BDA] shrink-0" />
            <span className="truncate">{group.label}</span>
            {group.entries.length > 1 && (
              <span className="text-[10px] font-semibold text-neutral-500 ml-auto shrink-0">
                {group.entries.length} numbers
              </span>
            )}
          </p>

          {group.entries.map((entry) => (
            <div key={entry.phone} className="border-t border-[#E4E6EB] pt-2.5">
              <p className="text-xs font-mono text-neutral-700">+91 {entry.phone}</p>
              <p className="text-[11px] text-neutral-500 truncate">
                {/* The digest is not reversible, so there is nothing to show. */}
                code <span className="font-mono">••••••</span>
                {entry.createdAt ? ` · set ${new Date(entry.createdAt).toLocaleString()}` : ''}
                {!entry.currentVersion && ' · old hash format, re-save to upgrade'}
              </p>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => edit(entry)}
                  aria-label={`Edit the code for ${entry.name || entry.phone}`}
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  className={btnDanger}
                  onClick={() => void remove(entry)}
                  aria-label={`Remove the code for ${entry.name || entry.phone}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
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
