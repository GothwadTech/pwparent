/**
 * One batch test, opened up: every allotted student with their marks.
 *
 * The rows come from `listBatchStudents(batchId)` — the batch's membership —
 * NOT from the results that happen to exist. That distinction is the whole
 * point: a student with no marks entered yet still gets a row showing
 * "not entered", so nobody silently disappears from a test because the admin
 * has not typed their score yet.
 *
 * `scorePercent` is derived server-side in the backend from
 * marksObtained / test.marksTotal. It is never accepted from this form, for the
 * same reason `recomputeStudent()` recalculates the student scorecard: a
 * percentage must not be able to contradict the raw marks beside it.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ArrowLeft, ClipboardList, Save, Trash2} from 'lucide-react';
import type {Batch, BatchTest, StudentProfile, SyllabusTopic, TestResult} from '../../types';
import type {Backend} from '../../lib/backend';
import {scorePercentOf, syllabusWeightTotal} from '../../lib/backend';
import {btnDanger, btnGhost, btnPrimary, cardCls, inputCls, labelCls, Note} from './ui';

interface TestResultsPanelProps {
  backend: Backend;
  batch: Batch;
  test: BatchTest;
  flash: (message: string) => void;
  onBack: () => void;
}

/** Local edit state for one row, kept out of the saved result until Save. */
interface RowDraft {
  marks: string;
  /** Questions answered correctly. */
  correct: string;
  /** Questions actually attempted. Accuracy is derived from these two. */
  attempted: string;
  /** Marks per syllabus line, keyed `${subject}||${topic}`. */
  topics: Record<string, string>;
  status: 'ATTEMPTED' | 'MISSED';
}

const emptyDraft = (): RowDraft => ({marks: '', correct: '', attempted: '', topics: {}, status: 'ATTEMPTED'});

const draftFrom = (result: TestResult | undefined): RowDraft =>
  result
    ? {
        marks: result.marksObtained === undefined ? '' : String(result.marksObtained),
        correct: result.correctCount === undefined ? '' : String(result.correctCount),
        attempted: result.attemptedCount === undefined ? '' : String(result.attemptedCount),
        topics: Object.fromEntries(
          Object.entries(result.topicMarks ?? {}).map(([k, v]) => [k, String(v)]),
        ),
        status: result.status,
      }
    : emptyDraft();

