import React from 'react';
import { AnnouncementItem } from '../types';

interface AnnouncementsScreenProps {
  customLogoUrl?: string | null;
}

export const AnnouncementsScreen: React.FC<AnnouncementsScreenProps> = () => {
  const announcements: AnnouncementItem[] = [
    {
      id: '1',
      author: 'Physics Wallah team',
      timeAgo: '1 day ago',
      isNew: true,
      content:
        '⚡ ARJUNA NEET 4.0 2027 BEGINS! 🚀 | Your FIRST BOTANY CLASS with Harshit Sir is LIVE! 🎯 Link:-',
      videoLink: 'https://www.youtube.com/watch?v=VML7Mva43bY',
    },
    {
      id: '2',
      author: 'Physics Wallah team',
      timeAgo: '1 day ago',
      isNew: true,
      content:
        '⚡ ARJUNA NEET 4.0 2027 BEGINS! 🚀 | Your FIRST BOTANY CLASS with Harshit Sir is at 6:15 PM TODAY! 🎯 Link:-',
      videoLink: 'https://www.youtube.com/watch?v=VML7Mva43bY',
    },
  ];

  return (
    <div className="flex-1 bg-[#FFFFFF] text-[#17181C] flex flex-col overflow-y-auto select-none font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="divide-y divide-[#1e202f]">
        {announcements.map((item) => (
          <article
            key={item.id}
            className="px-5 py-5 hover:bg-[#FFFFFF] transition-colors"
          >
            {/* Author Header */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-3">
                {/* PW circular badge */}
                <div className="w-9 h-9 rounded-full bg-black border border-[#E4E6EB] flex items-center justify-center text-[#17181C] font-black text-xs shadow-xs">
                  PW
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#17181C] tracking-tight">
                    {item.author}
                  </h3>
                  <div className="text-[11px] text-neutral-600">
                    {item.timeAgo}
                  </div>
                </div>
              </div>

              {/* Yellow "New" badge matching screenshot */}
              {item.isNew && (
                <span className="px-2 py-0.5 rounded-md bg-[#FFD700] text-black text-[11px] font-extrabold tracking-wide uppercase shadow-xs">
                  New
                </span>
              )}
            </div>

            {/* Content text */}
            <p className="text-[13px] font-medium text-neutral-100 leading-relaxed pl-12">
              {item.content}
            </p>

            {/* Blue link */}
            <div className="pl-12 mt-1">
              <a
                href={item.videoLink}
                target="_blank"
                rel="noreferrer"
                className="text-[13px] text-[#3B82F6] hover:underline break-all font-medium inline-block"
              >
                {item.videoLink}
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
