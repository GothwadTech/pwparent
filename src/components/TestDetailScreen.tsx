/**
 * One test's full result — matched to the reference ("Milestone:7" screen).
 *
 * A two-column grid of lavender stat tiles (Score, Accuracy, Correct, Rank, Top
 * Score, Avg Score), then the subject-wise performance accordion: a subject row
 * carries a purple rail and the SUM of its topics; expanding it lists each topic
 * with the marks obtained on it.
 *
 * Topic marks come from `result.topicMarks`; a subject's figure is derived by
 * adding its topics, never typed. When the result is not announced yet every
 * tile reads "—" rather than a guess.
 */
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';
import type { BatchTest, TestResult } from '../types';
import {
  ACCENT, CARD_BORDER, HEADER_BG, TEXT_PRIMARY, TILE_BG,
} from '../lib/uiTheme';

interface TestDetailScreenProps {
  test: BatchTest;
  result?: TestResult;
  onBack: () => void;
}

interface Tile {
  icon: string;
  label: string;
  value: string;
}

const dash = (v: number | undefined, suffix = ''): string =>
  typeof v === 'number' ? `${v}${suffix}` : '—';

export const TestDetailScreen: React.FC<TestDetailScreenProps> = ({ test, result, onBack }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const tiles: Tile[] = [
    { icon: '📈', label: 'Score', value: typeof result?.marksObtained === 'number' ? `${result.marksObtained} / ${test.marksTotal}` : '—' },
    { icon: '🎯', label: 'Accuracy', value: dash(result?.accuracyPercent) },
    { icon: '✅', label: 'Correct', value: dash(result?.correctCount) },
    { icon: '🏅', label: 'Rank', value: dash(result?.rank) },
    { icon: '⭐', label: 'Top Score', value: typeof result?.topScore === 'number' ? `${result.topScore}/${test.marksTotal}` : '—' },
    { icon: '📊', label: 'Avg Score', value: dash(result?.avgScore) },
  ];

  /** Syllabus grouped by subject, order preserved, each topic's marks attached. */
  const subjects = useMemo(() => {
    const map = new Map<string, { topic: string; marks: number }[]>();
    for (const line of test.syllabus ?? []) {
      const key = `${line.subject}||${line.topic}`;
      const marks = result?.topicMarks?.[key] ?? 0;
      const list = map.get(line.subject) ?? [];
      list.push({ topic: line.topic, marks });
      map.set(line.subject, list);
    }
    return [...map.entries()].map(([subject, topics]) => ({
      subject,
      topics,
      total: topics.reduce((a, b) => a + b.marks, 0),
    }));
  }, [test.syllabus, result]);

  return (
    <div className="w-full h-full flex flex-col select-none font-['Plus_Jakarta_Sans',sans-serif]" style={{ background: '#F4F5F7' }}>
      <header className="shrink-0 px-4 pt-4 pb-4 flex items-center space-x-4" style={{ background: HEADER_BG }}>
        <button type="button" onClick={onBack} aria-label="Back" className="p-1">
          <ChevronLeft size={26} strokeWidth={2.6} style={{ color: TEXT_PRIMARY }} />
        </button>
        <h1 className="text-[21px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
          {test.title}
        </h1>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-5 pb-8 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <div key={t.label} className="flex items-center justify-between px-3 py-4 rounded-lg" style={{ background: TILE_BG }}>
              <div className="flex items-center space-x-2.5">
                <span className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[17px]">
                  {t.icon}
                </span>
                <span className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{t.label}</span>
              </div>
              <span className="text-[17px] font-extrabold" style={{ color: TEXT_PRIMARY }}>{t.value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-[19px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
            Subject wise Performance
          </h2>

          {subjects.length === 0 ? (
            <p className="text-[14px]" style={{ color: TEXT_PRIMARY }}>
              No syllabus was attached to this test, so there is no subject-wise breakdown.
            </p>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: CARD_BORDER }}>
              {subjects.map((s, i) => {
                const isOpen = open[s.subject] ?? i === 0;
                return (
                  <div key={s.subject}>
                    <button
                      type="button"
                      onClick={() => setOpen((o) => ({ ...o, [s.subject]: !isOpen }))}
                      className="w-full flex items-center justify-between py-4 pr-4 relative"
                      style={{ background: '#F2F3F5' }}
                    >
                      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: ACCENT }} />
                      <span className="flex items-center space-x-3 pl-4">
                        {isOpen
                          ? <ChevronUp size={15} style={{ color: TEXT_PRIMARY }} />
                          : <ChevronDown size={15} style={{ color: TEXT_PRIMARY }} />}
                        <span className="text-[16px] font-extrabold" style={{ color: TEXT_PRIMARY }}>{s.subject}</span>
                      </span>
                      <span className="text-[16px] font-extrabold" style={{ color: TEXT_PRIMARY }}>{s.total}</span>
                    </button>

                    {isOpen && s.topics.map((tp) => (
                      <div
                        key={tp.topic}
                        className="w-full flex items-center justify-between py-4 pr-4 border-t"
                        style={{ borderColor: CARD_BORDER, background: '#FAFBFC' }}
                      >
                        <span className="flex items-center space-x-3 pl-9">
                          <ChevronDown size={13} style={{ color: TEXT_PRIMARY }} />
                          <span className="text-[15px]" style={{ color: TEXT_PRIMARY }}>{tp.topic}</span>
                        </span>
                        <span className="text-[15px]" style={{ color: TEXT_PRIMARY }}>{tp.marks}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
