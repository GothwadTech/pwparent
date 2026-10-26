/**
 * Batch → Students panel: who is allotted to this batch.
 *
 * Membership is stored as ONE document per PARENT uid
 * (`batches/{id}/members/{parentUid}` → `studentIds[]`) rather than one per
 * student. Two reasons:
 *
 *   • the security rules answer "may this caller read this batch?" with a
 *     single `exists()` on that document — no query, no scan;
 *   • a parent may have several children in the same batch, and allotting them
 *     together is one write instead of N.
 *
 * The picker lists every student belonging to every parent, which is why it
 * needs the owner uid alongside each name (`AllotableStudent`).
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Plus, RefreshCw, Search, Trash2, UserCheck, Users} from 'lucide-react';
import type {AllotableStudent, Batch} from '../../types';
import type {Backend} from '../../lib/backend';
import {btnDanger, btnGhost, btnPrimary, inputCls, labelCls, Note} from './ui';

interface BatchMembersPanelProps {
  backend: Backend;
  batch: Batch;
  flash: (message: string) => void;
}

interface MemberRow {
  parentUid: string;
  students: AllotableStudent[];
  joinedAt: string;
}

export const BatchMembersPanel: React.FC<BatchMembersPanelProps> = ({backend, batch, flash}) => {
  const [pool, setPool] = useState<AllotableStudent[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allStudents, batchStudents, memberDocs] = await Promise.all([
        backend.listAllStudents(),
        backend.listBatchStudents(batch.id),
        backend.listBatchMembers(batch.id),
      ]);

      setPool(allStudents);
      setMembers(
        memberDocs.map((doc) => ({
          parentUid: doc.parentUid,
          joinedAt: doc.joinedAt,
          students: (doc.studentIds ?? [])
            .map((id) => {
              const found = allStudents.find((s) => s.id === id && s.parentUid === doc.parentUid);
              return found ?? batchStudents.find((s) => s.id === id);
              // Falls back to the batch's own student list so an allotment still
              // renders even if the wider `listAllStudents` query was denied.
            })
            .filter((s): s is AllotableStudent => Boolean(s))
            .map((s) => ({...s, parentUid: s.parentUid || doc.parentUid})),
        })),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load batch members.');
    } finally {
      setLoading(false);
    }
  }, [backend, batch.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const allottedIds = useMemo(
    () => new Set(members.flatMap((m) => m.students.map((s) => `${m.parentUid}:${s.id}`))),
    [members],
  );

  const candidates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return pool
      .filter((s) => !allottedIds.has(`${s.parentUid}:${s.id}`))
      .filter((s) => !needle || s.name.toLowerCase().includes(needle) || (s.course ?? '').toLowerCase().includes(needle))
      .slice(0, 60);
  }, [pool, allottedIds, query]);

  /** Allotment is written per parent uid, so picked students are grouped first. */
  const commitAllotments = async () => {
    setBusy(true);
    try {
      const byParent = new Map<string, string[]>();
      for (const key of picked) {
        const [parentUid, studentId] = key.split(':');
        byParent.set(parentUid, [...(byParent.get(parentUid) ?? []), studentId]);
      }

      for (const [parentUid, newIds] of byParent) {
        // Merge with whatever that parent already has allotted in this batch,
        // so allotting a second child does not drop the first.
        const existing = members.find((m) => m.parentUid === parentUid)?.students.map((s) => s.id) ?? [];
        await backend.allotStudents(batch.id, parentUid, [...new Set([...existing, ...newIds])]);
      }

      flash(`Allotted ${picked.size} student${picked.size === 1 ? '' : 's'} to ${batch.name}.`);
      setPicked(new Set());
      setAdding(false);
      await load();
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : 'Could not allot students.');
    } finally {
      setBusy(false);
    }
  };

  const unallot = async (row: MemberRow, studentId: string) => {
    setBusy(true);
    try {
      const remaining = row.students.map((s) => s.id).filter((id) => id !== studentId);
      if (remaining.length === 0) await backend.removeAllotment(batch.id, row.parentUid);
      else await backend.allotStudents(batch.id, row.parentUid, remaining);
      flash('Student removed from this batch.');
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove the student.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const totalStudents = members.reduce((n, m) => n + m.students.length, 0);

  return (
    <>
      <div className="flex items-center justify-between">
        <span className={labelCls}>
          Allotted {totalStudents > 0 && `(${totalStudents})`}
        </span>
        <button type="button" className={btnGhost} onClick={() => void load()}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {error && (
        <p className="text-xs text-[#ff9bb3] leading-relaxed px-3 py-2.5 rounded-lg bg-[#2a1620] border border-[#4d2436]">
          {error}
        </p>
      )}

      {loading && <p className="text-xs text-neutral-500 text-center py-6">Loading…</p>}

      {!loading && totalStudents === 0 && !adding && (
        <Note>
          Nobody is allotted to this batch yet. Until you allot students, its tests have no result rows and its
          attendance grid is empty — parents allotted here are the only ones who can see this batch at all.
        </Note>
      )}

      {members.map((row) =>
        row.students.map((student) => (
          <div
            key={`${row.parentUid}:${student.id}`}
            className="bg-[#11121c] border border-[#262838] rounded-xl p-3.5 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-[#8E75FF]/15 border border-[#8E75FF]/30 flex items-center justify-center shrink-0">
              <UserCheck size={14} className="text-[#8E75FF]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{student.name || '(unnamed)'}</p>
              <p className="text-[11px] text-neutral-500 truncate font-mono">
                parent {row.parentUid.slice(0, 12)}…
                {student.course ? ` · ${student.course}` : ''}
              </p>
            </div>
            <button
              type="button"
              className={btnDanger}
              disabled={busy}
              onClick={() => void unallot(row, student.id)}
              aria-label={`Remove ${student.name} from ${batch.name}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )),
      )}

      {!adding ? (
        <button type="button" className={`${btnPrimary} w-full py-2.5`} onClick={() => setAdding(true)}>
          <Plus size={13} /> Allot students
        </button>
      ) : (
        <div className="bg-[#11121c] border border-[#8E75FF]/40 rounded-xl p-3.5 space-y-2.5">
          <p className="text-xs font-bold flex items-center gap-1.5">
            <Users size={13} className="text-[#8E75FF]" /> Pick students to allot
          </p>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              className={`${inputCls} pl-8`}
              placeholder="Search by name or course"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search students"
            />
          </div>

          {pool.length === 0 && (
            <Note>
              No students exist yet. A parent has to sign in and add a child before that child can be allotted to a
              batch — students live under <code>parents/{'{uid}'}/children</code>, which only the owning parent can
              create.
            </Note>
          )}

          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {candidates.map((student) => {
              const key = `${student.parentUid}:${student.id}`;
              const on = picked.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors ${
                    on ? 'bg-[#8E75FF]/15 border-[#8E75FF]/50' : 'bg-[#0d0e16] border-[#232535] hover:border-[#3a3d52]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      on ? 'bg-[#8E75FF] border-[#8E75FF] text-white' : 'border-[#3a3d52] text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{student.name || '(unnamed)'}</span>
                    <span className="block text-[11px] text-neutral-500 truncate">
                      {[student.course, student.batch].filter(Boolean).join(' · ') || `parent ${student.parentUid.slice(0, 10)}…`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button type="button" className={btnPrimary} disabled={busy || picked.size === 0} onClick={() => void commitAllotments()}>
              <UserCheck size={13} /> {busy ? 'Allotting…' : `Allot ${picked.size || ''}`.trim()}
            </button>
            <button
              type="button"
              className={btnGhost}
              disabled={busy}
              onClick={() => {
                setAdding(false);
                setPicked(new Set());
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};
