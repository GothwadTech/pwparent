/**
 * Create a student — from inside a batch.
 *
 * Two rules this form enforces, both from hard-won bugs:
 *
 *   1. THE PARENT IS PICKED, NOT GUESSED. A student document lives at
 *      `parents/{parentUid}/children/{childId}`, so "who owns this child" is
 *      part of the write, not an afterthought. Picking from `listAllParents()`
 *      means the admin can see the family name, their number and how many
 *      children they already have before committing.
 *
 *   2. THE BATCH IS PICKED FROM WHAT EXISTS. It is a dropdown of real batches,
 *      pre-set to the batch you drilled in from. A free-text batch name is how
 *      you end up with a child "in JEE 2026" that no batch document matches —
 *      invisible to the parent, un-markable for attendance, and impossible to
 *      find again. There is no free-text field here on purpose.
 *
 * Creating the child and allotting it are ONE action. A child that exists but
 * is in no batch shows up nowhere in the parent app, which reads as data loss
 * even though nothing was lost.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {Plus, RefreshCw, UserPlus} from 'lucide-react';
import type {Batch, ParentDirectoryEntry, StudentProfile} from '../../types';
import type {Backend} from '../../lib/backend';
import {recomputeStudent} from '../../lib/admin';
import {btnGhost, btnPrimary, Field, inputCls, Note} from './ui';

interface StudentCreatePanelProps {
  backend: Backend;
  /** Every batch that exists — the dropdown is built from this, never typed. */
  batches: Batch[];
  /** The batch you drilled in from; pre-selected but changeable. */
  currentBatch: Batch;
  flash: (message: string) => void;
  onCreated: () => void;
}

/** A blank record with honest zeros — no invented attendance or test counts. */
function blankStudent(): StudentProfile {
  return {
    id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    batch: '',
    course: '',
    attendance: '0%',
    testsCompleted: 0,
    dppsDone: 0,
    videoWatchRate: '0%',
    testsTotal: 0,
    avgScorePercent: 0,
    accuracyPercent: 0,
    tests: [],
  };
}

export const StudentCreatePanel: React.FC<StudentCreatePanelProps> = ({
  backend,
  batches,
  currentBatch,
  flash,
  onCreated,
}) => {
  const [parents, setParents] = useState<ParentDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [parentUid, setParentUid] = useState('');
  const [name, setName] = useState('');
  const [batchId, setBatchId] = useState(currentBatch.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setParents(await backend.listAllParents());
    } catch (parentsError) {
      // `list` on parents is admin-only in the rules, so a denial here means the
      // signed-in uid has no admins/{uid} document.
      setLoadError(parentsError instanceof Error ? parentsError.message : 'Could not list parents.');
    } finally {
      setLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    void load();
  }, [load]);

  // Follow the batch you drilled in from if it changes underneath the form.
  useEffect(() => {
    setBatchId(currentBatch.id);
  }, [currentBatch.id]);

  const chosenBatch = batches.find((b) => b.id === batchId) ?? currentBatch;
  const canSave = parentUid.length > 0 && name.trim().length > 0 && !busy;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError('');
    try {
      const student = recomputeStudent({
        ...blankStudent(),
        name: name.trim(),
        // Display name mirrors the batch actually allotted, so the parent app
        // and the admin list agree without a second source of truth.
        batch: chosenBatch.name,
        batchIds: [chosenBatch.id],
      });

      await backend.saveStudent(student, parentUid);
      await backend.allotStudents(chosenBatch.id, parentUid, [student.id]);

      const parent = parents.find((p) => p.uid === parentUid);
      flash(`${student.name} added to ${chosenBatch.name}${parent ? ` for ${parent.name}` : ''}.`);
      setName('');
      onCreated();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create this student.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void create(e)} className="bg-[#11121c] border border-[#8E75FF]/40 rounded-xl p-3.5 space-y-2.5">
      <p className="text-xs font-bold flex items-center gap-1.5">
        <UserPlus size={13} className="text-[#8E75FF]" /> New student
      </p>

      {loadError && <Note tone="warn">{loadError}</Note>}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-neutral-500">
          {loading ? 'Loading families…' : `${parents.length} ${parents.length === 1 ? 'family' : 'families'} registered`}
        </span>
        <button type="button" className={btnGhost} onClick={() => void load()}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {!loading && !loadError && parents.length === 0 && (
        <Note>
          No parent has signed in yet, so there is nobody to attach a child to. A family has to log in once with a
          code you issued before they appear here.
        </Note>
      )}

      <Field label="Parent / family" htmlFor="new-student-parent">
        <select
          id="new-student-parent"
          className={inputCls}
          value={parentUid}
          onChange={(e) => setParentUid(e.target.value)}
        >
          <option value="">Choose a family…</option>
          {parents.map((parent) => (
            <option key={parent.uid} value={parent.uid}>
              {(parent.name || 'Unnamed').trim()}
              {parent.mobileNumber ? ` · ${parent.mobileNumber}` : ''}
              {` · ${parent.childCount} ${parent.childCount === 1 ? 'child' : 'children'}`}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Student name" htmlFor="new-student-name">
        <input
          id="new-student-name"
          className={inputCls}
          placeholder="e.g. Ananya Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="Batch" htmlFor="new-student-batch">
        {/* A picker over real batches — never a text field, so a typo cannot
            invent a batch that no document backs. */}
        <select
          id="new-student-batch"
          className={inputCls}
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
        >
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} · {batch.batchType === 'offline' ? 'Offline' : 'Online'}
            </option>
          ))}
        </select>
      </Field>

      {error && <p className="text-xs text-[#ff9bb3] leading-relaxed">{error}</p>}

      <button type="submit" disabled={!canSave} className={`${btnPrimary} w-full py-2.5`}>
        <Plus size={13} /> {busy ? 'Creating…' : `Create and allot to ${chosenBatch.name}`}
      </button>

      <p className="text-[11px] text-neutral-500 leading-relaxed">
        Attendance, tests and scores all start at zero and are filled in from the batch panels — nothing is
        pre-populated with placeholder numbers.
      </p>
    </form>
  );
};
