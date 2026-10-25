/**
 * Admin Panel — seed and edit the demo academic record.
 *
 * Passcode-gated (see src/lib/admin.ts for the honest limitation: a passcode
 * inlined into a client bundle stops casual visitors, not a determined one).
 *
 * Everything written here goes through the Backend facade, so in mock mode it
 * lands in localStorage and in firebase mode it lands in
 * `parents/{uid}/children/{childId}`.
 */
import React, {useState} from 'react';
import {
  ArrowLeft,
  Database,
  Lock,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import type {AnnouncementItem, StudentProfile, TestRecord} from '../types';
import {
  isAdminUnlocked,
  lockAdmin,
  newTestId,
  normalizePercentText,
  recomputeStudent,
  unlockAdmin,
} from '../lib/admin';
import {ADMIN_PASSCODE} from '../lib/config';

type TabId = 'students' | 'announcements' | 'data';

interface AdminPanelScreenProps {
  mode: 'mock' | 'firebase';
  uid: string | null;
  students: StudentProfile[];
  announcements: AnnouncementItem[];
  onSaveStudent: (student: StudentProfile) => void;
  onDeleteStudent: (studentId: string) => void;
  onSaveAnnouncement: (item: AnnouncementItem) => void;
  onDeleteAnnouncement: (id: string) => void;
  onSeedDemoData: () => void;
  onResetLocalData: () => void;
  onBack: () => void;
}

const inputCls =
  'w-full bg-[#11121c] border border-[#262838] rounded-lg px-3 py-2 text-sm text-white ' +
  'outline-none focus:border-[#8E75FF] focus:ring-1 focus:ring-[#8E75FF]/40 transition-colors';

const labelCls = 'block text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1.5';

const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#8E75FF] ' +
  'hover:bg-[#7d62fc] text-white text-xs font-semibold transition-colors';

const btnGhost =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#181926] ' +
  'hover:bg-[#222436] border border-[#2f3246] text-neutral-300 text-xs font-semibold transition-colors';

const btnDanger =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#2a1620] ' +
  'hover:bg-[#3a1d2b] border border-[#4d2436] text-[#ff9bb3] text-xs font-semibold transition-colors';

function blankStudent(): StudentProfile {
  return {
    id: `s${Date.now().toString(36)}`,
    name: '',
    batch: 'Career Pass',
    course: 'Lakshya Batch 2026',
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

function blankAnnouncement(): AnnouncementItem {
  return {
    id: `a${Date.now().toString(36)}`,
    author: 'PW Academics',
    timeAgo: 'just now',
    isNew: true,
    content: '',
    videoLink: '',
  };
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  mode,
  uid,
  students,
  announcements,
  onSaveStudent,
  onDeleteStudent,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onSeedDemoData,
  onResetLocalData,
  onBack,
}) => {
  const [unlocked, setUnlocked] = useState(isAdminUnlocked());
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabId>('students');
  const [expanded, setExpanded] = useState<string | null>(students[0]?.id ?? null);
  const [draftAnnouncement, setDraftAnnouncement] = useState<AnnouncementItem | null>(null);
  const [notice, setNotice] = useState('');

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockAdmin(passcode)) {
      setUnlocked(true);
      setError('');
    } else {
      setError('Incorrect passcode.');
    }
  };

  const handleLock = () => {
    lockAdmin();
    setUnlocked(false);
    setPasscode('');
  };

  const persistStudent = (student: StudentProfile) => {
    onSaveStudent(recomputeStudent(student));
    flash(`Saved ${student.name || student.id} — derived stats recomputed.`);
  };

  const patchStudent = (id: string, patch: Partial<StudentProfile>) => {
    const target = students.find((s) => s.id === id);
    if (!target) return;
    persistStudent({...target, ...patch});
  };

  const patchTest = (student: StudentProfile, testId: string, patch: Partial<TestRecord>) => {
    const tests = (student.tests ?? []).map((t) => (t.id === testId ? {...t, ...patch} : t));
    persistStudent({...student, tests});
  };

  const addTest = (student: StudentProfile) => {
    const tests = student.tests ?? [];
    const nextNumber = tests.length + 1;
    const test: TestRecord = {
      id: newTestId(tests),
      title: `MISSION 30 : Test ${nextNumber}`,
      date: new Date().toLocaleDateString('en-GB'),
      mode: 'Online',
      status: 'MISSED',
      marksTotal: 300,
    };
    persistStudent({...student, tests: [...tests, test]});
  };

  const removeTest = (student: StudentProfile, testId: string) => {
    persistStudent({...student, tests: (student.tests ?? []).filter((t) => t.id !== testId)});
  };

  // ── Passcode gate ────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="w-full h-full bg-[#0a0b10] text-white flex flex-col select-none">
        <header className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-[#1c1d29]">
          <button type="button" onClick={onBack} aria-label="Back" className="p-1.5 rounded-lg hover:bg-white/5">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-bold">Admin Panel</h1>
        </header>

        <form onSubmit={handleUnlock} className="flex-1 px-5 py-8 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-xs flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#8E75FF]/15 border border-[#8E75FF]/30 flex items-center justify-center mb-4">
              <Lock size={22} className="text-[#8E75FF]" />
            </div>
            <h2 className="text-lg font-bold">Restricted area</h2>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Enter the admin passcode to edit the demo academic record.
            </p>

            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              autoFocus
              className={`${inputCls} mt-6 text-center tracking-[0.3em]`}
            />
            {error && <p className="mt-2 text-xs text-[#ff9bb3]">{error}</p>}

            <button type="submit" className={`${btnPrimary} w-full mt-4 py-3 text-sm`}>
              Unlock
            </button>

            <p className="mt-6 text-[11px] text-neutral-600 leading-relaxed">
              Default passcode is <code className="text-neutral-400">{ADMIN_PASSCODE}</code>. Change it with{' '}
              <code className="text-neutral-400">VITE_ADMIN_PASSCODE</code>.
              <br />
              <span className="text-neutral-500">
                This is a client-side gate — it is not real authorisation. See docs/ADMIN_PANEL.md.
              </span>
            </p>
          </div>
        </form>
      </div>
    );
  }

  // ── Panel ────────────────────────────────────────────────────────────────
  const tabs: {id: TabId; label: string; icon: React.ReactNode}[] = [
    {id: 'students', label: 'Students', icon: <Users size={14} />},
    {id: 'announcements', label: 'Announcements', icon: <Megaphone size={14} />},
    {id: 'data', label: 'Data', icon: <Database size={14} />},
  ];

  return (
    <div className="w-full h-full bg-[#0a0b10] text-white flex flex-col select-none">
      <header className="shrink-0 border-b border-[#1c1d29]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={onBack} aria-label="Back" className="p-1.5 rounded-lg hover:bg-white/5">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight">Admin Panel</h1>
            <p className="text-[11px] text-neutral-500 truncate">
              {mode === 'firebase' ? `Firestore · uid ${uid ?? '—'}` : 'Demo store · localStorage'}
            </p>
          </div>
          <button type="button" onClick={handleLock} className={btnGhost} aria-label="Lock admin panel">
            <Lock size={13} /> Lock
          </button>
        </div>

        <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-[#8E75FF] text-white' : 'bg-[#181926] text-neutral-400 hover:text-white'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {notice && (
        <div className="shrink-0 px-4 py-2 bg-[#132a1c] border-b border-[#1f4a2e] text-[11px] text-[#8ff0b0]">
          {notice}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {/* ── Students ───────────────────────────────────────────────────── */}
        {tab === 'students' && (
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
              <p className="text-xs text-neutral-500 text-center py-8">
                No students yet. Add one, or use Data → Seed demo data.
              </p>
            )}

            {students.map((student) => {
              const isOpen = expanded === student.id;
              return (
                <div key={student.id} className="bg-[#11121c] border border-[#262838] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : student.id)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-white/[0.02]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{student.name || '(unnamed)'}</p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {student.course} · {student.attendance} attendance ·{' '}
                        {student.testsCompleted}/{student.testsTotal ?? (student.tests?.length ?? 0)} tests
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-[#8E75FF]">{isOpen ? '−' : '+'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-3.5 pb-4 space-y-4 border-t border-[#1e202e] pt-3.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className={labelCls} htmlFor={`name-${student.id}`}>Name</label>
                          <input
                            id={`name-${student.id}`}
                            className={inputCls}
                            value={student.name}
                            onChange={(e) => patchStudent(student.id, {name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className={labelCls} htmlFor={`batch-${student.id}`}>Batch</label>
                          <input
                            id={`batch-${student.id}`}
                            className={inputCls}
                            value={student.batch}
                            onChange={(e) => patchStudent(student.id, {batch: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls} htmlFor={`course-${student.id}`}>Course</label>
                        <input
                          id={`course-${student.id}`}
                          className={inputCls}
                          value={student.course}
                          onChange={(e) => patchStudent(student.id, {course: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className={labelCls} htmlFor={`att-${student.id}`}>Attendance %</label>
                          <input
                            id={`att-${student.id}`}
                            className={inputCls}
                            inputMode="numeric"
                            value={student.attendance}
                            onChange={(e) => patchStudent(student.id, {attendance: normalizePercentText(e.target.value)})}
                          />
                        </div>
                        <div>
                          <label className={labelCls} htmlFor={`vid-${student.id}`}>Video watch %</label>
                          <input
                            id={`vid-${student.id}`}
                            className={inputCls}
                            inputMode="numeric"
                            value={student.videoWatchRate}
                            onChange={(e) =>
                              patchStudent(student.id, {videoWatchRate: normalizePercentText(e.target.value)})
                            }
                          />
                        </div>
                        <div>
                          <label className={labelCls} htmlFor={`dpp-${student.id}`}>DPPs done</label>
                          <input
                            id={`dpp-${student.id}`}
                            className={inputCls}
                            inputMode="numeric"
                            value={student.dppsDone}
                            onChange={(e) => patchStudent(student.id, {dppsDone: Number(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <label className={labelCls} htmlFor={`tot-${student.id}`}>Total tests</label>
                          <input
                            id={`tot-${student.id}`}
                            className={inputCls}
                            inputMode="numeric"
                            value={student.testsTotal ?? 0}
                            onChange={(e) => patchStudent(student.id, {testsTotal: Number(e.target.value) || 0})}
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        Tests attempted, avg. score and accuracy are{' '}
                        <span className="text-neutral-300">derived from the test list below</span> on every save —
                        you cannot set them directly, so the scorecard can never contradict itself.
                      </p>

                      {/* ── Test records ── */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={labelCls}>Test records</span>
                          <button type="button" className={btnGhost} onClick={() => addTest(student)}>
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
                                onChange={(e) => patchTest(student, test.id, {title: e.target.value})}
                              />
                              <input
                                className={inputCls}
                                aria-label="Test date"
                                value={test.date}
                                onChange={(e) => patchTest(student, test.id, {date: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                className={inputCls}
                                aria-label="Test mode"
                                value={test.mode}
                                onChange={(e) =>
                                  patchTest(student, test.id, {mode: e.target.value as TestRecord['mode']})
                                }
                              >
                                <option value="Online">Online</option>
                                <option value="Offline">Offline</option>
                              </select>
                              <select
                                className={inputCls}
                                aria-label="Test status"
                                value={test.status}
                                onChange={(e) =>
                                  patchTest(student, test.id, {status: e.target.value as TestRecord['status']})
                                }
                              >
                                <option value="ATTEMPTED">Attempted</option>
                                <option value="MISSED">Missed</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <input
                                  className={inputCls}
                                  aria-label="Marks obtained"
                                  inputMode="numeric"
                                  value={test.marksObtained ?? ''}
                                  placeholder="Marks"
                                  onChange={(e) =>
                                    patchTest(student, test.id, {
                                      marksObtained: e.target.value === '' ? undefined : Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <input
                                  className={inputCls}
                                  aria-label="Marks total"
                                  inputMode="numeric"
                                  value={test.marksTotal ?? ''}
                                  placeholder="Out of"
                                  onChange={(e) =>
                                    patchTest(student, test.id, {
                                      marksTotal: e.target.value === '' ? undefined : Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <input
                                  className={inputCls}
                                  aria-label="Accuracy percent"
                                  inputMode="numeric"
                                  value={test.accuracyPercent ?? ''}
                                  placeholder="Acc %"
                                  onChange={(e) =>
                                    patchTest(student, test.id, {
                                      accuracyPercent: e.target.value === '' ? undefined : Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-[10px] text-neutral-500">
                                Score: {test.scorePercent ?? 0}% · {test.id}
                              </span>
                              <button
                                type="button"
                                className={btnDanger}
                                onClick={() => removeTest(student, test.id)}
                                aria-label={`Delete ${test.title}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button type="button" className={btnPrimary} onClick={() => persistStudent(student)}>
                          <Save size={13} /> Save student
                        </button>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() => {
                            onDeleteStudent(student.id);
                            setExpanded(null);
                            flash('Student deleted.');
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── Announcements ──────────────────────────────────────────────── */}
        {tab === 'announcements' && (
          <>
            <button
              type="button"
              className={`${btnGhost} w-full`}
              onClick={() => setDraftAnnouncement(blankAnnouncement())}
            >
              <Plus size={13} /> New announcement
            </button>

            {draftAnnouncement && (
              <div className="bg-[#11121c] border border-[#8E75FF]/40 rounded-xl p-3.5 space-y-2.5">
                <div>
                  <label className={labelCls} htmlFor="ann-author">Author</label>
                  <input
                    id="ann-author"
                    className={inputCls}
                    value={draftAnnouncement.author}
                    onChange={(e) => setDraftAnnouncement({...draftAnnouncement, author: e.target.value})}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="ann-content">Content</label>
                  <textarea
                    id="ann-content"
                    rows={3}
                    className={inputCls}
                    value={draftAnnouncement.content}
                    onChange={(e) => setDraftAnnouncement({...draftAnnouncement, content: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={labelCls} htmlFor="ann-time">Time label</label>
                    <input
                      id="ann-time"
                      className={inputCls}
                      value={draftAnnouncement.timeAgo}
                      onChange={(e) => setDraftAnnouncement({...draftAnnouncement, timeAgo: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="ann-link">Video link</label>
                    <input
                      id="ann-link"
                      className={inputCls}
                      value={draftAnnouncement.videoLink}
                      onChange={(e) => setDraftAnnouncement({...draftAnnouncement, videoLink: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => {
                      onSaveAnnouncement(draftAnnouncement);
                      setDraftAnnouncement(null);
                      flash('Announcement saved.');
                    }}
                  >
                    <Save size={13} /> Publish
                  </button>
                  <button type="button" className={btnGhost} onClick={() => setDraftAnnouncement(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {announcements.map((item) => (
              <div key={item.id} className="bg-[#11121c] border border-[#262838] rounded-xl p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{item.author}</p>
                    <p className="text-[11px] text-neutral-500">{item.timeAgo}</p>
                  </div>
                  <button
                    type="button"
                    className={btnDanger}
                    onClick={() => {
                      onDeleteAnnouncement(item.id);
                      flash('Announcement deleted.');
                    }}
                    aria-label="Delete announcement"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="mt-2 text-[12px] text-neutral-300 leading-relaxed">{item.content}</p>
              </div>
            ))}
          </>
        )}

        {/* ── Data ───────────────────────────────────────────────────────── */}
        {tab === 'data' && (
          <div className="space-y-3">
            <div className="bg-[#11121c] border border-[#262838] rounded-xl p-3.5 space-y-2">
              <p className={labelCls}>Backend</p>
              <dl className="text-xs space-y-1.5">
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Mode</dt>
                  <dd className="font-semibold">{mode}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">uid</dt>
                  <dd className="font-mono text-[11px] truncate max-w-[60%]">{uid ?? '— (not signed in)'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Students</dt>
                  <dd className="font-semibold">{students.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Announcements</dt>
                  <dd className="font-semibold">{announcements.length}</dd>
                </div>
              </dl>
            </div>

            <button type="button" className={`${btnPrimary} w-full py-3`} onClick={onSeedDemoData}>
              <RefreshCw size={14} /> Seed demo data
            </button>
            <p className="text-[11px] text-neutral-500 leading-relaxed -mt-1">
              Wipes the current dataset and rewrites the demo seed. In Firestore mode this replaces{' '}
              <code>parents/{'{uid}'}/children</code>, <code>.../purchases</code> and <code>announcements</code>{' '}
              atomically.
            </p>

            {mode === 'mock' && (
              <>
                <button type="button" className={`${btnDanger} w-full py-3`} onClick={onResetLocalData}>
                  <Trash2 size={14} /> Clear local demo store
                </button>
                <p className="text-[11px] text-neutral-500 leading-relaxed -mt-1">
                  Removes everything saved in this browser. Reload to start from the shipped seed.
                </p>
              </>
            )}

            <div className="bg-[#1a1710] border border-[#3d3419] rounded-xl p-3.5">
              <p className={labelCls}>Demo build notice</p>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                This is a demonstration project, not the official Physics Wallah Parent&apos;s App. The OTP step
                sends no SMS and verifies nothing — the phone number is stored as a profile field, and identity
                comes from an anonymous Firebase session. Academic records shown here are editable sample data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
