/**
 * One test's full result — measured off the reference ("Milestone:7" screen).
 *
 * Header + neutral band, then the 2-column grid of lavender stat tiles: the
 * multicolour icon sits DIRECTLY on the tile (no white box around it, as in the
 * reference), 14px extrabold label, 15px extrabold value right-aligned. Then
 * "Subject wise Performance" and the accordion: a subject row carries a 3px
 * indigo rail on a grey ground with its caret, name and the SUM of its topics;
 * expanding it lists each topic row with the marks obtained on it.
 *
 * Topic marks come from `result.topicMarks`; a subject's figure is derived by
 * adding its topics, never typed. When the result is not announced yet every
 * tile reads "—" rather than a guess.
 */
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';
import {IconBars, IconChartLine, IconCheckCircle, IconPodium, IconStar, IconTarget} from './icons/AppIcons';
import type { BatchTest, TestResult } from '../types';
import {
  ACCENT, CARD_BORDER, HEADER_BG, SECTION_BAND, TEXT_PRIMARY, TILE_BG,
} from '../lib/uiTheme';

interface TestDetailScreenProps {
  test: BatchTest;
  result?: TestResult;
  onBack: () => void;
}

interface Tile {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const dash = (v: number | undefined, suffix = ''): string =>
  typeof v === 'number' ? `${v}${suffix}` : '—';

export const TestDetailScreen: React.FC<TestDetailScreenProps> = ({ test, result, onBack }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const tiles: Tile[] = [
    { icon: <IconChartLine size={20} />, label: 'Score', value: typeof result?.marksObtained === 'number' ? `${result.marksObtained} / ${test.marksTotal}` : '—' },
    { icon: <IconTarget size={20} />, label: 'Accuracy', value: dash(result?.accuracyPercent) },
    { icon: <IconCheckCircle size={20} />, label: 'Correct', value: dash(result?.correctCount) },
    { icon: <IconPodium size={20} />, label: 'Rank', value: dash(result?.rank) },
    { icon: <IconStar size={20} />, label: 'Top Score', value: typeof result?.topScore === 'number' ? `${result.topScore}/${test.marksTotal}` : '—' },
    { icon: <IconBars size={20} />, label: 'Avg Score', value: dash(result?.avgScore) },
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
      <header className="shrink-0 px-4 pt-4 pb-3.5 flex items-center space-x-4" style={{ background: HEADER_BG }}>
        <button type="button" onClick={onBack} aria-label="Back" className="p-1 -ml-1">
          <ChevronLeft size={22} strokeWidth={2.6} style={{ color: TEXT_PRIMARY }} />
        </button>
        <h1 className="text-[17px] font-extrabold tracking-tight" style={{ color: TEXT_PRIMARY }}>
          {test.title}
        </h1>
      </header>
      <div className="shrink-0 h-3 w-full" style={{ background: SECTION_BAND }} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="flex items-center justify-between px-3 py-3 rounded-xl"
              style={{ background: TILE_BG }}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="shrink-0">{t.icon}</span>
                <span className="text-[14px] font-extrabold truncate" style={{ color: TEXT_PRIMARY }}>
                  {t.label}
                </span>
              </div>
              <span className="text-[15px] font-extrabold pl-2" style={{ color: TEXT_PRIMARY }}>
                {t.value}
              </span>
            </div>
          ))}
        </div>

        <h2 className="text-[16px] font-extrabold tracking-tight mt-6" style={{ color: TEXT_PRIMARY }}>
          Subject wise Performance
        </h2>

        {subjects.length === 0 ? (
          <p className="text-[12px] mt-3" style={{ color: TEXT_PRIMARY }}>
            No syllabus was attached to this test, so there is no subject-wise breakdown.
          </p>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden mt-3" style={{ borderColor: CARD_BORDER }}>
            {subjects.map((s, i) => {
              const isOpen = open[s.subject] ?? i === 0;
              return (
                <div key={s.subject} className={i > 0 ? 'border-t' : ''} style={{ borderColor: CARD_BORDER }}>
                  <button
                    type="button"
                    onClick={() => setOpen((o) => ({ ...o, [s.subject]: !isOpen }))}
                    className="w-full flex items-center justify-between py-3.5 pr-4 relative"
                    style={{ background: '#F4F5F7' }}
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: ACCENT }} />
                    <span className="flex items-center space-x-3 pl-4">
                      {isOpen
                        ? <ChevronUp size={12} style={{ color: TEXT_PRIMARY }} />
                        : <ChevronDown size={12} style={{ color: TEXT_PRIMARY }} />}
                      <span className="text-[14px] font-extrabold" style={{ color: TEXT_PRIMARY }}>{s.subject}</span>
                    </span>
                    <span className="text-[14px] font-extrabold" style={{ color: TEXT_PRIMARY }}>{s.total}</span>
                  </button>

                  {isOpen && s.topics.map((tp, ti) => (
                    <div
                      key={tp.topic}
                      className={`w-full flex items-center justify-between py-3 pr-4 ${ti === 0 ? '' : 'border-t'}`}
                      style={{ borderColor: CARD_BORDER, background: '#FBFBFC' }}
                    >
                      <span className="flex items-center space-x-3 pl-10">
                        <ChevronDown size={11} style={{ color: TEXT_PRIMARY }} />
                        <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{tp.topic}</span>
                      </span>
                      <span className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{tp.marks}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
