/**
 * Batch → Tests panel.
 *
 * A test belongs to the BATCH, not to a student — that inversion is the whole
 * point of this model. Marks live in `results/{studentId}` under the test, so
 * every student allotted to the batch has a row on the same paper.
 *
 * Syllabus is a structured list of `{subject, topic}` rather than a
 * blob of text, so the subject-wise breakdown can be rendered (and so a paper
 * whose weights do not add up to 100 can be flagged before it is published).
 */
import React, {useCallback, useEffect, useState} from 'react';
import {ChevronRight, ClipboardList, Plus, RefreshCw, Save, Trash2} from 'lucide-react';
import type {Batch, BatchTest, SyllabusTopic} from '../../types';
import type {Backend} from '../../lib/backend';
import {newBatchTestId} from '../../lib/backend';
import {NEET_SUBJECTS, NEET_SUBJECT_MARKS, subjectTypeOf} from '../../lib/neetSubjects';
import {chapterOptions} from '../../lib/neetSyllabus';
import {TestResultsPanel} from './TestResultsPanel';
import {btnDanger, btnGhost, btnPrimary, Field, inputCls, labelCls, Note} from './ui';

interface BatchTestsPanelProps {
  backend: Backend;
  batch: Batch;
  flash: (message: string) => void;
}

function blankTest(existing: BatchTest[]): BatchTest {
  return {
    id: newBatchTestId(existing),
    batchId: '',
    title: '',
    date: new Date().toISOString().slice(0, 10),
    mode: 'Online',
    paperType: 'Objective',
    marksTotal: 300,
    status: 'scheduled',
    syllabus: [],
  };
}

