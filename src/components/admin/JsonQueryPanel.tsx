/**
 * The admin's JSON query runner — the fast path next to the forms.
 *
 * Paste a query in the shape of docs/video-extracted-test-data.md and run it:
 * every test in it is created or UPDATED in this batch (titles match), and if a
 * student is chosen, their result for each test is written the same way. One
 * run replaces minutes of form-filling; re-running a corrected query updates
 * instead of duplicating.
 */
import React, {useEffect, useState} from 'react';
import {Braces, Play} from 'lucide-react';
import type {Batch, StudentProfile} from '../../types';
import type {Backend} from '../../lib/backend';
import {newBatchTestId} from '../../lib/backend';
import {
  buildResultFromQuery,
  buildTestFromQuery,
  findByTitle,
  parseJsonQuery,
} from '../../lib/jsonQuery';
import {btnGhost, btnPrimary, cardCls, inputCls, labelCls, Note} from './ui';

interface JsonQueryPanelProps {
  backend: Backend;
  batch: Batch;
  flash: (message: string) => void;
}

const PLACEHOLDER = `{
  "tests": [
    {
      "title": "Milestone:9",
      "date": "2026-11-15",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 512,
      "marksTotal": 720,
      "rank": 340,
      "accuracyPercent": 97.4,
      "correctCount": 141,
      "topScore": 701,
      "avgScore": 322.5,
      "subjects": [
        {"subject": "Physics", "obtained": 132, "chapters": [
          {"chapter": "Wave Optics", "marks": 66},
          {"chapter": "Nuclei", "marks": 66}
        ]},
        {"subject": "Botany", "obtained": 180}
      ]
    }
  ]
}`;

export const JsonQueryPanel: React.FC<JsonQueryPanelProps> = ({backend, batch, flash}) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [studentId, setStudentId] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState('');

  useEffect(() => {
    let alive = true;
    backend
      .listBatchStudents(batch.id)
      .then((rows) => {
        if (alive) setStudents(rows);
      })
      .catch(() => {
        if (alive) setStudents([]);
      });
    return () => {
      alive = false;
    };
  }, [backend, batch.id]);

  const run = async () => {
    setBusy(true);
    setError('');
    setReport('');
    try {
      const payload = parseJsonQuery(text);
      const existing = await backend.listTests(batch.id);
      const student = students.find((s) => s.id === studentId);
      let created = 0;
      let updated = 0;
      let results = 0;
      for (const queried of payload.tests) {
        const match = findByTitle(existing, queried.title);
        const test = buildTestFromQuery(match, queried, newBatchTestId(existing));
        test.batchId = batch.id;
        await backend.saveTest(batch.id, test);
        if (match) updated += 1;
        else created += 1;
        if (!match) existing.push(test);
        if (student) {
          const result = buildResultFromQuery(test, queried, student);
          if (result) {
            await backend.saveResult(batch.id, test.id, student.id, result);
            results += 1;
          }
        }
      }
      const line = `${created} test created, ${updated} updated${
        student ? `, ${results} result(s) for ${student.name}` : ' (no student chosen — tests only)'
      }.`;
      setReport(line);
      flash(line);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'JSON parse nahi hua.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className={cardCls}>
        <p className={`${labelCls} mb-1 flex items-center gap-1.5`}>
          <Braces size={13} /> JSON query — tests + results in one run
        </p>
        <Note>
          UI ek time pe ek test banata hai; query poori list ek second me upsert kar deti hai. Title match ho to
          existing test UPDATE hota hai (id wahi rehti hai), naya title create hota hai. Student chuno to uske marks,
          rank, accuracy aur chapter-wise marks bhi likh jaate hain. Shape: docs/video-extracted-test-data.md.
        </Note>

        <label className={`${labelCls} block mt-2`} htmlFor="json-query-student">
          Result kis student ke likhe jayein?
        </label>
        <select
          id="json-query-student"
          className={inputCls}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">Sirf tests — koi result nahi</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.id}
            </option>
          ))}
        </select>

        <textarea
          className={`${inputCls} mt-2 font-mono text-[11px] leading-relaxed`}
          rows={12}
          aria-label="JSON query"
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex gap-2 mt-2">
          <button type="button" className={btnPrimary} disabled={busy || !text.trim()} onClick={() => void run()}>
            <Play size={12} /> {busy ? 'Running…' : 'Run query'}
          </button>
          <button type="button" className={btnGhost} disabled={busy} onClick={() => setText(PLACEHOLDER)}>
            Sample bharo
          </button>
        </div>

        {error && <p className="text-[12px] font-bold text-[#B91C1C] mt-2">{error}</p>}
        {report && <p className="text-[12px] font-bold text-[#15803D] mt-2">{report}</p>}
      </div>
    </div>
  );
};
