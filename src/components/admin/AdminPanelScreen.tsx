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
 *   StudentsTab.tsx      per-child academic record
 *   LoginCodesTab.tsx    per-phone 6-digit login codes (replaces SMS OTP)
 *   AnnouncementsTab.tsx shared feed
 *   DataTab.tsx          session, Firestore read budget, cache control
 *   ui.tsx               shared primitives
 */
import React, {useState} from 'react';
import {ArrowLeft, KeyRound, Lock, Megaphone, Database, Layers, Users} from 'lucide-react';
import type {AnnouncementItem, StudentProfile} from '../../types';
import type {Backend} from '../../lib/backend';
import type {AdminIdentity} from '../../lib/adminAuth';
import {AdminGate} from './AdminGate';
import {StudentsTab} from './StudentsTab';
import {LoginCodesTab} from './LoginCodesTab';
import {BatchesTab} from './BatchesTab';
import {AnnouncementsTab} from './AnnouncementsTab';
import {DataTab} from './DataTab';
import {Flash, useFlash} from './ui';

type TabId = 'batches' | 'students' | 'codes' | 'announcements' | 'data';

interface AdminPanelScreenProps {
  backend: Backend | null;
  mode: 'mock' | 'firebase';
  uid: string | null;
  admin: AdminIdentity | null;
  configError: string | null;
  students: StudentProfile[];
  announcements: AnnouncementItem[];
  onSaveStudent: (student: StudentProfile) => void;
  onDeleteStudent: (studentId: string) => void;
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
  students,
  announcements,
  onSaveStudent,
  onDeleteStudent,
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
    {id: 'students', label: 'Students', icon: <Users size={14} />},
    {id: 'codes', label: 'Login codes', icon: <KeyRound size={14} />},
    {id: 'announcements', label: 'Announcements', icon: <Megaphone size={14} />},
    {id: 'data', label: 'Data', icon: <Database size={14} />},
  ];

  return (
    <div className="w-full h-full bg-[#0a0b10] text-white flex flex-col select-none">
      <header className="shrink-0 border-b border-[#1c1d29]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={onBack} aria-label="Back" className="p-1.5 rounded-lg hover:bg-white/5">
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#181926] hover:bg-[#222436] border border-[#2f3246] text-neutral-300 text-xs font-semibold transition-colors"
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
                tab === t.id ? 'bg-[#8E75FF] text-white' : 'bg-[#181926] text-neutral-400 hover:text-white'
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
        {tab === 'batches' && backend && <BatchesTab backend={backend} flash={flash} />}

        {tab === 'students' && (
          <StudentsTab
            students={students}
            onSaveStudent={onSaveStudent}
            onDeleteStudent={onDeleteStudent}
            flash={flash}
          />
        )}

        {tab === 'codes' && backend && (
          <LoginCodesTab backend={backend} isFirebase={mode === 'firebase'} flash={flash} />
        )}

        {tab === 'announcements' && (
          <AnnouncementsTab
            announcements={announcements}
            onSaveAnnouncement={onSaveAnnouncement}
            onDeleteAnnouncement={onDeleteAnnouncement}
            flash={flash}
          />
        )}

        {tab === 'data' && backend && (
          <DataTab
            backend={backend}
            mode={mode}
            uid={uid}
            admin={admin}
            studentCount={students.length}
            announcementCount={announcements.length}
            configError={configError}
            flash={flash}
          />
        )}
      </div>
    </div>
  );
};
