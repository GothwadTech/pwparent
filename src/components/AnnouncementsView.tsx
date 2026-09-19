import React from 'react';
import { PWLogo } from './PWLogo';
import { AnnouncementItem } from '../types';

interface AnnouncementsViewProps {
  customLogoUrl?: string | null;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  customLogoUrl,
}) => {
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
    <div className="flex-1 px-4 pt-4 pb-8 overflow-y-auto space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {announcements.map((item) => (
        <div
          key={item.id}
          className="pb-6 border-b border-[#1c1e2d] last:border-b-0 space-y-3"
        >
          {/* Header with author, time and New badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Circular PW Logo */}
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                <PWLogo size={28} customLogoUrl={customLogoUrl} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {item.author}
                </h3>
                <p className="text-[11px] text-neutral-400">{item.timeAgo}</p>
              </div>
            </div>

            {item.isNew && (
              <span className="px-2 py-0.5 rounded-md bg-[#FFDC4A] text-[#1a1500] text-[10.5px] font-bold tracking-wider">
                New
              </span>
            )}
          </div>

          {/* Announcement content */}
          <div className="pl-12 space-y-1">
            <p className="text-[13px] text-neutral-200 leading-relaxed font-medium">
              {item.content}
            </p>
            <a
              href={item.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[13px] text-[#3B82F6] hover:text-[#60A5FA] underline break-all font-medium"
            >
              {item.videoLink}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};
