/**
 * DPP figures for the offline dashboard.
 *
 * DPPs live at `batches/{batchId}/dpp/{studentId}` as one document per student
 * holding a per-month `{assigned, attempted, questionsAttemptedPercent,
 * accuracyPercent}` map. Totals are DERIVED here (sums, and an attempt-weighted
 * mean of the monthly percentages) — never stored, never typed.
 *
 * When the backend has no record for this student yet — or does not implement
 * DPPs at all — every figure is 0 and `monthly` is empty, so the section renders
 * its honest empty state instead of invented numbers.
 */
import { useEffect, useMemo, useState } from 'react';
import { getBackend } from '../lib/backend';

/** One month's DPP row. `month` is a short label like "Jul". */
export interface DppMonth {
  month: string;
  assigned: number;
  attempted: number;
}

export interface DppSummary {
  totalAssigned: number;
  totalAttempted: number;
  questionsAttemptedPercent: number;
  accuracyPercent: number;
  monthly: DppMonth[];
}

export type {DppRecord} from '../lib/backend/types';
import type {DppRecord} from '../lib/backend/types';

const EMPTY: DppSummary = {
  totalAssigned: 0,
  totalAttempted: 0,
  questionsAttemptedPercent: 0,
  accuracyPercent: 0,
  monthly: [],
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function summarizeDpp(record: DppRecord | null | undefined): DppSummary {
  if (!record?.months) return EMPTY;

  const entries = Object.entries(record.months).sort(([a], [b]) => (a < b ? -1 : 1));
  if (entries.length === 0) return EMPTY;

  let assigned = 0;
  let attempted = 0;
  let weightedQuestions = 0;
  let weightedAccuracy = 0;

  const monthly = entries.map(([key, m]) => {
    assigned += m.assigned;
    attempted += m.attempted;
    weightedQuestions += m.questionsAttemptedPercent * m.attempted;
    weightedAccuracy += m.accuracyPercent * m.attempted;
    const [, mm] = key.split('-');
    return {
      month: MONTH_LABELS[Number(mm) - 1] ?? key,
      assigned: m.assigned,
      attempted: m.attempted,
    };
  });

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    totalAssigned: assigned,
    totalAttempted: attempted,
    questionsAttemptedPercent: attempted > 0 ? round2(weightedQuestions / attempted) : 0,
    accuracyPercent: attempted > 0 ? round2(weightedAccuracy / attempted) : 0,
    monthly,
  };
}

export function useDppView(batchId: string | null, studentId: string | null): DppSummary {
  const [record, setRecord] = useState<DppRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!batchId || !studentId) {
      setRecord(null);
      return;
    }
    (async () => {
      const backend = await getBackend();
      // Backends that predate DPPs simply lack the method; treat as no record.
      const rec = await backend.getDppRecord(batchId, studentId).catch(() => null);
      if (!cancelled) setRecord(rec ?? null);
    })();
    return () => { cancelled = true; };
  }, [batchId, studentId]);

  return useMemo(() => summarizeDpp(record), [record]);
}
