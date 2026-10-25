import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PurchaseItem } from '../types';

interface PurchasesScreenProps {
  onBack: () => void;
  /**
   * Optional data source (Backend facade -> Firestore / demo store).
   * When omitted the built-in demo list below is used, so every existing
   * call site keeps rendering exactly what it did before.
   */
  items?: PurchaseItem[];
}

export const PurchasesScreen: React.FC<PurchasesScreenProps> = ({ onBack, items }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'successful' | 'pending'>('all');

  const builtinPurchases: PurchaseItem[] = [
    {
      id: '1',
      title: 'MISSION 30 NEET 2026',
      date: 'Jun 13, 2026',
      status: 'successful',
      totalItem: 1,
      price: 'Free',
      category: 'Crash Course',
      imageBg: 'from-blue-600 to-indigo-700',
    },
    {
      id: '2',
      title: 'NEET Mind Map 2025',
      date: 'May 12, 2025',
      status: 'successful',
      totalItem: 1,
      price: 'Free',
      category: 'Study Material',
      imageBg: 'from-sky-500 to-cyan-600',
    },
    {
      id: '3',
      title: 'Umeed NEET English',
      date: 'May 10, 2025',
      status: 'successful',
      totalItem: 1,
      price: 'Free',
      category: 'Batch',
      imageBg: 'from-amber-600 to-rose-700',
    },
  ];

  // Optional data source wins; otherwise render exactly what shipped before.
  const purchases = items ?? builtinPurchases;

  const filteredPurchases = purchases.filter((p) => {
    if (activeFilter === 'successful') return p.status === 'successful';
    if (activeFilter === 'pending') return p.status === 'pending';
    return true;
  });

  return (
    <div className="relative w-full h-full min-h-screen bg-[#F7F8FA] text-[#1a1a1a] flex flex-col justify-between overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header matching Screenshot_20260918_180831.jpg */}
      <div className="w-full px-4 pt-4 pb-3 flex items-center bg-white border-b border-neutral-200 z-20">
        <button
          type="button"
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-900 hover:text-neutral-600 transition-colors flex items-center justify-center"
          aria-label="Back"
        >
          <ChevronLeft size={26} strokeWidth={2.4} />
        </button>
        <h1 className="ml-2 text-lg font-bold text-neutral-900 tracking-tight">
          Purchases
        </h1>
      </div>

      {/* Filter Tabs matching screenshot */}
      <div className="px-5 pt-4 pb-2 bg-white flex items-center space-x-2.5 overflow-x-auto border-b border-neutral-100">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeFilter === 'all'
              ? 'bg-[#5F45FF] text-white shadow-xs'
              : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          All (3)
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('successful')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeFilter === 'successful'
              ? 'bg-[#5F45FF] text-white shadow-xs'
              : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          Successful (3)
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeFilter === 'pending'
              ? 'bg-[#5F45FF] text-white shadow-xs'
              : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          Pending (0)
        </button>
      </div>

      {/* Purchase Cards List or Empty State matching Screenshot_20260918_180859.jpg */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto flex flex-col">
        {filteredPurchases.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-10 text-center">
            {/* Trolley Cart Graphic */}
            <div className="w-56 h-48 relative flex items-center justify-center mb-2">
              {/* Soft purple/cyan backdrop */}
              <div className="absolute w-44 h-44 rounded-full bg-indigo-50/80 -z-0" />

              <svg viewBox="0 0 200 200" className="w-44 h-44 z-10" fill="none">
                {/* Wind motion lines */}
                <path d="M40 95 H20" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
                <path d="M50 120 H15" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 4" />
                <path d="M45 145 H25" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />

                {/* Suitcase Body */}
                <rect x="70" y="60" width="85" height="100" rx="16" fill="#38BDF8" />
                {/* Suitcase front pocket */}
                <rect x="80" y="75" width="65" height="40" rx="8" fill="#0284C7" />
                <rect x="80" y="125" width="65" height="24" rx="6" fill="#0369A1" />
                {/* Zipper details */}
                <line x1="80" y1="95" x2="145" y2="95" stroke="#BAE6FD" strokeWidth="2" strokeDasharray="2 2" />

                {/* Handle bars */}
                <path d="M100 60 V30 H125 V60" stroke="#64748B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="95" y="24" width="35" height="8" rx="4" fill="#334155" />

                {/* Luggage Wheels */}
                <circle cx="85" cy="166" r="7" fill="#334155" />
                <circle cx="85" cy="166" r="3" fill="#94A3B8" />
                <circle cx="140" cy="166" r="7" fill="#334155" />
                <circle cx="140" cy="166" r="3" fill="#94A3B8" />

                {/* Ground shadow */}
                <ellipse cx="112" cy="176" rx="45" ry="5" fill="#E2E8F0" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
              No Orders found!
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              Looks like you haven&apos;t made your order yet
            </p>

            <button
              type="button"
              onClick={onBack}
              className="mt-6 px-8 py-3 rounded-xl bg-[#5F45FF] hover:bg-[#4d35e0] text-white font-bold text-xs shadow-md transition-colors"
            >
              Explore Now
            </button>
          </div>
        ) : (
          filteredPurchases.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs"
            >
              {/* Status and Date Header */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={15} strokeWidth={2.6} />
                </div>
                <span className="text-xs font-semibold text-emerald-700">
                  Successful
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 mb-3 pl-7 -mt-2">
                {item.date}
              </div>

              {/* Item Card Box */}
              <div className="bg-[#F8F9FB] rounded-xl p-3 flex items-center space-x-3.5 hover:bg-[#F0F2F6] transition-colors cursor-pointer">
                {/* Course Badge Thumbnail */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.imageBg} p-1.5 flex flex-col justify-between text-white shrink-0 shadow-xs relative overflow-hidden`}
                >
                  <div className="text-[7px] font-black uppercase tracking-wider opacity-90">
                    PW
                  </div>
                  <div className="text-[9px] font-bold leading-tight line-clamp-2">
                    {item.title}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-white/20 rounded-full blur-xs" />
                </div>

                {/* Course Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-neutral-900 truncate">
                    {item.title}
                  </h3>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-neutral-500">
                    <span>
                      Total Item: <strong className="text-neutral-800 font-semibold">{item.totalItem}</strong>
                    </span>
                    <span>
                      Total Price:{' '}
                      <strong className="text-emerald-600 font-bold">
                        {item.price}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight size={18} className="text-neutral-400 shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
