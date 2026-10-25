# Admin Panel — Demo Data Control

Ek passcode-gated screen jisse tum app ka academic record (students, marks,
tests, attendance, announcements, purchases) seed aur edit kar sakte ho —
Firestore ya console chhue bina.

---

## 1. Kaise kholein

Do tarike:

| Tarika | Kaise |
|---|---|
| **UI se** | App ke bottom-right corner pe chhota badge hai: `DEMO · mock · admin` → uspe **click** karo |
| **URL se** | `https://pwparent.pages.dev/#admin` (ya local: `http://localhost:3000/#admin`) |

Badge ka dot colour backend batata hai:
- 🟡 **yellow** = `mock` mode (localStorage, koi Firebase nahi)
- 🟢 **green** = `firebase` mode (real Firestore)

Panel se bahar aane pe tum us screen pe wapas jate ho jahan se aaye the.

---

## 2. Passcode

```
Default: pw-admin-demo
```

Badalna ho to `VITE_ADMIN_PASSCODE` set karo (`.env.local` locally, Cloudflare
Pages dashboard me deployed site ke liye) → phir **Retry deployment**.

Session `sessionStorage` me rehta hai, `localStorage` me nahi — matlab **tab
band karte hi admin logout**. Lock button se manually bhi lock kar sakte ho.

---

## 3. ⚠️ Ye REAL security nahi hai — padh lo

Ye ek **client-side SPA** hai. `VITE_ADMIN_PASSCODE` ko Vite **JS bundle me
inline** kar deta hai, jo har browser download karta hai. Matlab:

- ✅ Casual visitor panel me nahi ghus payega
- ❌ Jo DevTools khol ke bundle padh lega, use passcode mil jayega

**Ye jaan-boojh ke aisa hai** — demo/portfolio build ke liye passcode gate
kaafi hai. Par agar ye app kabhi real users tak jaye, to **real
authorisation `firestore.rules` me hai**, passcode me nahi:

```
match /announcements/{id} {
  allow read:           if signedIn();
  allow create, update: if isAdmin();   // isAdmin() = admins/{uid} doc exists
}
```

Real admin banane ke liye Firebase Console → Firestore → `admins/<your-uid>`
document banao. Rules me `admins/{uid}` pe `write: if false` hai, isliye
**app khud ko promote nahi kar sakti** — sirf console se hi admin banta hai.

> Ek aur baat: admin panel **signed-in uid ka apna data** edit karta hai.
> Kisi *doosre* user ka data edit karne ki koshish rules block kar denge.
> Ye design deliberate hai.

---

## 4. Kya-kya edit kar sakte ho

### Tab: **Students**

Har student card expand hota hai:

| Field | Type | Note |
|---|---|---|
| Name | text | LinkedAccounts + Profile screen pe turant dikhta hai |
| Batch | text | |
| Course | text | |
| Attendance % | number | Auto-formats to `"96%"` |
| Video watch % | number | Auto-formats |
| DPPs done | number | |
| Total tests | number | Scorecard ka denominator |

**Test records** (har student ke andar):
- Add / delete tests
- Title, date, mode (`Online`/`Offline`), status (`Attempted`/`Missed`)
- **Marks obtained**, **Out of**, **Accuracy %**

Plus **Add student** (naya bachcha) aur **Delete** (poora record).

### Tab: **Announcements**
Shared feed — create, edit, delete. Firestore mode me ye write `admins/{uid}`
rule ke through jata hai, isliye bina admin doc ke `permission-denied` aayega
(app demo feed pe fallback kar jata hai, crash nahi karta).

### Tab: **Data**
- Backend mode + current `uid` + record counts
- **Seed demo data** — poora dataset wipe karke shipped seed wapas likh deta
  hai (Firestore me atomic batch se, taaki UI kabhi half-written list na
  dikhaye)
- **Clear local demo store** (sirf mock mode) — browser ka sab kuch hata deta hai
- Demo build notice

---

## 5. Derived fields — direct edit nahi hote

