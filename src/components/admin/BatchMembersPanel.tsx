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
import {ChevronRight, Plus, RefreshCw, Search, ShieldAlert, Trash2, UserCheck, UserPlus, Users} from 'lucide-react';
import type {AllotableStudent, Batch} from '../../types';
import type {Backend} from '../../lib/backend';
import {btnDanger, btnGhost, btnPrimary, inputCls, labelCls, Note} from './ui';
import {StudentCreatePanel} from './StudentCreatePanel';

interface BatchMembersPanelProps {
  backend: Backend;
  batch: Batch;
  /** Every batch, so the new-student form offers a real picker. */
  batches: Batch[];
  flash: (message: string) => void;
  /** Drill down into one child's details (record, batches, family login codes). */
  onOpenStudent: (student: AllotableStudent, parentName: string) => void;
}

interface MemberRow {
  parentUid: string;
  students: AllotableStudent[];
  /**
   * Student ids that ARE allotted here but whose profile could not be read.
   *
   * These used to be dropped by a `.filter(Boolean)`, which is exactly how the
   * panel came to show one child when two were allotted: the membership
   * document still listed both ids, but one profile was unreadable, so the row
   * vanished and the batch silently looked short. An allotment that cannot be
   * resolved is a thing an admin must SEE, not a thing to hide.
   */
  missing: string[];
  joinedAt: string;
}

export const BatchMembersPanel: React.FC<BatchMembersPanelProps> = ({backend, batch, batches, flash, onOpenStudent}) => {
  const [pool, setPool] = useState<AllotableStudent[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  /** uid → family name, so a row can say whose child it is instead of a hash. */
  const [parentNames, setParentNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allStudents, batchStudents, memberDocs, allParents] = await Promise.all([
        backend.listAllStudents(),
        backend.listBatchStudents(batch.id),
        backend.listBatchMembers(batch.id),
        // Names are cosmetic, so a denial here must not blank the whole panel.
        backend.listAllParents().catch(() => []),
      ]);

      setParentNames(
        Object.fromEntries(allParents.map((parent) => [parent.uid, (parent.name || '').trim()])),
      );

      setPool(allStudents);
      setMembers(
        memberDocs.map((doc) => {
          const resolved: AllotableStudent[] = [];
          const missing: string[] = [];
          for (const id of doc.studentIds ?? []) {
            // Falls back to the batch's own student list so an allotment still
            // renders even if the wider `listAllStudents` query was denied.
            const found =
              allStudents.find((s) => s.id === id && s.parentUid === doc.parentUid) ??
              batchStudents.find((s) => s.id === id);
            // `doc.parentUid` is the authoritative owner: the membership document
            // IS keyed by parent uid, so it is correct even when the profile came
            // from the batch's own list (which carries no parentUid).
            if (found) resolved.push({...found, parentUid: doc.parentUid});
            else missing.push(id);
          }
          return {parentUid: doc.parentUid, joinedAt: doc.joinedAt, students: resolved, missing};
        }),
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
      // One call, and it removes ONLY this child — the backend keeps any
      // siblings in the family's membership document intact.
      await backend.removeAllotment(batch.id, row.parentUid, studentId);
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

  // Missing ids count towards the total: the batch really does have that many
  // allotments, and understating it is what made the discrepancy invisible.
  const totalStudents = members.reduce((n, m) => n + m.students.length + m.missing.length, 0);
  const missingCount = members.reduce((n, m) => n + m.missing.length, 0);

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

      {!loading && totalStudents === 0 && !adding && !creating && (
        <Note>
          Nobody is allotted to this batch yet. Until you allot students, its tests have no result rows and its
          attendance grid is empty — parents allotted here are the only ones who can see this batch at all.
        </Note>
      )}

      {members.map((row) =>
        row.students.map((student) => {
          const family = parentNames[row.parentUid] || '';
          return (
            <div
              key={`${row.parentUid}:${student.id}`}
              className="bg-[#11121c] border border-[#262838] rounded-xl p-3.5 flex items-center gap-3"
            >
              {/* The whole row drills into this child: record, batches, and the
                  family's login codes. Nothing about a student lives on a
                  separate top-level tab any more. */}
              <button
                type="button"
                onClick={() => onOpenStudent(student, family)}
                className="flex-1 min-w-0 flex items-center gap-3 text-left"
                aria-label={`Open ${student.name || 'this student'}'s details`}
              >
                <span className="w-8 h-8 rounded-lg bg-[#8E75FF]/15 border border-[#8E75FF]/30 flex items-center justify-center shrink-0">
                  <UserCheck size={14} className="text-[#8E75FF]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold truncate">{student.name || '(unnamed)'}</span>
                  <span className="block text-[11px] text-neutral-500 truncate">
                    {family || `parent ${row.parentUid.slice(0, 12)}…`}
                  </span>
                </span>
                <ChevronRight size={15} className="text-neutral-600 shrink-0" />
              </button>
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
          );
        }),
      )}

      {creating && (
        <StudentCreatePanel
          backend={backend}
          batches={batches}
          currentBatch={batch}
          flash={flash}
          onCreated={() => {
            setCreating(false);
            void load();
          }}
        />
      )}

      {!adding && !creating && (
        <div className="flex gap-2">
          <button type="button" className={`${btnPrimary} flex-1 py-2.5`} onClick={() => setCreating(true)}>
            <UserPlus size={13} /> New student
          </button>
          <button type="button" className={`${btnGhost} flex-1 py-2.5`} onClick={() => setAdding(true)}>
            <Plus size={13} /> Allot existing
          </button>
        </div>
      )}

      {adding && (
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
