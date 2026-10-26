/**
 * Admin → Announcements tab.
 *
 * Writes go to the shared `announcements` collection, which in firestore.rules
 * is readable by any signed-in visitor but writable only by a uid listed in
 * `admins/{uid}`. A denial here almost always means that document is missing.
 */
import React, {useState} from 'react';
import {Plus, Save, Trash2} from 'lucide-react';
import type {AnnouncementItem} from '../../types';
import {btnDanger, btnGhost, btnPrimary, Field, inputCls, Note} from './ui';

interface AnnouncementsTabProps {
  announcements: AnnouncementItem[];
  onSaveAnnouncement: (item: AnnouncementItem) => void;
  onDeleteAnnouncement: (id: string) => void;
  flash: (message: string) => void;
}

function blankAnnouncement(): AnnouncementItem {
  return {
    id: `a${Date.now().toString(36)}`,
    author: '',
    timeAgo: 'just now',
    isNew: true,
    content: '',
    videoLink: '',
  };
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
  announcements,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  flash,
}) => {
  const [draft, setDraft] = useState<AnnouncementItem | null>(null);

  return (
    <>
      <button type="button" className={`${btnGhost} w-full`} onClick={() => setDraft(blankAnnouncement())}>
        <Plus size={13} /> New announcement
      </button>

      {draft && (
        <div className="bg-white border border-[#5747D6]/40 rounded-xl p-3.5 space-y-2.5">
          <Field label="Author" htmlFor="ann-author">
            <input
              id="ann-author"
              className={inputCls}
              value={draft.author}
              onChange={(e) => setDraft({...draft, author: e.target.value})}
            />
          </Field>
          <Field label="Content" htmlFor="ann-content">
            <textarea
              id="ann-content"
              rows={3}
              className={inputCls}
              value={draft.content}
              onChange={(e) => setDraft({...draft, content: e.target.value})}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Time label" htmlFor="ann-time">
              <input
                id="ann-time"
                className={inputCls}
                value={draft.timeAgo}
                onChange={(e) => setDraft({...draft, timeAgo: e.target.value})}
              />
            </Field>
            <Field label="Video link" htmlFor="ann-link">
              <input
                id="ann-link"
                className={inputCls}
                value={draft.videoLink}
                onChange={(e) => setDraft({...draft, videoLink: e.target.value})}
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={btnPrimary}
              disabled={!draft.author.trim() || !draft.content.trim()}
              onClick={() => {
                onSaveAnnouncement({...draft, author: draft.author.trim(), content: draft.content.trim()});
                setDraft(null);
                flash('Announcement saved.');
              }}
            >
              <Save size={13} /> Publish
            </button>
            <button type="button" className={btnGhost} onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {announcements.length === 0 && <Note>No announcements yet.</Note>}

      {announcements.map((item) => (
        <div key={item.id} className="bg-white border border-[#E4E6EB] rounded-xl p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{item.author || '(no author)'}</p>
              <p className="text-[11px] text-neutral-500">{item.timeAgo}</p>
            </div>
            <button
              type="button"
              className={btnDanger}
              onClick={() => {
                onDeleteAnnouncement(item.id);
                flash('Announcement deleted.');
              }}
              aria-label="Delete announcement"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <p className="mt-2 text-[12px] text-neutral-700 leading-relaxed break-words">{item.content}</p>
          {item.videoLink && (
            <a
              href={item.videoLink}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1.5 inline-block text-[11px] text-[#5747D6] hover:underline truncate max-w-full"
            >
              {item.videoLink}
            </a>
          )}
        </div>
      ))}
    </>
  );
};
