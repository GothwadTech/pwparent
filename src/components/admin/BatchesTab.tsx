/**
 * Admin → Batches tab.
 *
 * The entry point to the batch-centric model: create a batch, then open it to
 * allot students, mark day-wise attendance and create tests with syllabus +
 * per-student marks.
 *
 * Talks to the Backend directly (like LoginCodesTab) rather than through
 * App.tsx — the batch tree is large and admin-only, so there is no reason to
 * hold it in the app-level state that every screen re-renders against.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {ChevronRight, Layers, Plus, RefreshCw, Save, Trash2} from 'lucide-react';
import type {Batch} from '../../types';
import type {Backend} from '../../lib/backend';
import {newBatchId} from '../../lib/backend';
import {BatchDetailView} from './BatchDetailView';
import {btnDanger, btnGhost, btnPrimary, Field, inputCls, labelCls, Note} from './ui';

interface BatchesTabProps {
  backend: Backend;
  mode: 'mock' | 'firebase';
  flash: (message: string) => void;
}

function blankBatch(): Batch {
  return {
    id: newBatchId(),
    name: '',
    batchType: 'offline',
  };
}

const BatchForm: React.FC<{
  batch: Batch;
  onChange: (batch: Batch) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}> = ({batch, onChange, onSave, onCancel, busy}) => (
  <div className="bg-white border border-[#5747D6]/40 rounded-xl p-3.5 space-y-2.5">
    {/* Only two fields, on purpose. Course duplicated the name, start date
        drove nothing, and "visible to parents" was meaningless — allotment is
        already the only thing that makes a batch visible to a parent. */}
    <div className="space-y-2.5">
      <Field label="Batch name" htmlFor="batch-name">
        <input
          id="batch-name"
          className={inputCls}
          value={batch.name}
          placeholder="MISSION 30 NEET 2026"
          onChange={(e) => onChange({...batch, name: e.target.value})}
        />
      </Field>
      <Field label="Type" htmlFor="batch-type">
        <select
          id="batch-type"
          className={inputCls}
          value={batch.batchType}
          onChange={(e) => onChange({...batch, batchType: e.target.value as Batch['batchType']})}
        >
          <option value="offline">Offline (centre / attendance)</option>
          <option value="online">Online</option>
        </select>
      </Field>
    </div>

    <div className="flex gap-2">
      <button type="button" className={btnPrimary} disabled={busy || !batch.name.trim()} onClick={onSave}>
        <Save size={13} /> {busy ? 'Saving…' : 'Save batch'}
      </button>
      <button type="button" className={btnGhost} onClick={onCancel} disabled={busy}>
        Cancel
      </button>
    </div>
  </div>
);

export const BatchesTab: React.FC<BatchesTabProps> = ({backend, mode, flash}) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Batch | null>(null);
  const [busy, setBusy] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBatches(await backend.listAllBatches());
    } catch (loadError) {
      // `list` on batches is admin-only: a denial here means the signed-in uid
      // has no admins/{uid} document.
      setError(loadError instanceof Error ? loadError.message : 'Could not read batches.');
    } finally {
      setLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await backend.saveBatch({...draft, name: draft.name.trim()});
      flash(`Batch "${draft.name.trim()}" saved.`);
      setDraft(null);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the batch.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (batch: Batch) => {
    setBusy(true);
    try {
      // Cascades: members, attendance, tests and every result go with it.
      await backend.deleteBatch(batch.id);
      flash(`Batch "${batch.name}" deleted with all its data.`);
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not delete the batch.');
    } finally {
      setBusy(false);
    }
  };

  const opened = openedId ? batches.find((b) => b.id === openedId) : null;

  if (opened) {
    return (
      <BatchDetailView
        backend={backend}
        mode={mode}
        batch={opened}
        batches={batches}
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
          Batches {batches.length > 0 && `(${batches.length})`}
        </span>
        <button type="button" className={btnGhost} onClick={() => void load()}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <Note>
        A batch owns its attendance and its tests. Allot students first — a test
        only shows the students who are in the batch, and marks are recorded per
        student inside the test.
      </Note>

      {error && (
        <p className="text-xs text-[#ff9bb3] leading-relaxed px-3 py-2.5 rounded-lg bg-[#2a1620] border border-[#4d2436]">
          {error}
        </p>
      )}

      <button
        type="button"
        className={`${btnPrimary} w-full py-2.5`}
        onClick={() => setDraft(draft ? null : blankBatch())}
      >
        {draft ? <Trash2 size={13} /> : <Plus size={13} />}
        {draft ? 'Discard new batch' : 'Create batch'}
      </button>

      {draft && (
        <BatchForm batch={draft} onChange={setDraft} onSave={() => void save()} onCancel={() => setDraft(null)} busy={busy} />
      )}

      {loading && <p className="text-xs text-neutral-500 text-center py-6">Loading…</p>}

      {!loading && !error && batches.length === 0 && !draft && (
        <Note>
          No batches yet. Create one above, then open it to allot students. Nothing renders for parents until a batch
          exists and someone is allotted to it — there is no sample data behind this.
        </Note>
      )}

      {batches.map((batch) => (
        <div key={batch.id} className="bg-white border border-[#E4E6EB] rounded-xl p-3.5">
          <button
            type="button"
            className="w-full flex items-center gap-3 text-left"
            onClick={() => setOpenedId(batch.id)}
          >
            <div className="w-9 h-9 rounded-lg bg-[#5747D6]/15 border border-[#5747D6]/30 flex items-center justify-center shrink-0">
              <Layers size={15} className="text-[#5747D6]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{batch.name}</p>
              <p className="text-[11px] text-neutral-500 truncate">
                {batch.batchType === 'offline' ? 'Offline (centre)' : 'Online'}
              </p>
            </div>
            <ChevronRight size={15} className="text-neutral-500 shrink-0" />
          </button>

          <div className="flex gap-2 mt-3 pt-3 border-t border-[#E4E6EB]">
            <button type="button" className={btnGhost} onClick={() => setDraft(batch)}>
              Edit
            </button>
            <button type="button" className={btnDanger} disabled={busy} onClick={() => void remove(batch)}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
};
