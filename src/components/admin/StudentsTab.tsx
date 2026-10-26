/**
 * Admin → Students tab.
 *
 * Edits the academic record. Derived figures (testsCompleted, avgScorePercent,
 * accuracyPercent, per-test scorePercent) are NOT editable — `recomputeStudent`
 * recalculates them from raw marks on every save, so the scorecard can never
 * contradict itself. See src/lib/admin.ts.
 */
import React, {useState} from 'react';
import {Plus, Save, Trash2} from 'lucide-react';
import type {StudentProfile, TestRecord} from '../../types';
import {newTestId, normalizePercentText, recomputeStudent} from '../../lib/admin';
import {btnDanger, btnGhost, btnPrimary, Field, inputCls, labelCls, Note} from './ui';

interface StudentsTabProps {
  students: StudentProfile[];
  onSaveStudent: (student: StudentProfile) => void;
  onDeleteStudent: (studentId: string) => void;
  flash: (message: string) => void;
}

function blankStudent(): StudentProfile {
  return {
    id: `s${Date.now().toString(36)}`,
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

const StudentCard: React.FC<{
  student: StudentProfile;
  isOpen: boolean;
  onToggle: () => void;
  onSave: (student: StudentProfile) => void;
  onDelete: (studentId: string) => void;
}> = ({student, isOpen, onToggle, onSave, onDelete}) => {
  const patch = (change: Partial<StudentProfile>) => onSave({...student, ...change});

  const patchTest = (testId: string, change: Partial<TestRecord>) =>
    onSave({...student, tests: (student.tests ?? []).map((t) => (t.id === testId ? {...t, ...change} : t))});

  const addTest = () => {
    const tests = student.tests ?? [];
    onSave({
      ...student,
      tests: [
        ...tests,
        {
          id: newTestId(tests),
          title: `Test ${tests.length + 1}`,
          date: new Date().toLocaleDateString('en-GB'),
          mode: 'Online',
          status: 'MISSED',
          marksTotal: 300,
        },
      ],
    });
  };

  const removeTest = (testId: string) =>
    onSave({...student, tests: (student.tests ?? []).filter((t) => t.id !== testId)});

  const sid = student.id;

  return (
    <div className="bg-[#11121c] border border-[#262838] rounded-xl overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-white/[0.02]">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{student.name || '(unnamed)'}</p>
          <p className="text-[11px] text-neutral-500 truncate">
            {[student.course, `${student.attendance} attendance`, `${student.testsCompleted}/${student.testsTotal ?? (student.tests?.length ?? 0)} tests`]
              .filter(Boolean)
              .join(' · ') || 'No details yet'}
          </p>
        </div>
        <span className="text-[10px] font-bold text-[#8E75FF]">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div className="px-3.5 pb-4 space-y-4 border-t border-[#1e202e] pt-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Name" htmlFor={`name-${sid}`}>
              <input id={`name-${sid}`} className={inputCls} value={student.name} onChange={(e) => patch({name: e.target.value})} />
            </Field>
            <Field label="Batch" htmlFor={`batch-${sid}`}>
              <input id={`batch-${sid}`} className={inputCls} value={student.batch} onChange={(e) => patch({batch: e.target.value})} />
            </Field>
          </div>

          <Field label="Course" htmlFor={`course-${sid}`}>
            <input id={`course-${sid}`} className={inputCls} value={student.course} onChange={(e) => patch({course: e.target.value})} />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Attendance %" htmlFor={`att-${sid}`}>
              <input
                id={`att-${sid}`}
                className={inputCls}
                inputMode="numeric"
                value={student.attendance}
                onChange={(e) => patch({attendance: normalizePercentText(e.target.value)})}
              />
            </Field>
            <Field label="Video watch %" htmlFor={`vid-${sid}`}>
              <input
                id={`vid-${sid}`}
                className={inputCls}
                inputMode="numeric"
                value={student.videoWatchRate}
                onChange={(e) => patch({videoWatchRate: normalizePercentText(e.target.value)})}
              />
            </Field>
            <Field label="DPPs done" htmlFor={`dpp-${sid}`}>
              <input
                id={`dpp-${sid}`}
                className={inputCls}
                inputMode="numeric"
                value={student.dppsDone}
                onChange={(e) => patch({dppsDone: Number(e.target.value) || 0})}
              />
            </Field>
            <Field label="Total tests" htmlFor={`tot-${sid}`}>
              <input
                id={`tot-${sid}`}
                className={inputCls}
                inputMode="numeric"
                value={student.testsTotal ?? 0}
                onChange={(e) => patch({testsTotal: Number(e.target.value) || 0})}
              />
            </Field>
          </div>

          <Note>
            Tests attempted, avg. score and accuracy are derived from the test list below on every save — they
            cannot be typed directly.
          </Note>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={labelCls}>Test records</span>
              <button type="button" className={btnGhost} onClick={addTest}>
                <Plus size={12} /> Add test
              </button>
            </div>

            {(student.tests ?? []).map((test) => (
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
                  <span className="text-[10px] text-neutral-500">
                    Score: {test.scorePercent ?? 0}% · {test.id}
                  </span>
                  <button type="button" className={btnDanger} onClick={() => removeTest(test.id)} aria-label={`Delete ${test.title}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" className={btnPrimary} onClick={() => onSave(student)}>
              <Save size={13} /> Save student
            </button>
            <button type="button" className={btnDanger} onClick={() => onDelete(sid)}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentsTab: React.FC<StudentsTabProps> = ({students, onSaveStudent, onDeleteStudent, flash}) => {
  const [expanded, setExpanded] = useState<string | null>(students[0]?.id ?? null);

  const persist = (student: StudentProfile) => {
    onSaveStudent(recomputeStudent(student));
  };

  return (
    <>
      <button
        type="button"
        className={`${btnGhost} w-full`}
        onClick={() => {
          const student = blankStudent();
          onSaveStudent(student);
          setExpanded(student.id);
          flash('New student added — fill in the details and save.');
        }}
      >
        <Plus size={13} /> Add student
      </button>

      {students.length === 0 && (
        <Note>No students yet. Add one above.</Note>
      )}

      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          isOpen={expanded === student.id}
          onToggle={() => setExpanded(expanded === student.id ? null : student.id)}
          onSave={persist}
          onDelete={(id) => {
            onDeleteStudent(id);
            setExpanded(null);
            flash('Student deleted.');
          }}
        />
      ))}
    </>
  );
};