const SyllabusEditor: React.FC<{
  syllabus: SyllabusTopic[];
  onChange: (next: SyllabusTopic[]) => void;
  subjectType?: string;
}> = ({syllabus, onChange, subjectType}) => {
  const [customFor, setCustomFor] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');

  const sections = subjectType === 'NEET' || !subjectType ? NEET_SUBJECTS : NEET_SUBJECTS;
  const linesOf = (subject: string) => syllabus.filter((t) => (t.subject || '').trim() === subject);
  // Free-text subjects saved before the picker existed keep their own rows.
  const legacy = syllabus.filter((t) => !NEET_SUBJECTS.includes((t.subject || '').trim()));

  const setTopics = (subject: string, topics: string[]) => {
    const others = syllabus.filter((t) => (t.subject || '').trim() !== subject);
    onChange([...others, ...topics.map((topic) => ({subject, topic}))]);
  };

  const addCustom = (subject: string) => {
    const topic = customText.trim();
    if (!topic) return;
    const chosen = linesOf(subject).map((t) => t.topic);
    if (!chosen.includes(topic)) setTopics(subject, [...chosen, topic]);
    setCustomFor(null);
    setCustomText('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={labelCls}>Syllabus — chapters per subject</span>
      </div>
      <Note>
        The four NEET sections are fixed at {NEET_SUBJECT_MARKS} marks each. Add as many chapters as this paper
        covers — pick from the syllabus list or type your own.
      </Note>

      {sections.map((subject) => {
        const chosen = linesOf(subject).map((t) => t.topic);
        const remaining = chapterOptions(subject, chosen).filter((c) => !chosen.includes(c));
        return (
          <div key={subject} className="bg-[#FFFFFF] border border-[#E4E6EB] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-[#5747D6]">
                {subject} <span className="text-neutral-500 font-medium">· {NEET_SUBJECT_MARKS} marks</span>
              </p>
              {chosen.length > 0 && <span className="text-[11px] text-neutral-500">{chosen.length} chapter(s)</span>}
            </div>

            {chosen.length === 0 && <p className="text-[11px] text-neutral-500">No chapters added yet.</p>}
            {linesOf(subject).map((line) => (
              <div key={line.topic} className="flex items-center gap-2">
                <span className="flex-1 text-[12px] text-neutral-700 truncate">{line.topic}</span>
                <button
                  type="button"
                  className={btnDanger}
                  aria-label={`Remove ${line.topic}`}
                  onClick={() => setTopics(subject, chosen.filter((c) => c !== line.topic))}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {customFor === subject ? (
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  aria-label={`Custom chapter in ${subject}`}
                  placeholder="Chapter name"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                />
                <button type="button" className={btnPrimary} onClick={() => addCustom(subject)}>
                  Add
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    setCustomFor(null);
                    setCustomText('');
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                className={inputCls}
                aria-label={`Add chapter to ${subject}`}
                value=""
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  if (value === '__custom__') {
                    setCustomFor(subject);
                    return;
                  }
                  setTopics(subject, [...chosen, value]);
                }}
              >
                <option value="">+ Add chapter…</option>
                {remaining.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="__custom__">Other (type yourself)</option>
              </select>
            )}
          </div>
        );
      })}

      {legacy.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#E4E6EB] rounded-lg p-2.5 space-y-2">
          <p className="text-[12px] font-bold text-neutral-500">Earlier free-text subjects</p>
          {legacy.map((line, i) => (
            <div key={`${line.subject}-${line.topic}-${i}`} className="flex items-center gap-2">
              <span className="flex-1 text-[12px] text-neutral-700 truncate">
                {line.subject || '—'} · {line.topic || '—'}
              </span>
              <button
                type="button"
                className={btnDanger}
                aria-label={`Remove ${line.topic}`}
                onClick={() => onChange(syllabus.filter((t) => t !== line))}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const BatchTestsPanel: React.FC<BatchTestsPanelProps> = ({backend, batch, flash}) => {
  const [tests, setTests] = useState<BatchTest[]>([]);
  const [resultCounts, setResultCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<BatchTest | null>(null);
  const [busy, setBusy] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await backend.listTests(batch.id);
      setTests(list);

      // Result counts so the list can show "12/30 marks entered" without the
      // admin opening every test. One read per test, all cached.
      const counts = await Promise.all(list.map((t) => backend.listResults(batch.id, t.id).then((r) => r.length)));
      setResultCounts(Object.fromEntries(list.map((t, i) => [t.id, counts[i]])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load tests.');
    } finally {
      setLoading(false);
    }
  }, [backend, batch.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      // Drop empty syllabus rows rather than persisting blank subjects.
      const syllabus = draft.syllabus.filter((t) => t.subject.trim() || t.topic.trim());
      await backend.saveTest(batch.id, {...draft, batchId: batch.id, title: draft.title.trim(), syllabus});
      flash(`Test "${draft.title.trim()}" saved.`);
      setDraft(null);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the test.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (test: BatchTest) => {
    setBusy(true);
    try {
      // Cascades: every result row under the test goes with it.
      await backend.deleteTest(batch.id, test.id);
      flash(`Test "${test.title}" deleted with its results.`);
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not delete the test.');
    } finally {
      setBusy(false);
    }
  };

  const opened = openedId ? tests.find((t) => t.id === openedId) : null;

  if (opened) {
    return (
      <TestResultsPanel
        backend={backend}
        batch={batch}
        test={opened}
        flash={flash}
        onBack={() => {
          setOpenedId(null);
          void load();
        }}
      />
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span className={labelCls}>
          Tests {tests.length > 0 && `(${tests.length})`}
        </span>
        <button type="button" className={btnGhost} onClick={() => void load()}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {error && (
        <p className="text-xs text-[#ff9bb3] leading-relaxed px-3 py-2.5 rounded-lg bg-[#FBE0E5] border border-[#F3C1CB]">
          {error}
        </p>
      )}

      {loading && <p className="text-xs text-neutral-500 text-center py-6">Loading…</p>}

      {!loading && tests.length === 0 && !draft && (
        <Note>
          No tests in this batch yet. A test created here belongs to the batch, so every allotted student gets a result
          row on it automatically.
        </Note>
      )}

      {!draft && (
        <button type="button" className={`${btnPrimary} w-full py-2.5`} onClick={() => setDraft(blankTest(tests))}>
          <Plus size={13} /> Create test
        </button>
      )}

      {draft && (
        <div className="bg-white border border-[#5747D6]/40 rounded-xl p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Title" htmlFor="test-title" className="col-span-2">
              <input
                id="test-title"
                className={inputCls}
                value={draft.title}
                placeholder="Major Test 4"
                onChange={(e) => setDraft({...draft, title: e.target.value})}
              />
            </Field>
            <Field label="Date" htmlFor="test-date">
              <input
                id="test-date"
                type="date"
                className={inputCls}
                value={draft.date}
                onChange={(e) => setDraft({...draft, date: e.target.value})}
              />
            </Field>
            <Field label="Total marks" htmlFor="test-marks">
              <input
                id="test-marks"
                className={inputCls}
                inputMode="numeric"
                value={draft.marksTotal}
                onChange={(e) => setDraft({...draft, marksTotal: Number(e.target.value) || 0})}
              />
            </Field>
            <Field label="Mode" htmlFor="test-mode">
              <select
                id="test-mode"
                className={inputCls}
                value={draft.mode}
                onChange={(e) => setDraft({...draft, mode: e.target.value as BatchTest['mode']})}
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </Field>
            <Field label="Paper" htmlFor="test-paper">
              <select
                id="test-paper"
                className={inputCls}
                value={draft.paperType ?? 'Objective'}
                onChange={(e) => setDraft({...draft, paperType: e.target.value as BatchTest['paperType']})}
              >
                <option value="Objective">Objective</option>
                <option value="Subjective">Subjective</option>
              </select>
            </Field>
            <Field label="Status" htmlFor="test-status">
              <select
                id="test-status"
                className={inputCls}
                value={draft.status}
                onChange={(e) => setDraft({...draft, status: e.target.value as BatchTest['status']})}
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
          </div>

          <SyllabusEditor
            syllabus={draft.syllabus}
            onChange={(syllabus) => setDraft({...draft, syllabus})}
            subjectType={subjectTypeOf(batch)}
          />

          <div className="flex gap-2">
            <button type="button" className={btnPrimary} disabled={busy || !draft.title.trim()} onClick={() => void save()}>
              <Save size={13} /> {busy ? 'Saving…' : 'Save test'}
            </button>
            <button type="button" className={btnGhost} disabled={busy} onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {tests.map((test) => {
        return (
          <div key={test.id} className="bg-white border border-[#E4E6EB] rounded-xl p-3.5">
            <button type="button" className="w-full flex items-center gap-3 text-left" onClick={() => setOpenedId(test.id)}>
              <div className="w-9 h-9 rounded-lg bg-[#5747D6]/15 border border-[#5747D6]/30 flex items-center justify-center shrink-0">
                <ClipboardList size={15} className="text-[#5747D6]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{test.title}</p>
                <p className="text-[11px] text-neutral-500 truncate">
                  {test.date} · {test.mode} · out of {test.marksTotal} · {test.status}
                </p>
              </div>
              <ChevronRight size={15} className="text-neutral-500 shrink-0" />
            </button>

            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#E4E6EB]">
              <p className="text-[11px] text-neutral-500">
                {(test.syllabus?.length ?? 0) > 0
                  ? `${test.syllabus.length} topic${test.syllabus.length === 1 ? '' : 's'}`
                  : 'No syllabus'}
                {' · '}
                <span className="text-neutral-700 font-semibold">{resultCounts[test.id] ?? 0}</span> results entered
              </p>
              <div className="flex gap-2 shrink-0">
                <button type="button" className={btnGhost} onClick={() => setDraft(test)}>
                  Edit
                </button>
                <button type="button" className={btnDanger} disabled={busy} onClick={() => void remove(test)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
