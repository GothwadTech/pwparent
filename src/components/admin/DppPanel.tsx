/**
 * Administrator entry for one student's DPP record.
 *
 * The offline dashboard's DPP section (lavender roll-up + monthly bars) reads
 * `batches/{id}/dpp/{studentId}`. This is where those numbers come from: one row
 * per month with assigned, attempted, questions-attempted % and accuracy %.
 *
 * Totals and the two "in attempted DPPs" percentages are NOT entered here — the
 * parent's screen derives them (sums and an attempt-weighted mean), so what the
 * administrator types and what the parent sees can never disagree.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {Plus, Save, Trash2} from 'lucide-react';
import type {Backend} from '../../lib/backend/types';
import type {DppMonthEntry, DppRecord} from '../../lib/backend/types';
import {btnGhost, btnPrimary, inputCls, Note} from './ui';

interface DppPanelProps {
  backend: Backend;
  batchId: string;
  studentId: string;
  flash: (message: string) => void;
}

const blankMonth = (): DppMonthEntry => ({
  assigned: 0,
  attempted: 0,
  questionsAttemptedPercent: 0,
  accuracyPercent: 0,
});

/** The current month as `YYYY-MM`, the key format the record uses. */
const thisMonth = (): string => new Date().toISOString().slice(0, 7);

export const DppPanel: React.FC<DppPanelProps> = ({backend, batchId, studentId, flash}) => {
  const [months, setMonths] = useState<Record<string, DppMonthEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rec = await backend.getDppRecord(batchId, studentId);
      setMonths(rec?.months ?? {});
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the DPP record.');
    } finally {
      setLoading(false);
    }
  }, [backend, batchId, studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (key: string, change: Partial<DppMonthEntry>) =>
    setMonths((prev) => ({...prev, [key]: {...(prev[key] ?? blankMonth()), ...change}}));

  const addMonth = () => {
    let key = thisMonth();
    while (months[key]) {
      const [y, m] = key.split('-').map(Number);
      key = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}`;
    }
    setMonths((prev) => ({...prev, [key]: blankMonth()}));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const record: DppRecord = {months};
      await backend.saveDppRecord(batchId, studentId, record);
      flash('DPP record saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the DPP record.');
    } finally {
      setSaving(false);
    }
  };

  const num = (v: string, max = 5) => v.replace(/[^\d.]/g, '').slice(0, max);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">DPP record (month-wise)</p>
        <button type="button" className={btnGhost} onClick={addMonth}>
          <Plus size={12} /> Add month
        </button>
      </div>

      {loading && <p className="text-xs text-neutral-500">Loading…</p>}

      {!loading && Object.keys(months).length === 0 && (
        <Note>No DPP months entered yet. Add a month to start recording.</Note>
      )}

      {Object.entries(months)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([key, m]) => (
          <div key={key} className="bg-white border border-[#E4E6EB] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">{key}</span>
              <button
                type="button"
                className="text-xs text-[#B02A43] font-bold flex items-center gap-1"
                onClick={() =>
                  setMonths((prev) => {
                    const next = {...prev};
                    delete next[key];
                    return next;
                  })
                }
              >
                <Trash2 size={11} /> Remove
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <input
                className={inputCls} aria-label={`DPPs assigned in ${key}`} placeholder="Assigned"
                inputMode="numeric" value={String(m.assigned)}
                onChange={(e) => patch(key, {assigned: Number(num(e.target.value, 4)) || 0})}
              />
              <input
                className={inputCls} aria-label={`DPPs attempted in ${key}`} placeholder="Attempted"
                inputMode="numeric" value={String(m.attempted)}
                onChange={(e) => patch(key, {attempted: Number(num(e.target.value, 4)) || 0})}
              />
              <input
                className={inputCls} aria-label={`Questions attempted percent in ${key}`} placeholder="Ques %"
                inputMode="numeric" value={String(m.questionsAttemptedPercent)}
                onChange={(e) => patch(key, {questionsAttemptedPercent: Number(num(e.target.value)) || 0})}
              />
              <input
                className={inputCls} aria-label={`Accuracy percent in ${key}`} placeholder="Acc %"
                inputMode="numeric" value={String(m.accuracyPercent)}
                onChange={(e) => patch(key, {accuracyPercent: Number(num(e.target.value)) || 0})}
              />
            </div>
          </div>
        ))}

      {error && <Note tone="warn">{error}</Note>}

      <button type="button" className={btnPrimary} disabled={saving} onClick={() => void save()}>
        <Save size={12} /> {saving ? 'Saving…' : 'Save DPP record'}
      </button>
    </div>
  );
};
