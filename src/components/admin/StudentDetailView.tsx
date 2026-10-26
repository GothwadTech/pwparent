/**
 * One child's details — reached by drilling down: Batches → a batch → Students
 * → this child. There is deliberately NO top-level "Students" tab: the admin
 * panel is a drill-down, so a child is always seen in the context of the batch
 * you came from, and the family's login codes sit right here beside the record
 * instead of on a separate screen.
 *
 * WHAT IS EDITABLE:
 *   • the academic record (name, attendance %, video %, DPPs, test rows)
 *   • which batches this child belongs to — a checkbox list built from the
 *     batches that actually exist, never a free-text field, so a typo cannot
 *     invent a batch nobody is in
 *   • the family's login codes (embedded below)
 *
 * WHAT IS NOT EDITABLE: testsCompleted, avgScorePercent, accuracyPercent and
 * each row's scorePercent. `recomputeStudent` derives them from the raw marks on
 * every save, so the scorecard can never contradict itself. See src/lib/admin.ts.
 */
import React, {useMemo, useState} from 'react';
import {ArrowLeft, Layers, Plus, Save, Trash2, UserRound} from 'lucide-react';
import type {AllotableStudent, Batch, TestRecord} from '../../types';
import type {Backend} from '../../lib/backend';
import {newTestId, normalizePercentText, recomputeStudent} from '../../lib/admin';
import {btnDanger, btnGhost, btnPrimary, Field, inputCls, labelCls, Note} from './ui';
import {LoginCodesTab} from './LoginCodesTab';

