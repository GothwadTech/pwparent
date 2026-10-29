import React from 'react';
import { PWLogo } from './PWLogo';
import { AnnouncementItem } from '../types';

interface AnnouncementsViewProps {
  customLogoUrl?: string | null;
  items?: AnnouncementItem[];
}

/**
 * Real PW Announcements matching the reference screenshots exactly.
 * Fixed in code as per instruction.
 */
const FIXED_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-1',
    author: 'Physics Wallah team',
    timeAgo: '1 month ago',
    isNew: false,
    content:
      'Learn simple, practical sleep strategies that every student can use during exam preparation.\n\n🔗 Register Now:\nhttps://www.healthgennie.com/download-app\n\nDon’t just study longer. Learn how to study smarter.\n\n👉 Download the Health Gennie App and register now.',
    videoLink: 'https://www.healthgennie.com/download-app',
    imageUrl: '/assets/announcements/sleep_webinar.jpg',
  },
  {
    id: 'ann-2',
    author: 'Physics Wallah team',
    timeAgo: '1 month ago',
    isNew: false,
    content:
      'Dear Vidyapeeth Students, Kindly Check the Weekly Schedule in the || Description Section || By Clicking || Calendar Icon 📅 || Keep Studying!! Physics Wallah is for you, by you and from you',
    imageUrl: '/assets/announcements/weekly_schedule.jpg',
  },
  {
    id: 'ann-3',
    author: 'Physics Wallah team',
    timeAgo: '1 month ago',
    isNew: false,
    content:
      'AITS - 2 (CBT) Test Time: (Check message on your Reg. Mobile No.) [Test@20-09-2026] [Test_Reminder] For more info click on below link:\nhttps://app.powerbi.com/view?r=eyJrIjoiMTRjNmJlZGU0MDJmNi00M2M1LTk5NWEtZjlmODJhZDY2YTgzIiwidCI6IjY5MzI3NDk3LWFjMTktNGU5MC1iYWI0LWY2NDVlOTY0YTM4ZiJ9',
    videoLink:
      'https://app.powerbi.com/view?r=eyJrIjoiMTRjNmJlZGU0MDJmNi00M2M1LTk5NWEtZjlmODJhZDY2YTgzIiwidCI6IjY5MzI3NDk3LWFjMTktNGU5MC1iYWI0LWY2NDVlOTY0YTM4ZiJ9',
  },
  {
    id: 'ann-4',
    author: 'Physics Wallah team',
    timeAgo: '1 month ago',
    isNew: false,
    content:
      "AITS - 2, [Test@20-09-2026] [Test_Syllabus] Please Check the Test Syllabus in the Test Planner in your batch's description section.",
    imageUrl: '/assets/announcements/syllabus.jpg',
  },
  {
    id: 'ann-5',
    author: 'Physics Wallah team',
    timeAgo: '1 month ago',
    isNew: false,
    content:
      'Milestone:7 (Offline) Test Time: (2:00 PM to 5:00 PM) [Test@13-09-2026] [Test_Reminder] For more info click on below link:\nhttps://app.powerbi.com/view?r=eyJrIjoiMTRjNmJlZGU0MDJmNi00M2M1LTk5NWEtZjlmODJhZDY2YTgzIiwidCI6IjY5MzI3NDk3LWFjMTktNGU5MC1iYWI0LWY2NDVlOTY0YTM4ZiJ9',
    videoLink:
      'https://app.powerbi.com/view?r=eyJrIjoiMTRjNmJlZGU0MDJmNi00M2M1LTk5NWEtZjlmODJhZDY2YTgzIiwidCI6IjY5MzI3NDk3LWFjMTktNGU5MC1iYWI0LWY2NDVlOTY0YTM4ZiJ9',
  },
  {
    id: 'ann-6',
    author: 'Physics Wallah team',
    timeAgo: '1 month ago',
    isNew: false,
    content:
      '🔗 Register Now:\nhttps://www.healthgennie.com/download-app\n\nDownload the Health Gennie App & register for the webinar.\nLimited Seats 🚀',
    videoLink: 'https://www.healthgennie.com/download-app',
    imageUrl: '/assets/announcements/nutrition_webinar.jpg',
  },
  {
    id: 'ann-7',
    author: 'Physics Wallah team',
    timeAgo: '1 month ago',
    isNew: false,
    content:
      'Dear Vidyapeeth Students, || Results Are Out!! || Kindly Check Your Milestone:7 Results in Test Series section of your batch. Keep Studying!! Physics Wallah is for you, by you and from you! [Test@13-09-2026] [Result_Published]',
  },
];

/** Helper to render text with highlighted clickable URLs */
function renderFormattedContent(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2563EB] hover:underline break-all font-medium"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  customLogoUrl,
}) => {
  const announcements = FIXED_ANNOUNCEMENTS;

  return (
    <div className="flex-1 w-full px-4 pt-4 pb-12 overflow-y-auto space-y-6 select-none bg-white">
      {announcements.map((item) => (
        <article
          key={item.id}
          className="pb-6 border-b border-[#E4E6EB] last:border-b-0 space-y-3"
        >
          {/* Header with author, logo, time and New badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 border border-[#E4E6EB]/50">
                <PWLogo size={32} customLogoUrl={customLogoUrl} />
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#111827] tracking-tight">
                  {item.author}
                </h3>
                <p className="text-[11px] text-[#6B7280]">{item.timeAgo}</p>
              </div>
            </div>

            {item.isNew && (
              <span className="px-2 py-0.5 rounded-md bg-[#FFDC4A] text-[#1a1500] text-[10px] font-bold tracking-wider">
                New
              </span>
            )}
          </div>

          {/* Announcement Text */}
          <div className="text-[13px] text-[#1F2937] leading-relaxed font-normal whitespace-pre-line pt-0.5">
            {renderFormattedContent(item.content)}
          </div>

          {/* 16:9 Banner Image (from screenshots) */}
          {item.imageUrl && (
            <div className="w-full aspect-[16/9] rounded-xl overflow-hidden mt-3 border border-[#E5E7EB]/60 bg-[#F3F4F6] shadow-2xs">
              <img
                src={item.imageUrl}
                alt="Announcement banner"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
        </article>
      ))}
    </div>
  );
};
