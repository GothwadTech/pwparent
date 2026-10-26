/**
 * One batch, opened from the Batches tab.
 *
 * Three panels, because the three jobs an admin does inside a batch are
 * genuinely separate and each needs the whole screen:
 *
 *   Students    allot / un-allot which children belong to this batch
 *   Attendance  day-wise P/A/L grid for every allotted student
 *   Tests       create a test, set its syllabus, enter per-student marks
 */
import React, {useState} from 'react';
import {ArrowLeft, CalendarDays, ClipboardList, Users} from 'lucide-react';
import type {Batch} from '../../types';
import type {Backend} from '../../lib/backend';
import {BatchMembersPanel} from './BatchMembersPanel';
import {BatchAttendancePanel} from './BatchAttendancePanel';
import {BatchTestsPanel} from './BatchTestsPanel';

type PanelId = 'students' | 'attendance' | 'tests';

interface BatchDetailViewProps {
  backend: Backend;
  batch: Batch;
  flash: (message: string) => void;
  onBack: () => void;
}

export const BatchDetailView: React.FC<BatchDetailViewProps> = ({backend, batch, flash, onBack}) => {
  const [panel, setPanel] = useState<PanelId>('students');

  const panels: {id: PanelId; label: string; icon: React.ReactNode}[] = [
    {id: 'students', label: 'Students', icon: <Users size={13} />},
    {id: 'attendance', label: 'Attendance', icon: <CalendarDays size={13} />},
    {id: 'tests', label: 'Tests', icon: <ClipboardList size={13} />},
  ];

  return (
    <div className="-mx-4 -my-4 flex flex-col h-full min-h-0">
      <header className="shrink-0 px-4 pt-3 pb-2 border-b border-[#1c1d29] bg-[#0a0b10]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white mb-2"
        >
          <ArrowLeft size={13} /> All batches
        </button>
        <h2 className="text-base font-bold leading-tight truncate">{batch.name}</h2>
        <p className="text-[11px] text-neutral-500 truncate">
          {[batch.course, batch.batchType, `from ${batch.startDate}`].filter(Boolean).join(' · ')}
        </p>

        <nav className="flex gap-1 mt-3 overflow-x-auto">
          {panels.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPanel(p.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                panel === p.id ? 'bg-[#8E75FF] text-white' : 'bg-[#181926] text-neutral-400 hover:text-white'
              }`}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {panel === 'students' && <BatchMembersPanel backend={backend} batch={batch} flash={flash} />}
        {panel === 'attendance' && <BatchAttendancePanel backend={backend} batch={batch} flash={flash} />}
        {panel === 'tests' && <BatchTestsPanel backend={backend} batch={batch} flash={flash} />}
      </div>
    </div>
  );
};