interface StudentDetailViewProps {
  backend: Backend;
  mode: 'mock' | 'firebase';
  student: AllotableStudent;
  /** Every batch that exists, so membership is picked from reality. */
  batches: Batch[];
  /** Display name of the owning parent, used to pre-fill the login-code form. */
  parentName: string;
  flash: (message: string) => void;
  onBack: () => void;
  onDeleted: () => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  backend,
  mode,
  student,
  batches,
  parentName,
  flash,
  onBack,
  onDeleted,
}) => {
  // Local draft so typing never half-saves; the record is written on Save.
  const [draft, setDraft] = useState<AllotableStudent>(student);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showCodes, setShowCodes] = useState(false);

  const patch = (change: Partial<AllotableStudent>) => setDraft((prev) => ({...prev, ...change}));

  const memberOf = useMemo(() => new Set(draft.batchIds ?? []), [draft.batchIds]);

  const patchTest = (testId: string, change: Partial<TestRecord>) =>
    patch({tests: (draft.tests ?? []).map((t) => (t.id === testId ? {...t, ...change} : t))});

  const addTest = () => {
    const tests = draft.tests ?? [];
    patch({
      tests: [
        ...tests,
        {
          id: newTestId(tests),
          title: `Test ${tests.length + 1}`,
          date: new Date().toLocaleDateString('en-GB'),
          mode: 'Offline',
          status: 'MISSED',
          marksTotal: 300,
        },
      ],
    });
  };

  const removeTest = (testId: string) =>
    patch({tests: (draft.tests ?? []).filter((t) => t.id !== testId)});

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const next = recomputeStudent(draft);
      // `parentUid` is required: this child lives under SOME family's subtree,
      // which is not necessarily the signed-in admin's own.
      await backend.saveStudent(next, draft.parentUid);
      setDraft({...next, parentUid: draft.parentUid});
      flash(`${next.name || 'Student'} saved.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this student.');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Membership lives in `batches/{id}/members/{parentUid}.studentIds`, so
   * toggling a batch is an allotment write, not a field on the child. The
   * backend also keeps `StudentProfile.batchIds` in sync, which is what the
   * parent app reads to know which batches to show.
   */
  const toggleBatch = async (batch: Batch) => {
    setBusy(true);
    setError('');
    try {
      if (memberOf.has(batch.id)) {
        await backend.removeAllotment(batch.id, draft.parentUid, draft.id);
        patch({batchIds: (draft.batchIds ?? []).filter((id) => id !== batch.id)});
        flash(`Removed from ${batch.name}.`);
      } else {
        await backend.allotStudents(batch.id, draft.parentUid, [draft.id]);
        patch({batchIds: [...(draft.batchIds ?? []), batch.id]});
        flash(`Allotted to ${batch.name}.`);
      }
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Could not change batch membership.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await backend.deleteStudent(draft.id, draft.parentUid);
      flash(`${draft.name || 'Student'} deleted.`);
      onDeleted();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this student.');
      setBusy(false);
    }
  };

  const sid = draft.id;

  return (
    <div className="-mx-4 -my-4 flex flex-col h-full min-h-0">
      <header className="shrink-0 px-4 pt-3 pb-3 border-b border-[#1c1d29] bg-[#0a0b10]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white mb-2"
        >
          <ArrowLeft size={13} /> Back to students
        </button>
        <h2 className="text-base font-bold leading-tight truncate">{draft.name || '(unnamed)'}</h2>
        <p className="text-[11px] text-neutral-500 truncate flex items-center gap-1">
          <UserRound size={11} className="shrink-0" />
          {parentName || `parent ${draft.parentUid.slice(0, 12)}…`}
        </p>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {error && <Note tone="warn">{error}</Note>}

        {/* ── record ─────────────────────────────────────────────────────── */}
        <div className="bg-[#11121c] border border-[#262838] rounded-xl p-3.5 space-y-2.5">
          <p className="text-xs font-bold">Academic record</p>

          <Field label="Name" htmlFor={`name-${sid}`}>
            <input
              id={`name-${sid}`}
              className={inputCls}
              value={draft.name}
              onChange={(e) => patch({name: e.target.value})}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Attendance %" htmlFor={`att-${sid}`}>
              <input
                id={`att-${sid}`}
                className={inputCls}
                inputMode="numeric"
                value={draft.attendance}
                onChange={(e) => patch({attendance: normalizePercentText(e.target.value)})}
              />
            </Field>
            <Field label="Video watch %" htmlFor={`vid-${sid}`}>
              <input
                id={`vid-${sid}`}
                className={inputCls}
                inputMode="numeric"
                value={draft.videoWatchRate}
                onChange={(e) => patch({videoWatchRate: normalizePercentText(e.target.value)})}
              />
            </Field>
            <Field label="DPPs done" htmlFor={`dpp-${sid}`}>
              <input
                id={`dpp-${sid}`}
                className={inputCls}
                inputMode="numeric"
                value={draft.dppsDone}
                onChange={(e) => patch({dppsDone: Number(e.target.value) || 0})}
              />
            </Field>
            <Field label="Total tests" htmlFor={`tot-${sid}`}>
              <input
                id={`tot-${sid}`}
                className={inputCls}
                inputMode="numeric"
                value={draft.testsTotal ?? 0}
                onChange={(e) => patch({testsTotal: Number(e.target.value) || 0})}
              />
            </Field>
          </div>

          <Note>
            Tests attempted, avg. score and accuracy are derived from the rows below on every save — they cannot be
            typed directly. Day-wise attendance marked in a batch overrides the percentage shown here.
          </Note>
        </div>

        {/* ── batches: picked from what exists ───────────────────────────── */}
        <div className="bg-[#11121c] border border-[#262838] rounded-xl p-3.5 space-y-2">
          <p className="text-xs font-bold flex items-center gap-1.5">
            <Layers size={13} className="text-[#8E75FF]" /> Batches
          </p>

          {batches.length === 0 && <Note>No batches exist yet. Create one under Batches first.</Note>}

          {batches.map((batch) => {
            const on = memberOf.has(batch.id);
            return (
              <button
                key={batch.id}
                type="button"
                disabled={busy}
                onClick={() => void toggleBatch(batch)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors ${
                  on ? 'bg-[#8E75FF]/15 border-[#8E75FF]/50' : 'bg-[#0d0e16] border-[#232535] hover:border-[#3a3d52]'
                }`}
                aria-pressed={on}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    on ? 'bg-[#8E75FF] border-[#8E75FF] text-white' : 'border-[#3a3d52] text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold truncate">{batch.name}</span>
                  <span className="block text-[11px] text-neutral-500">
                    {batch.batchType === 'offline' ? 'Offline (centre)' : 'Online'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ── test rows ──────────────────────────────────────────────────── */}
        <div className="bg-[#11121c] border border-[#262838] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className={labelCls}>Test records</span>
            <button type="button" className={btnGhost} onClick={addTest}>
              <Plus size={12} /> Add test
            </button>
          </div>

          {(draft.tests ?? []).length === 0 && <Note>No test rows yet.</Note>}

          {(draft.tests ?? []).map((test) => (
            <div key={test.id} className="bg-[#0d0e16] border border-[#232535] rounded-lg p-2.5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputCls}
                  aria-label="Test title"
                  value={test.title}
                  onChange={(e) => patchTest(test.id, {title: e.target.value})}
                />
                <input
                  className={inputCls}
                  aria-label="Test date"
                  value={test.date}
                  onChange={(e) => patchTest(test.id, {date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className={inputCls}
                  aria-label="Test mode"
                  value={test.mode}
                  onChange={(e) => patchTest(test.id, {mode: e.target.value as TestRecord['mode']})}
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
                <select
                  className={inputCls}
                  aria-label="Test status"
                  value={test.status}
                  onChange={(e) => patchTest(test.id, {status: e.target.value as TestRecord['status']})}
                >
                  <option value="ATTEMPTED">Attempted</option>
                  <option value="MISSED">Missed</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  className={inputCls}
                  aria-label="Marks obtained"
                  inputMode="numeric"
                  placeholder="Marks"
                  value={test.marksObtained ?? ''}
                  onChange={(e) => patchTest(test.id, {marksObtained: e.target.value === '' ? undefined : Number(e.target.value)})}
                />
                <input
                  className={inputCls}
                  aria-label="Marks total"
                  inputMode="numeric"
                  placeholder="Out of"
                  value={test.marksTotal ?? ''}
                  onChange={(e) => patchTest(test.id, {marksTotal: e.target.value === '' ? undefined : Number(e.target.value)})}
                />
                <input
                  className={inputCls}
                  aria-label="Accuracy percent"
                  inputMode="numeric"
                  placeholder="Acc %"
                  value={test.accuracyPercent ?? ''}
                  onChange={(e) => patchTest(test.id, {accuracyPercent: e.target.value === '' ? undefined : Number(e.target.value)})}
                />
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] text-neutral-500">Score: {test.scorePercent ?? 0}%</span>
                <button type="button" className={btnDanger} onClick={() => removeTest(test.id)} aria-label={`Delete ${test.title}`}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button" className={btnPrimary} disabled={busy} onClick={() => void save()}>
            <Save size={13} /> {busy ? 'Saving…' : 'Save student'}
          </button>
          <button type="button" className={btnDanger} disabled={busy} onClick={() => void remove()}>
            <Trash2 size={13} /> Delete
          </button>
        </div>

        {/* ── family login codes, right here in the child's details ──────── */}
        <div className="space-y-2">
          <button type="button" className={`${btnGhost} w-full`} onClick={() => setShowCodes((v) => !v)}>
            {showCodes ? 'Hide login codes' : 'Show this family’s login codes'}
          </button>
          {showCodes && (
            <LoginCodesTab
              backend={backend}
              isFirebase={mode === 'firebase'}
              flash={flash}
              initialName={parentName || draft.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};
