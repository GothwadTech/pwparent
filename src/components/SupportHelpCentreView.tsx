import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Check,
} from 'lucide-react';
import type { FaqItem } from '../types';
import { HELP_CENTRE_FAQS } from './supportFaqs';
import { isDockUnlockQuery } from '../lib/dockAccess';
import { KeyRound } from 'lucide-react';

interface SupportHelpCentreViewProps {
  onContactUs?: () => void;
  /**
   * The second door into the settings / Firestore panel: typing "admin" in the
   * search bar (any case) reveals a button under it that calls this.
   */
  onOpenSettings?: () => void;
}

export const SupportHelpCentreView: React.FC<SupportHelpCentreViewProps> = ({
  onContactUs,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'help_centre' | 'my_issues'>('help_centre');
  const [issuesFilter, setIssuesFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpandedAll, setIsExpandedAll] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(
    'my-payment-failed'
  );
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'yes' | 'no'>>({});

  const initialFaqs = HELP_CENTRE_FAQS;

  const visibleFaqs = isExpandedAll ? initialFaqs : initialFaqs.slice(0, 4);

  const filteredFaqs = searchQuery.trim()
    ? initialFaqs.filter((f) =>
        f.question.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : visibleFaqs;

  return (
    <div className="flex-1 flex flex-col bg-white text-neutral-900 overflow-hidden select-none">
      {/* Tab Switcher matching screenshot */}
      <div className="w-full flex border-b border-neutral-200 bg-white z-10">
        <button
          type="button"
          onClick={() => setActiveTab('help_centre')}
          className={`flex-1 py-3 text-center text-[13.5px] font-semibold transition-all relative ${
            activeTab === 'help_centre'
              ? 'text-[#5F45FF]'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Help Centre
          {activeTab === 'help_centre' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5F45FF]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_issues')}
          className={`flex-1 py-3 text-center text-[13.5px] font-semibold transition-all relative ${
            activeTab === 'my_issues'
              ? 'text-[#5F45FF]'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          My Issues
          {activeTab === 'my_issues' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5F45FF]" />
          )}
        </button>
      </div>

      {/* ---------------- HELP CENTRE TAB ---------------- */}
      {activeTab === 'help_centre' ? (
        <div className="flex-1 px-4 py-4 overflow-y-auto space-y-5">
          {/* Search Query Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type your query here..."
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-neutral-200 focus:border-[#5F45FF] focus:outline-none text-[13.5px] text-neutral-800 placeholder-neutral-400 shadow-xs"
            />
            <Search
              size={18}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            />
          </div>

          {/* The hidden door: type "admin" (ADMIN, Admin, ad min — anything) and
              the access button appears right under the field. */}
          {onOpenSettings && isDockUnlockQuery(searchQuery) && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border border-[#5F45FF]/40 bg-[#EEF2FF] hover:bg-[#E4E9FF] text-left transition-colors"
            >
              <KeyRound size={16} className="text-[#5F45FF] shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold text-[#17181C]">Admin access</span>
                <span className="block text-[11px] text-neutral-600 mt-0.5">
                  Open app settings, backend status and the Admin Panel
                </span>
              </span>
            </button>
          )}

          <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight">
            Tell us how we can help &#x1F44B;
          </h2>

          {/* Accordion FAQ Items */}
          <div className="space-y-2.5">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-neutral-200/80 bg-[#F9FAFC] overflow-hidden transition-all shadow-xs"
                >
                  {/* Question Header */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaqId(isOpen ? null : faq.id)
                    }
                    className="w-full p-4 flex items-center justify-between text-left group"
                  >
                    <span className="text-[13.5px] font-semibold text-neutral-800 group-hover:text-neutral-950 pr-2 leading-snug">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp size={19} className="text-neutral-600 shrink-0" />
                    ) : (
                      <ChevronDown size={19} className="text-neutral-500 shrink-0" />
                    )}
                  </button>

                  {/* Expanded Answer Content (Screenshot_20260918_180944.jpg) */}
                  {isOpen && faq.answer && (
                    <div className="px-4 pb-4 pt-1 border-t border-neutral-200/60 bg-white">
                      <div className="space-y-2 text-[12.5px] text-neutral-700 leading-relaxed font-normal">
                        {faq.answer.map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>

                      {/* Helpful Prompt with Thumbs Up/Down */}
                      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-xs text-neutral-600 font-medium">
                          Was this information helpful?
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              setFeedbackGiven((prev) => ({
                                ...prev,
                                [faq.id]: 'yes',
                              }))
                            }
                            className={`p-1.5 rounded-full border transition-all text-sm ${
                              feedbackGiven[faq.id] === 'yes'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                                : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
                            }`}
                            title="Helpful"
                          >
                            &#x1F44D;
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFeedbackGiven((prev) => ({
                                ...prev,
                                [faq.id]: 'no',
                              }))
                            }
                            className={`p-1.5 rounded-full border transition-all text-sm ${
                              feedbackGiven[faq.id] === 'no'
                                ? 'bg-rose-50 border-rose-300 text-rose-600'
                                : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
                            }`}
                            title="Not helpful"
                          >
                            &#x1F44E;
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show More / Show Less Button */}
          {!searchQuery.trim() && (
            <div className="text-center pt-1 pb-1">
              <button
                type="button"
                onClick={() => setIsExpandedAll(!isExpandedAll)}
                className="text-xs font-semibold text-[#5F45FF] hover:text-[#4b35e0] inline-flex items-center space-x-1"
              >
                <span>{isExpandedAll ? 'Show Less' : 'Show More'}</span>
                {isExpandedAll ? (
                  <ChevronUp size={15} />
                ) : (
                  <ChevronDown size={15} />
                )}
              </button>
            </div>
          )}

          {/* Still Need Help Card (Screenshot_20260918_180928.jpg) */}
          <div className="rounded-2xl border border-neutral-200 p-4 bg-white shadow-xs flex items-center justify-between">
            <div className="space-y-1 max-w-[210px]">
              <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                Still need help, Have Queries
              </h3>
              <p className="text-[11px] text-neutral-500 leading-normal">
                Have Queries? Please get in touch &amp; we will happy to help you
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onContactUs}
                  className="px-4 py-2 rounded-xl bg-[#5F45FF] hover:bg-[#4d35e0] text-white font-bold text-xs shadow-sm transition-colors"
                >
                  Contact Us
                </button>
              </div>
            </div>

            {/* Colorful Gear Illustration */}
            <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Large Red Gear */}
                <circle cx="45" cy="45" r="22" fill="#EF4444" opacity="0.9" />
                {/* Medium Green Gear */}
                <circle cx="70" cy="65" r="15" fill="#10B981" opacity="0.9" />
                {/* Small Yellow Gear */}
                <circle cx="30" cy="72" r="11" fill="#F59E0B" opacity="0.9" />
                {/* Support Agent Avatar Center */}
                <circle cx="45" cy="45" r="14" fill="#FFFFFF" />
                <circle cx="45" cy="41" r="5" fill="#EF4444" />
                <path
                  d="M38 52 C38 47 52 47 52 52 Z"
                  fill="#EF4444"
                />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        /* ---------------- MY ISSUES TAB (Screenshot_20260918_180951.jpg) ---------------- */
        <div className="flex-1 flex flex-col px-4 pt-4 pb-8 overflow-y-auto">
          {/* Filter Pills */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIssuesFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                issuesFilter === 'all'
                  ? 'bg-white border-2 border-[#5F45FF] text-[#5F45FF] shadow-xs'
                  : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              All (0)
            </button>
            <button
              type="button"
              onClick={() => setIssuesFilter('open')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                issuesFilter === 'open'
                  ? 'bg-white border-2 border-[#5F45FF] text-[#5F45FF] shadow-xs'
                  : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Open (0)
            </button>
            <button
              type="button"
              onClick={() => setIssuesFilter('resolved')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                issuesFilter === 'resolved'
                  ? 'bg-white border-2 border-[#5F45FF] text-[#5F45FF] shadow-xs'
                  : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Resolved (0)
            </button>
          </div>

          {/* Telescope Illustration matching Screenshot_20260918_180951.jpg */}
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-10">
            <div className="w-56 h-48 relative flex items-center justify-center">
              {/* Soft lavender background cloud */}
              <div className="absolute inset-0 bg-[#EEF2FF]/70 rounded-[40%] blur-md" />

              {/* Telescope SVG Illustration */}
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full relative z-10"
                fill="none"
              >
                {/* Wind breeze lines */}
                <path
                  d="M120 90 C150 85 160 110 180 100"
                  stroke="#C7D2FE"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M100 110 C130 115 140 130 160 120"
                  stroke="#C7D2FE"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Stars */}
                <path
                  d="M45 105 L48 98 L51 105 L58 108 L51 111 L48 118 L45 111 L38 108 Z"
                  fill="#FCD34D"
                />
                <path
                  d="M130 108 L132 102 L134 108 L140 110 L134 112 L132 118 L130 112 L124 110 Z"
                  fill="#FCD34D"
                />
                <path
                  d="M62 145 L64 140 L66 145 L71 147 L66 149 L64 154 L62 149 L57 147 Z"
                  fill="#FCD34D"
                />

                {/* Tripod Legs */}
                <line
                  x1="85"
                  y1="105"
                  x2="65"
                  y2="175"
                  stroke="#6366F1"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <line
                  x1="85"
                  y1="105"
                  x2="85"
                  y2="178"
                  stroke="#5A4BDA"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <line
                  x1="85"
                  y1="105"
                  x2="105"
                  y2="175"
                  stroke="#6366F1"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Telescope Barrel */}
                <g transform="rotate(-35 85 105)">
                  {/* Lens Hood */}
                  <rect
                    x="95"
                    y="95"
                    width="28"
                    height="24"
                    rx="3"
                    fill="#818CF8"
                  />
                  {/* Main Cylinder */}
                  <rect
                    x="55"
                    y="98"
                    width="44"
                    height="18"
                    rx="2"
                    fill="#A5B4FC"
                  />
                  {/* Eyepiece */}
                  <rect
                    x="40"
                    y="102"
                    width="16"
                    height="10"
                    rx="1.5"
                    fill="#6366F1"
                  />
                  {/* Glass reflection */}
                  <ellipse cx="123" cy="107" rx="3" ry="12" fill="#4338CA" />
                </g>
              </svg>
            </div>

            <h3 className="mt-3 text-base font-bold text-neutral-800 tracking-tight">
              No issues found!
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};