Ye 4 cheezein admin **bharta nahi**, ye automatically calculate hoti hain:

| Field | Kaise derive hota hai |
|---|---|
| `testsCompleted` | `status === 'ATTEMPTED'` wale tests ki count |
| `avgScorePercent` | sirf ATTEMPTED tests ka average (MISSED average ko neeche **nahi** kheenchta) |
| `accuracyPercent` | waise hi, accuracy ka |
| per-test `scorePercent` | `marksObtained / marksTotal × 100`, clamped 0–100 |

Logic: `src/lib/admin.ts` → `recomputeStudent()`. Har save pe chalta hai.

**Kyun:** iska matlab admin panel se aisa scorecard kabhi nahi ban sakta jo
apne aap se contradict kare — jaise "0/17 attempted, 0% average" ke saath
bhara hua marks list. Ye ek *test-covered invariant* hai
(`src/tests/admin.spec.ts`).

Edge cases jo handle hain:
- `marksTotal = 0` ya missing → `scorePercent` undefined (NaN nahi)
- Negative marks → 0 pe clamp
- 100 se zyada → 100 pe clamp
- Khali test list → averages 0, NaN nahi

---

## 6. Kahan dikhta hai (aur kahan abhi nahi)

### ✅ Wired — admin ke edits turant render hote hain
| Screen | Kya |
|---|---|
| `LinkedAccountsScreen` | student name, batch |
| `ProfileScreen` | student name, selection |
| `StudentDashboardView` | Total Tests Attempted `n/m`, progress bar, Avg. Score, Accuracy, Recent Tests list (date • mode • **marks**, green/red status badge) |
| `AnnouncementsView` | poora feed |
| `PurchasesScreen` | poora list + filters |

### ⚠️ Abhi bhi hardcoded (deliberately chhoda gaya)
| Component | Kya |
|---|---|
| `OfflineAttendanceDashboardView` | day-wise attendance calendar, ring % |
| `SubjectDetailsModal` | subject-wise lecture/DPP counts |
| `StudentDashboardView` (lectures section) | Lectures Completed, Chapters |

Reason: ye original AI Studio export ke 38 components hain jinke andar sample
data hardcoded hai. Poora refactor risky tha, isliye sirf high-value paths
wire kiye gaye. Follow-up me inhe bhi data-driven banaya ja sakta hai —
pattern wahi hai jo `PurchasesScreen`/`AnnouncementsView` me use hua:
**optional `items?` prop jiska default built-in list ho** (non-breaking).

### 🗑️ Orphan components (original export se unused)
`AnnouncementsScreen`, `BottomNavBar`, `ContactSupportModal`, `MainAppHeader`,
`StatusBar`, `StudentLecturesDashboard`, `StudentTestsDashboard`,
`SupportScreen` — inhe koi import nahi karta. Chheda nahi gaya.

---

## 7. Persistence — kahan save hota hai

| Mode | Kahan | Reload pe |
|---|---|---|
| `mock` | `localStorage` key `pwparent.demo.v1` | ✅ rehta hai |
| `firebase` | Firestore `parents/{uid}/...` | ✅ rehta hai (uid Anonymous Auth se persist hota hai) |

Mock mode me storage fail hone pe (private browsing, quota full) app crash
nahi karti — `demoStore.ts` quietly degrade kar deta hai aur session bhar ka
data memory me rehta hai.

---

## 8. Files

| File | Kaam |
|---|---|
| `src/lib/admin.ts` | passcode gate, marks maths, `recomputeStudent()` |
| `src/components/AdminPanelScreen.tsx` | poora panel UI |
| `src/components/DemoBadge.tsx` | badge + entry point |
| `src/lib/backend/index.ts` | `saveStudent` / `deleteStudent` / `saveAnnouncement` / `seedDemoData` |
| `src/lib/backend/demoStore.ts` | mock-mode localStorage layer |
| `src/tests/admin.spec.ts` | 20 tests — gate + maths + invariants |
| `firestore.rules` | real authorisation (`admins/{uid}`) |
