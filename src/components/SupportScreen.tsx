import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { FaqItem } from '../types';

interface SupportScreenProps {
  onContactUs: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({ onContactUs }) => {
  const [subTab, setSubTab] = useState<'help' | 'issues'>('help');
  const [issueFilter, setIssueFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(
    'payment_failed'
  );
  const [showAllFaqs, setShowAllFaqs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});

  const faqs: FaqItem[] = [
    {
      id: 'where_order',
      question: 'Where is my order? How do I track my books / kit / welcome kit?',
      answer: [
        '1. Go to "My Orders" in the app menu to check real-time courier tracking.',
        '2. Delivery usually takes 5-7 working days after dispatch.',
        '3. You will receive an SMS with tracking AWB once shipped.',
      ],
    },
    {
      id: 'wrong_batch',
      question: 'I bought the wrong batch / I want to switch batches.',
      answer: [
        'Batch switches are allowed within 7 days of purchase.',
        'Please submit a request via My Issues tab with your registered number.',
      ],
    },
    {
      id: 'cant_access',
      question: 'I can’t access my batch or classes after buying.',
      answer: [
        'Please ensure you are logged in with the same mobile number used during purchase.',
        'Restart the app to refresh your batch enrollment.',
      ],
    },
    {
      id: 'library_doubt',
      question: 'How do I use Library and Ask Doubt?',
      answer: [
        'Open your batch, tap "Doubt Engine" or tap the question mark while watching any lecture.',
        'Our teaching assistants respond with detailed solutions.',
      ],
    },
    {
      id: 'planner',
      question: 'How do I find / use the Planner (study schedule)?',
      answer: [
        'The Planner is available directly on your child’s dashboard under study schedule.',
      ],
    },
    {
      id: 'test_series',
      question: 'How do I attempt the test series / my test or result isn’t showing?',
      answer: [
        'Tests unlock exactly at the scheduled time mentioned in the batch timetable.',
        'Results with rank analysis appear within 2 hours of test submission.',
      ],
    },
    {
      id: 'change_number',
      question: 'I want to change my registered phone number / device',
      answer: [
        'For account security, phone number updates require OTP verification on your current number.',
      ],
    },
    {
      id: 'payment_failed',
      question: 'My payment failed or money was deducted without confirmation',
      answer: [
        '1. If it shows “Payment Failed”, we haven’t received the payment — any debited amount is auto-reversed by your bank/UPI app.',
        '2. Wait at least 24 hours before retrying; gateway/network delays are common.',
        '3. Do NOT pay again immediately — first check My Orders to see if an order was created.',
        '4. If money was debited and no order appears after 24 hours, contact your bank/payment app, and Raise a Ticket with your transaction reference.',
      ],
      isHelpfulPrompt: true,
    },
    {
      id: 'live_class',
      question: 'A live class isn’t playing / where are recorded classes?',
      answer: [
        'Recorded lectures are uploaded under the "Lectures" tab within 4 hours after the live stream concludes.',
      ],
    },
    {
      id: 'refund_policy',
      question: 'How do I request a refund and how long does it take?',
      answer: [
        'Refund requests are subject to PW policy. Once approved, the amount is refunded to original source in 5-7 banking days.',
      ],
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedFaqs = showAllFaqs ? filteredFaqs : filteredFaqs.slice(0, 4);

  return (
    <div className="flex-1 bg-white text-[#1a1a1a] flex flex-col overflow-hidden select-none">
      {/* Sub Tabs: Help Centre vs My Issues */}
      <div className="flex items-center border-b border-neutral-200 bg-white sticky top-0 z-10">
        <button
          type="button"
          onClick={() => setSubTab('help')}
          className={`flex-1 py-3 text-center text-xs font-bold transition-all relative ${
            subTab === 'help' ? 'text-[#5F45FF]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span>Help Centre</span>
          {subTab === 'help' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5F45FF]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('issues')}
          className={`flex-1 py-3 text-center text-xs font-bold transition-all relative ${
            subTab === 'issues' ? 'text-[#5F45FF]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span>My Issues</span>
          {subTab === 'issues' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5F45FF]" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {subTab === 'help' ? (
          <div className="p-4 space-y-4">
            {/* Search Bar matching screenshot */}
            <div className="relative rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 flex items-center shadow-2xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type your query here..."
                className="flex-1 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none bg-transparent"
              />
              <Search size={17} className="text-neutral-500 shrink-0 ml-2" />
            </div>

            {/* Heading */}
            {!searchQuery && !showAllFaqs && (
              <h2 className="text-sm font-bold text-neutral-800 pt-1">
                Tell us how we can help 👋
              </h2>
            )}

            {/* Accordion FAQ list */}
            <div className="space-y-2.5">
              {displayedFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-xl border border-neutral-200/90 bg-[#F9FAFC] overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedFaqId(isExpanded ? null : faq.id)
                      }
                      className="w-full p-3.5 text-left flex items-start justify-between space-x-3"
                    >
                      <span className="text-[13px] font-semibold text-neutral-800 leading-snug">
                        {faq.question}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-neutral-600 shrink-0 mt-0.5" />
                      ) : (
                        <ChevronDown size={18} className="text-neutral-600 shrink-0 mt-0.5" />
                      )}
                    </button>

                    {/* Answer content (matching Screenshot_20260918_180944.jpg) */}
                    {isExpanded && faq.answer && (
                      <div className="px-4 pb-4 pt-1 text-xs text-neutral-600 leading-relaxed border-t border-neutral-200/60 bg-white">
                        <div className="space-y-2 pt-2">
                          {faq.answer.map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>

                        {/* Was this information helpful? prompt */}
                        {faq.isHelpfulPrompt && (
                          <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-neutral-700">
                              Was this information helpful?
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setFeedbackGiven((prev) => ({
                                    ...prev,
                                    [faq.id]: 'up',
                                  }))
                                }
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-colors ${
                                  feedbackGiven[faq.id] === 'up'
                                    ? 'bg-emerald-100 ring-2 ring-emerald-400'
                                    : 'bg-neutral-100 hover:bg-neutral-200'
                                }`}
                                title="Helpful"
                              >
                                👍
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFeedbackGiven((prev) => ({
                                    ...prev,
                                    [faq.id]: 'down',
                                  }))
                                }
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-colors ${
                                  feedbackGiven[faq.id] === 'down'
                                    ? 'bg-rose-100 ring-2 ring-rose-400'
                                    : 'bg-neutral-100 hover:bg-neutral-200'
                                }`}
                                title="Not helpful"
                              >
                                👎
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show More / Show Less Button matching screenshot */}
            <div className="pt-1 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllFaqs(!showAllFaqs)}
                className="flex items-center space-x-1 text-xs font-bold text-[#5F45FF] hover:underline"
              >
                <span>{showAllFaqs ? 'Show Less' : 'Show More'}</span>
                {showAllFaqs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Still need help, Have Queries Card matching Screenshot_20260918_180944.jpg */}
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs flex items-center justify-between">
              <div className="flex-1 pr-3">
                <h3 className="text-sm font-bold text-neutral-900">
                  Still need help, Have Queries
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Have Queries? Please get in touch &amp; we will happy to help you
                </p>
                <button
                  type="button"
                  onClick={onContactUs}
                  className="mt-3 px-4 py-2 rounded-lg bg-[#5F45FF] text-white text-xs font-bold hover:bg-[#5037e8] transition-colors shadow-xs"
                >
                  Contact Us
                </button>
              </div>

              {/* Support team graphics */}
              <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-2xl">
                ⚙️👩‍💼
              </div>
            </div>
          </div>
        ) : (
          /* My Issues Tab matching Screenshot_20260918_180951.jpg */
          <div className="flex flex-col min-h-full">
            {/* Filter Pills */}
            <div className="px-4 pt-4 pb-3 flex items-center space-x-2 border-b border-neutral-100 bg-white">
              {(['all', 'open', 'resolved'] as const).map((filter) => {
                const label =
                  filter === 'all'
                    ? 'All (0)'
                    : filter === 'open'
                    ? 'Open (0)'
                    : 'Resolved (0)';
                const isSelected = issueFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setIssueFilter(filter)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all text-center ${
                      isSelected
                        ? 'border border-[#8E75FF] bg-[#F5F3FF] text-[#5F45FF]'
                        : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Empty State Vector Illustration matching Screenshot_20260918_180951.jpg */}
            <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="w-56 h-44 relative flex items-center justify-center mb-6">
                {/* Soft backdrop blob */}
                <div className="absolute inset-0 bg-[#EEF2FF] rounded-[48px] opacity-80" />

                {/* Telescope Vector Graphic */}
                <svg
                  className="relative z-10 w-36 h-36"
                  viewBox="0 0 160 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Tripod Legs */}
                  <path
                    d="M75 85 L50 140"
                    stroke="#7C8BA1"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M80 85 L80 145"
                    stroke="#506176"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M85 85 L110 140"
                    stroke="#7C8BA1"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* Wind Swirls */}
                  <path
                    d="M100 80 C115 75 130 90 140 85"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M85 100 C105 90 120 115 145 105"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Telescope Body */}
                  <rect
                    x="42"
                    y="70"
                    width="65"
                    height="20"
                    rx="6"
                    transform="rotate(-35 42 70)"
                    fill="#818CF8"
                  />
                  <rect
                    x="86"
                    y="39"
                    width="26"
                    height="28"
                    rx="7"
                    transform="rotate(-35 86 39)"
                    fill="#6366F1"
                  />
                  <ellipse
                    cx="108"
                    cy="23"
                    rx="7"
                    ry="14"
                    transform="rotate(-35 108 23)"
                    fill="#A5B4FC"
                  />

                  {/* Sparkles */}
                  <path
                    d="M32 82 L34 76 L36 82 L42 84 L36 86 L34 92 L32 86 L26 84 Z"
                    fill="#FBBF24"
                  />
                  <path
                    d="M125 82 L126.5 78 L128 82 L132 83.5 L128 85 L126.5 89 L125 85 L121 83.5 Z"
                    fill="#FBBF24"
                  />
                </svg>
              </div>

              <h3 className="text-base font-bold text-neutral-800 tracking-tight">
                No issues found!
              </h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
