/**
 * One batch, opened from the Batches tab.
 *
 * Three panels, because the three jobs an admin does inside a batch are
 * genuinely separate and each needs the whole screen:
 *
 *   Students    allot / un-allot which children belong to this batch
 *   Attendance  day-wise P/A/L grid for every allotted student
 *   Tests       create a test, set its syllabus, enter per-student marks
 *
 * This is also the top of the drill-down the admin panel is built around:
 * Batches → one batch → Students → ONE CHILD (StudentDetailView), where that
 * child's academic record, their batch memberships and their family's login
 * codes all live together. Nothing about a student sits on a separate
 * top-level tab any more.
 */
import React, {useState} from 'react';
import {ArrowLeft, CalendarDays, ClipboardList, Users, Braces} from 'lucide-react';
import type {AllotableStudent, Batch} from '../../types';
import type {Backend} from '../../lib/backend';
import {BatchMembersPanel} from './BatchMembersPanel';
import {BatchAttendancePanel} from './BatchAttendancePanel';
import {BatchTestsPanel} from './BatchTestsPanel';
import {JsonQueryPanel} from './JsonQueryPanel';
import {StudentDetailView} from './StudentDetailView';

type PanelId = 'students' | 'attendance' | 'tests' | 'json';

interface BatchDetailViewProps {
  backend: Backend;
  mode: 'mock' | 'firebase';
  batch: Batch;
  /** Every batch, so a child's membership picker lists real options. */
  batches: Batch[];
  flash: (message: string) => void;
  onBack: () => void;
}

export const BatchDetailView: React.FC<BatchDetailViewProps> = ({backend, mode, batch, batches, flash, onBack}) => {
  const [panel, setPanel] = useState<PanelId>('students');
  /** Set when a child row was tapped — replaces the whole batch view. */
  const [selected, setSelected] = useState<{student: AllotableStudent; parentName: string} | null>(null);
  /** Bumped after a save so the students panel re-reads on the way back. */
  const [reloadToken, setReloadToken] = useState(0);

  if (selected) {
    return (
      <StudentDetailView
        key={`${selected.student.parentUid}:${selected.student.id}`}
        backend={backend}
        mode={mode}
        student={selected.student}
        batches={batches}
        parentName={selected.parentName}
        flash={flash}
        onBack={() => {
          setSelected(null);
          setReloadToken((n) => n + 1);
        }}
        onDeleted={() => {
          setSelected(null);
          setReloadToken((n) => n + 1);
        }}
      />
    );
  }

  const panels: {id: PanelId; label: string; icon: React.ReactNode}[] = [
    {id: 'students', label: 'Students', icon: <Users size={13} />},
    {id: 'attendance', label: 'Attendance', icon: <CalendarDays size={13} />},
    {id: 'tests', label: 'Tests', icon: <ClipboardList size={13} />},
    {id: 'json', label: 'JSON query', icon: <Braces size={13} />},
  ];

  return (
    <div className="-mx-4 -my-4 flex flex-col h-full min-h-0">
      <header className="shrink-0 px-4 pt-3 pb-2 border-b border-[#E4E6EB] bg-[#FFFFFF]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600 hover:text-neutral-900 mb-2"
        >
          <ArrowLeft size={13} /> All batches
        </button>
        <h2 className="text-base font-bold leading-tight truncate">{batch.name}</h2>
        <p className="text-[11px] text-neutral-500 truncate">
          {batch.batchType === 'offline' ? 'Offline (centre)' : 'Online'}
        </p>

        <nav className="flex gap-1 mt-3 overflow-x-auto">
          {panels.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPanel(p.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                panel === p.id ? 'bg-[#5747D6] text-white' : 'bg-white text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {panel === 'students' && (
          <BatchMembersPanel
            key={reloadToken}
            backend={backend}
            batch={batch}
            batches={batches}
            flash={flash}
            onOpenStudent={(student, parentName) => setSelected({student, parentName})}
          />
        )}
        {panel === 'attendance' && <BatchAttendancePanel backend={backend} batch={batch} flash={flash} />}
        {panel === 'tests' && <BatchTestsPanel backend={backend} batch={batch} flash={flash} />}
        {panel === 'json' && <JsonQueryPanel backend={backend} batch={batch} flash={flash} />}
      </div>
    </div>
  );
};
