/**
 * Admin Panel shell — gate + tabs.
 *
 * The panel lives in `src/components/admin/` split across one file per tab so
 * nothing here approaches the 500-line ceiling:
 *
 *   AdminGate.tsx        username+password (firebase) / passcode (mock)
 *   BatchesTab.tsx       batch CRUD -> BatchDetailView
 *   BatchDetailView.tsx  one batch: Students / Attendance / Tests panels
 *   BatchMembersPanel.tsx     allot which children are in the batch
 *   BatchAttendancePanel.tsx  day-wise P/A/L per student
 *   BatchTestsPanel.tsx       test CRUD + structured syllabus
 *   TestResultsPanel.tsx      per-student marks on one test
 *   StudentDetailView.tsx     ONE child: record + batches + family login codes
 *   StudentCreatePanel.tsx    new child: parent picker + batch picker
 *   LoginCodesTab.tsx    per-phone 6-digit codes, embedded in a child's details
 *   AnnouncementsTab.tsx shared feed
 *   DataTab.tsx          session, Firestore read budget, cache control
 *   ui.tsx               shared primitives
 *
 * THE PANEL IS A DRILL-DOWN, NOT A ROW OF FLAT TABS. There is no top-level
 * "Students" tab and no top-level "Login codes" tab. You go Batches → one batch
 * → Students → one child, and that child's screen holds their academic record,
 * their batch memberships and their family's login codes together. A flat
 * Students tab could only ever show the children of whoever was signed in,
 * which is how an allotted child went "missing".
 */
import React, {useState} from 'react';
import {ArrowLeft, Lock, Database, Layers} from 'lucide-react';
import type {AnnouncementItem} from '../../types';
import type {Backend} from '../../lib/backend';
import type {AdminIdentity} from '../../lib/adminAuth';
import {AdminGate} from './AdminGate';
import {BatchesTab} from './BatchesTab';
import {DataTab} from './DataTab';
import {Flash, useFlash} from './ui';

type TabId = 'batches' | 'data';

interface AdminPanelScreenProps {
  backend: Backend | null;
  mode: 'mock' | 'firebase';
  uid: string | null;
  admin: AdminIdentity | null;
  configError: string | null;
  announcements: AnnouncementItem[];
  onSaveAnnouncement: (item: AnnouncementItem) => void;
  onDeleteAnnouncement: (id: string) => void;
  onBack: () => void;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  backend,
  mode,
  uid,
  admin,
  configError,
  announcements,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onBack,
}) => {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<TabId>('batches');
  const {notice, flash} = useFlash();

  if (!unlocked) {
    return (
      <AdminGate
        mode={mode}
        onBack={onBack}
        onAuthenticated={(identity) => {
          if (identity) flash(`Signed in as ${identity.username}.`);
          setUnlocked(true);
        }}
      />
    );
  }

  const tabs: {id: TabId; label: string; icon: React.ReactNode}[] = [
    {id: 'batches', label: 'Batches', icon: <Layers size={14} />},
    {id: 'data', label: 'Data', icon: <Database size={14} />},
  ];

  return (
    <div className="w-full h-full bg-[#FFFFFF] text-[#17181C] flex flex-col select-none">
      <header className="shrink-0 border-b border-[#E4E6EB]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={onBack} aria-label="Back" className="p-1.5 rounded-lg hover:bg-black/[0.03]">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight">Admin Panel</h1>
            <p className="text-[11px] text-neutral-500 truncate">
              {admin ? `${admin.username} · ` : ''}
              {mode === 'firebase' ? `Firestore · ${uid ?? 'no uid'}` : 'localStorage'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUnlocked(false)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#F1F2F4] border border-[#E4E6EB] text-neutral-700 text-xs font-semibold transition-colors"
            aria-label="Lock admin panel"
          >
            <Lock size={13} /> Lock
          </button>
        </div>

        <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-[#5A4BDA] text-white' : 'bg-white text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <Flash message={notice} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {tab === 'batches' && backend && <BatchesTab backend={backend} mode={mode} flash={flash} />}

        {tab === 'data' && backend && (
          <DataTab
            backend={backend}
            mode={mode}
            uid={uid}
            admin={admin}
            announcementCount={announcements.length}
            configError={configError}
            flash={flash}
          />
        )}
      </div>
    </div>
  );
};