const SyllabusList: React.FC<{syllabus: SyllabusTopic[]}> = ({syllabus}) => {
  if (syllabus.length === 0) return null;
  const total = syllabusWeightTotal(syllabus);

  // Group by subject so a paper reads as "Physics: these topics" rather than a
  // flat list with the subject repeated on every line.
  const bySubject = syllabus.reduce<Record<string, SyllabusTopic[]>>((acc, topic) => {
    const key = topic.subject?.trim() || 'General';
    acc[key] = [...(acc[key] ?? []), topic];
    return acc;
  }, {});

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between mb-2">
        <p className={`${labelCls} mb-0`}>Syllabus</p>
        {total > 0 && (
          <span className={`text-[11px] font-bold ${total === 100 ? 'text-[#8ff0b0]' : 'text-[#f0dc8f]'}`}>
            {total}% weight
          </span>
        )}
      </div>
      <div className="space-y-2">
        {Object.entries(bySubject).map(([subject, topics]) => (
          <div key={subject}>
            <p className="text-[11px] font-bold text-[#5747D6] uppercase tracking-wide">{subject}</p>
            <ul className="mt-1 space-y-0.5">
              {topics.map((topic, i) => (
                <li key={i} className="text-[12px] text-neutral-700 leading-relaxed flex justify-between gap-2">
                  <span>{topic.topic || '—'}</span>
                  {typeof topic.weightage === 'number' && (
                    <span className="text-neutral-500 shrink-0">{topic.weightage}%</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({backend, batch, test, flash, onBack}) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [saved, setSaved] = useState<Record<string, TestResult>>({});
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [batchStudents, results] = await Promise.all([
        backend.listBatchStudents(batch.id),
        backend.listResults(batch.id, test.id),
      ]);
      setStudents(batchStudents);

      const byId: Record<string, TestResult> = {};
      for (const result of results) byId[result.studentId] = result;
      setSaved(byId);
      setDrafts(Object.fromEntries(batchStudents.map((s) => [s.id, draftFrom(byId[s.id])])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load results.');
    } finally {
      setLoading(false);
    }
  }, [backend, batch.id, test.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const rows = Object.values(saved);
    const attempted = rows.filter((r) => r.status === 'ATTEMPTED' && typeof r.marksObtained === 'number');
    if (attempted.length === 0) return null;
    const scores = attempted.map((r) => r.scorePercent ?? scorePercentOf(r.marksObtained, test.marksTotal));
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const top = Math.max(...(attempted.map((r) => r.marksObtained ?? 0) as number[]));
    return {entered: rows.length, attempted: attempted.length, avg, top, total: students.length};
  }, [saved, students.length, test.marksTotal]);

  const patchDraft = (studentId: string, change: Partial<RowDraft>) =>
    setDrafts((prev) => ({...prev, [studentId]: {...(prev[studentId] ?? emptyDraft()), ...change}}));

  const saveRow = async (student: StudentProfile) => {
    const draft = drafts[student.id] ?? emptyDraft();
    setSavingId(student.id);
    setError('');
    try {
      const correct = draft.correct === '' ? undefined : Number(draft.correct);
      const attemptedCount = draft.attempted === '' ? undefined : Number(draft.attempted);
      const topicMarks: Record<string, number> = {};
      for (const [key, raw] of Object.entries(draft.topics)) {
        if (raw !== '') topicMarks[key] = Number(raw);
      }
      await backend.saveResult(batch.id, test.id, student.id, {
        studentName: student.name,
        marksObtained: draft.marks === '' ? undefined : Number(draft.marks),
        // Accuracy is DERIVED from correct/attempted, never typed.
        accuracyPercent:
          correct !== undefined && attemptedCount ? Math.round((correct / attemptedCount) * 10000) / 100 : undefined,
        correctCount: correct,
        attemptedCount,
        topicMarks: Object.keys(topicMarks).length > 0 ? topicMarks : undefined,
        status: draft.status,
      });
      const results = await backend.listResults(batch.id, test.id);

      // Rank / top score / class average need EVERY student's marks, which only
      // the administrator may read. So they are stamped here, once, from the real
      // entered marks — the parent's device never invents or derives them.
      const attempted = results.filter((r) => r.status === 'ATTEMPTED' && typeof r.marksObtained === 'number');
      const byId: Record<string, TestResult> = {};
      if (attempted.length > 0) {
        const top = Math.max(...attempted.map((r) => r.marksObtained ?? 0));
        const avg = Math.round(
          attempted.reduce((a, r) => a + (r.scorePercent ?? scorePercentOf(r.marksObtained ?? 0, test.marksTotal)), 0) /
            attempted.length,
        );
        const ordered = [...attempted].sort((a, b) => (b.marksObtained ?? 0) - (a.marksObtained ?? 0));
        for (const r of results) {
          const place = ordered.findIndex((o) => o.studentId === r.studentId);
          byId[r.studentId] = {...r, topScore: top, avgScore: avg, rank: place >= 0 ? place + 1 : undefined};
          if (r.status === 'ATTEMPTED') {
            await backend.saveResult(batch.id, test.id, r.studentId, {
              studentName: r.studentName,
              marksObtained: r.marksObtained,
              accuracyPercent: r.accuracyPercent,
              correctCount: r.correctCount,
              attemptedCount: r.attemptedCount,
              topicMarks: r.topicMarks,
              status: r.status,
              topScore: top,
              avgScore: avg,
              rank: place >= 0 ? place + 1 : undefined,
            });
          }
        }
      } else {
        for (const result of results) byId[result.studentId] = result;
      }
      setSaved(byId);
      flash(`Saved ${student.name}'s result.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the result.');
    } finally {
      setSavingId(null);
    }
  };

  const clearRow = async (student: StudentProfile) => {
    setSavingId(student.id);
    try {
      await backend.deleteResult(batch.id, test.id, student.id);
      setSaved((prev) => {
        const next = {...prev};
        delete next[student.id];
        return next;
      });
      patchDraft(student.id, emptyDraft());
      flash(`Cleared ${student.name}'s result.`);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : 'Could not clear the result.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <button type="button" className={btnGhost} onClick={onBack}>
        <ArrowLeft size={12} /> All tests
      </button>

      <div className={cardCls}>
        <p className="text-[11px] font-bold text-[#5747D6] flex items-center gap-1.5">
          <ClipboardList size={12} /> {batch.name}
        </p>
        <h3 className="text-base font-bold mt-1">{test.title}</h3>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          {test.date} · {test.mode} · out of {test.marksTotal} · {test.status}
        </p>
      </div>

      <SyllabusList syllabus={test.syllabus ?? []} />

      {summary && (
        <div className={`${cardCls} grid grid-cols-4 gap-2 text-center`}>
          {[
            {label: 'Entered', value: `${summary.entered}/${summary.total}`},
            {label: 'Attempted', value: summary.attempted},
            {label: 'Avg', value: `${summary.avg}%`},
            {label: 'Top', value: `${summary.top}/${test.marksTotal}`},
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-base font-bold">{stat.value}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-[#ff9bb3] leading-relaxed px-3 py-2.5 rounded-lg bg-[#2a1620] border border-[#4d2436]">
          {error}
        </p>
      )}

      {loading && <p className="text-xs text-neutral-500 text-center py-6">Loading…</p>}

      {!loading && students.length === 0 && (
        <Note>
          Nobody is allotted to <strong className="text-neutral-700">{batch.name}</strong>, so this test has no result
          rows. Allot students first — a test shows exactly the students in its batch, and nobody else.
        </Note>
      )}

      {!loading && students.length > 0 && (
        <span className={labelCls}>
          Results {summary ? `(${summary.entered}/${students.length} entered)` : `(none entered)`}
        </span>
      )}

      {students.map((student) => {
        const draft = drafts[student.id] ?? emptyDraft();
        const result = saved[student.id];
        const busyRow = savingId === student.id;
        const percent =
          draft.marks === '' ? null : scorePercentOf(Number(draft.marks), test.marksTotal);

        return (
          <div key={student.id} className="bg-white border border-[#E4E6EB] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{student.name || '(unnamed)'}</p>
                <p className="text-[11px] text-neutral-500 truncate">
                  {result ? `Saved · ${result.scorePercent ?? 0}%` : 'Not entered yet'}
                </p>
              </div>
              {percent !== null && (
                <span
                  className={`text-sm font-bold shrink-0 ${
                    percent >= 75 ? 'text-[#8ff0b0]' : percent >= 40 ? 'text-[#f0dc8f]' : 'text-[#ff9b9b]'
                  }`}
                >
                  {percent}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                className={inputCls}
                aria-label={`Marks obtained by ${student.name}`}
                inputMode="numeric"
                placeholder={`/${test.marksTotal}`}
                value={draft.marks}
                disabled={busyRow}
                onChange={(e) =>
                  patchDraft(student.id, {
                    marks: e.target.value.replace(/[^\d.]/g, '').slice(0, 6),
                    status: e.target.value === '' ? draft.status : 'ATTEMPTED',
                  })
                }
              />
              <input
                className={inputCls}
                aria-label={`Correct count for ${student.name}`}
                inputMode="numeric"
                placeholder="Correct"
                value={draft.correct}
                disabled={busyRow}
                onChange={(e) =>
                  patchDraft(student.id, {correct: e.target.value.replace(/[^\d]/g, '').slice(0, 4)})
                }
              />
              <input
                className={inputCls}
                aria-label={`Attempted count for ${student.name}`}
                inputMode="numeric"
                placeholder="Attempted"
                value={draft.attempted}
                disabled={busyRow}
                onChange={(e) =>
                  patchDraft(student.id, {attempted: e.target.value.replace(/[^\d]/g, '').slice(0, 4)})
                }
              />
              <select
                className={inputCls}
                aria-label={`Status for ${student.name}`}
                value={draft.status}
                disabled={busyRow}
                onChange={(e) => patchDraft(student.id, {status: e.target.value as RowDraft['status']})}
              >
                <option value="ATTEMPTED">Attempted</option>
                <option value="MISSED">Missed</option>
              </select>
            </div>

            {/* Per-topic marks, in the test's own syllabus order. The subject-wise
                accordion on the parent's detail screen sums these. */}
            {(test.syllabus ?? []).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-neutral-500">Topic-wise marks</p>
                {(test.syllabus ?? []).map((line) => {
                  const key = `${line.subject}||${line.topic}`;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="flex-1 text-[11px] text-neutral-500 truncate">
                        {line.subject} · {line.topic}
                      </span>
                      <input
                        className={inputCls}
                        aria-label={`Marks for ${line.topic}`}
                        inputMode="numeric"
                        placeholder="0"
                        value={draft.topics[key] ?? ''}
                        disabled={busyRow}
                        onChange={(e) =>
                          patchDraft(student.id, {
                            topics: {...draft.topics, [key]: e.target.value.replace(/[^\d.]/g, '').slice(0, 5)},
                          })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" className={btnPrimary} disabled={busyRow} onClick={() => void saveRow(student)}>
                <Save size={12} /> {busyRow ? 'Saving…' : 'Save'}
              </button>
              {result && (
                <button type="button" className={btnDanger} disabled={busyRow} onClick={() => void clearRow(student)}>
                  <Trash2 size={12} /> Clear
                </button>
              )}
            </div>
          </div>
        );
      })}

      {!loading && students.length > 0 && (
        <Note>
          Percentages are computed from the raw marks and this test&apos;s total ({test.marksTotal}) — they cannot be
          typed. Accuracy is derived from Correct ÷ Attempted. Rank, top score and the class average are stamped onto
          every attempted result automatically when you save, because only the administrator can see the whole class.
        </Note>
      )}
    </>
  );
};
