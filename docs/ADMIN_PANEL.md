# Admin Panel

Ek hi administrator. Username + password. Firebase mode me real authentication,
mock mode me local passcode.

> **Security ki poori tasveer** — login codes, PBKDF2, permanent admin, read
> budget — [`docs/SECURITY.md`](./SECURITY.md) me hai. Ye file sirf *use* karna
> sikhata hai.

---

## 1. Kaise kholein

Do raste, dono hamesha available:

| Rasta | Kahan |
|---|---|
| **Settings dock** | Bottom-right corner ka chhota pill (`🟢 firebase` / `🟡 mock`) → **Admin Panel** |
| **URL hash** | `https://pwparent.pages.dev/#admin` |

Settings dock ne purana `DEMO` badge replace kiya hai. Wo ab live backend mode
bhi dikhata hai aur wahi entry point hai "doosre number se login" ka.

---

## 2. Login — mode ke hisaab se alag

### Firebase mode (production)

**Username + password.** Pehli baar kholne par form *registration* dikhata hai;
uske baad hamesha sirf *login*.

```
Username  3-30 chars: a-z 0-9 . - _
Password  min 8 chars, ek letter + ek digit zaroori
```

Password **Firebase Authentication** me rehta hai (Email/Password provider).
Firestore me sirf role marker `admins/{uid}` hai — password ka koi trace nahi,
hash bhi nahi. Username ek synthetic address ban jata hai:
`<username>@admin.pwparent.local` (local domain, koi mail nahi jaata).

> ### ⚠️ Jo pehle register karega, wahi admin banega — hamesha ke liye
>
> Ye feature hai, bug nahi. `admins/{uid}` create hone ki ijazat sirf tab hai
> jab `adminConfig/singleton` exist nahi karta, aur registration dono documents
> ek hi atomic batch me likhti hai. Pehla admin bante hi window band.
>
> **Deploy ke turant baad khud register karo.** Warna koi aur ban jayega aur app
> se undo nahi hoga.
>
> Reset karna ho to console se: Firebase → Authentication → Users me user
> delete karo **aur** Firestore me `adminConfig/singleton` + `admins/{uid}`
> delete karo. Dono, warna slot band hi rahega.

**Zaroori:** Authentication → Sign-in method me **Anonymous** aur
**Email/Password** dono enabled hon. Anonymous isliye zaroori hai kyunki
registration anonymous session ko `linkWithCredential` se upgrade karti hai —
uid wahi rehta hai, us visit me bana data orphan nahi hota.

### Mock mode (dev + tests)

Firebase nahi hai, isliye Email/Password provider bhi nahi. Panel
`VITE_ADMIN_PASSCODE` (default `pw-admin-demo`) maangta hai.

> Ye passcode Vite se **public JS bundle me inline** ho jata hai. Koi bhi padh
> sakta hai. Mock mode me real data hota hi nahi, isliye ye sirf UI friction
> hai — security nahi.

---

## 3. Tabs

### Batches — poora academic flow ⭐

Sabse bada tab, aur default. Isi me wo flow hai jo tumne maanga tha:
**batch banao → students allot karo → attendance manage karo → test banao →
har bachche ke marks bharo.**

Model **batch-centric** hai: attendance batch ki hoti hai, test batch ka hota
hai, aur test ke andar **batch ke saare allotted students** ki rows aati hain —
kisi ek bachche ke andar test nahi rehta.

#### Step 1 — Batch create karo

`Create batch` → naam, course, start date, type (Online/Offline), aur
"Visible to parents" (`No` = draft, parents ko nahi dikhega).

#### Step 2 — Students allot karo

Batch kholo → **Students** panel → `Allot students`. Picker me **har parent ke
saare bachche** aate hain, search ke saath. Multi-select → `Allot`.

> ⚠️ Picker tabhi bharega jab kam se kam ek parent sign in karke bachcha add
> kar chuka ho. Students `parents/{uid}/children` me rehte hain jo sirf wo
> parent bana sakta hai — admin naya student *create* nahi karta, sirf **allot**
> karta hai.

Allotment ek parent ke liye **ek document** hai (`members/{parentUid}` →
`studentIds[]`), isliye doosra bachcha allot karne pe pehla drop nahi hota.
Panel merge khud karta hai.

#### Step 3 — Attendance (din-ba-din)

**Attendance** panel → mahina chuno (◀ ▶). Har student ki line me us mahine ka
% dikhta hai. Student pe tap karo → **poora month calendar**.

Ek din pe tap karne se cycle chalta hai:

```
unmarked → P (present) → A (absent) → L (late) → unmarked
```

Clear karna ek first-class state hai — galat entry undo karne ka tareeka.
`Mark everyone present today` se ek tap me poore batch ki aaj ki attendance.

**Percentage ka rule:** unmarked din denominator me **nahi** ginte. Matlab
mahine ke shuru me "3 din present" = 100%, 10% nahi — warna chalta mahina
hamesha absent dikhta. **Late = present** gina jata hai.

#### Step 4 — Test banao

**Tests** panel → `Create test` → title, date, mode, **total marks**, status
(scheduled/completed).

**Syllabus structured hai**, ek text blob nahi. Har line: `subject` + `topic` +
`weightage %`. Neeche live total dikhta hai, aur 100% na banne par amber
warning.

#### Step 5 — Marks bharo

Test pe tap karo → **batch ke saare allotted students** ki rows, chahe marks
bhare ho ya na ho. Jo enter nahi hua wo "Not entered yet" dikhata hai — koi
bachcha chup-chaap gayab nahi hota.

Har row: marks obtained, accuracy %, status (Attempted/Missed) → `Save`.
Upar summary: entered/total, attempted, class average, top score. Syllabus
subject-wise grouped.

> **Percentages type nahi hote.** `scorePercent` backend me
> `marksObtained / test.marksTotal` se derive hota hai — caller use bhej hi
> nahi sakta, parameter type me hai hi nahi. Test ke total marks badalne pe
> agle save se saare scores dobara derive ho jate hain. Wahi invariant jo
> `recomputeStudent()` student scorecard pe lagata hai.

> **Delete cascade karta hai.** Test delete → uski saari result rows bhi.
> Batch delete → members, attendance, tests, results sab. Firestore cascade
> nahi karta, isliye code explicitly karta hai — warna orphan subcollections
> console me dikhte bhi nahi aur storage gher te rehte hain.

#### Parents ko kya dikhta hai

Parent apne bachche ke dashboard pe wahi batch selector dekhta hai, par **sirf
un batches ke saath jisme uska bachcha allot hai**. Andar: attendance calendar
(apne bachche ka), tests (batch ke saare — title, date, syllabus), aur marks
**sirf apne bachche ke**.

> **Rank deliberately nahi dikhta.** Rank nikalne ke liye poore class ke marks
> chahiye, aur rules ek parent ko sirf **apne bachche ka** result padhne dete
> hain (`list` admin-only hai). Isliye rank ki jagah attendance % dikhta hai —
> real, aur parent use dekhne ka haq rakhta hai. Nakli rank dikhana usse bura
> hota.

### Students — academic record

Har student ka card expand hota hai. Editable:

- name, batch, course
- attendance %, video watch %
- DPPs done, total tests
- **test records** — title, date, mode (Online/Offline), status
  (Attempted/Missed), marks obtained, marks total, accuracy %

Har save par `recomputeStudent()` (`src/lib/admin.ts`) derived figures dobara
calculate karta hai.

### Login codes — OTP ka replacement ⭐

Ye naya tab hai aur sabse zaroori.

**Koi SMS nahi jaata.** Admin ek number ke liye fixed 6-digit code set karta
hai — number username hai, code password.

1. Phone number daalo (10 digits)
2. Code daalo, ya 🔄 se random generate karo
3. **Save code** — hashing me ek second lagta hai, jaan-boojh kar (210 000
   PBKDF2 rounds)

Neeche registered numbers ki list hai: number + kab bana. **Code kabhi nahi
dikhta** — list me sirf metadata aata hai.

- **Replace** → number + naya random code pre-fill kar deta hai; Save dabao
- 🗑️ → us number ka code delete (wo number phir login nahi kar sakta)

Firestore me sirf digest jaata hai:

```json
{"v":1,"salt":"…","iterations":210000,"hash":"…","createdAt":"…"}
```

Fresh 16-byte salt per code, phone number pepper ki tarah mix, constant-time
verify. Details [`SECURITY.md §2`](./SECURITY.md).

> **Pehla kaam ye karo:** apne number ka code issue karo, phir login karke
> dekho. Jab tak koi code exist nahi karta, **koi login nahi kar sakta** — ye
> intentional hai, peeche koi demo data nahi hai.

### Announcements

Shared feed. `announcements/{id}` — har signed-in visitor padh sakta hai, sirf
admin likh sakta hai. Author, content, time label, video link.

Yahan write fail ho to matlab `admins/{uid}` document missing hai — rules me
`isAdmin()` wahi check karta hai.

### Data — diagnostics

- **Session**: mode, admin username, uid, students/announcements count
- **Firestore reads**: network reads, cache hits, hit rate, cached keys

  Spark plan = **50 000 reads/din, sab visitors me banta hua**. Ye counter
  isliye hai ki read cache ka asar assume na karo, dekho. Deploy ke baad
  `hitRate` check karo — kam ho to koi cheez cache ke bahar padh rahi hai.
- **Clear read cache** — sirf cached reads, stored data safe
- **Delete all local data** — mock mode only, destructive, alag button jaan
  boojh kar
- **Sign out of admin account** — firebase mode me

---

## 4. Derived fields — direct edit nahi hote

`testsCompleted`, `avgScorePercent`, `accuracyPercent`, aur har test ka
`scorePercent` **type nahi kiye ja sakte**. `recomputeStudent()` inhe raw marks
se banata hai.

Iska matlab scorecard kabhi khud se contradict nahi kar sakta: agar 3 tests
attempted hain to counter 3 hi dikhega, aur average unhi 3 ke marks se aayega.

⚠️ **Ordering matter karti hai.** `recomputeStudent()` pehle `tests[]` ko
enrich karta hai (raw marks → `scorePercent`), *phir* average leta hai —
kyunki `averageScore()` sirf un tests ko ginta hai jinka `scorePercent` number
hai. Ulti order me average hamesha `0` aayega. Ye bug already fix hai; wapas
mat badalna.

---

## 5. Persistence

| Mode | Kahan | Reload ke baad |
|---|---|---|
| **firebase** | Firestore: `parents/{uid}`, `…/children/{id}`, `…/purchases/{id}`, `announcements/{id}`, `credentials/{phone}` | Sab rehta hai |
| **mock** | Is browser ka `localStorage` (`src/lib/backend/demoStore.ts`) | Rehta hai, sirf isi browser me |

**Firebase mode me koi demo dataset nahi hai.** Pehli baar app khaali khulegi
jab tak admin code issue na kare. Ye design decision hai: nakli marks dikhane
se behtar hai saaf "not configured" dikhana.

---

## 6. Kahan dikhta hai (aur kahan abhi nahi)

### ✅ Wired — admin ke edits turant render hote hain

`ChildDashboardScreen`, `StudentDashboardView` (tests), `AnnouncementsView`,
`PurchasesScreen`, `LinkedAccountsScreen`, `ProfileScreen`,
`ParentProfileScreen`

Batch model aane ke baad ye bhi **real data** pe hain:

| Pehle hardcoded | Ab kahan se |
|---|---|
| `ChildDashboardScreen.batchOptions` (4 fake batches) | `batches/{id}` jisme `members/{parentUid}` exist karta hai |
| `OfflineAttendanceDashboardView` ka calendar + `3/4`, `592/720` | `attendance/{studentId}` + test results |
| `AllTestsModal` ki 8 fake tests | `batches/{id}/tests` |
| `SubjectDetailsModal` ke fake subjects + "Rajwant Sir" | test syllabus se group kiye subjects, accuracy real results se |

Sab optional props ke through — `src/hooks/useBatchView.ts` Firestore documents
ko component ke purane shapes me map karta hai, isliye pixel-matched UI ko
chhedna nahi pada.

### ⚠️ Abhi bhi hardcoded (jaan-boojh kar)

`DppSection` (DPP counts) aur `StudentDashboardView` ka lectures section.

Reason: batch model **attendance, tests, syllabus aur marks** track karta hai —
**lectures aur DPPs track hi nahi karta**. Jhootha source wire karne se behtar
hai saaf kehna ki ye abhi sample hai. Wire karne ke liye pehle
`batches/{id}/lectures` aur `batches/{id}/dpps` subcollections chahiye.

Ek cheez **jaan-boojh kar hataayi** gayi, wire nahi ki: **rank**. Rank ke liye
poore class ke marks chahiye jo parent padh nahi sakta — isliye us slot pe ab
attendance % hai. Details upar.

---

## 7. Files

```
src/components/admin/
  AdminPanelScreen.tsx     shell — gate + tabs
  AdminGate.tsx            username+password / passcode
  BatchesTab.tsx           batch CRUD -> opens BatchDetailView
  BatchDetailView.tsx      one batch: Students / Attendance / Tests panels
  BatchMembersPanel.tsx    allot which children are in the batch
  BatchAttendancePanel.tsx day-wise P/A/L calendar per student
  BatchTestsPanel.tsx      test CRUD + structured syllabus editor
  TestResultsPanel.tsx     per-student marks on one test
  StudentsTab.tsx          per-child academic record
  LoginCodesTab.tsx        per-phone 6-digit codes
  AnnouncementsTab.tsx     shared feed
  DataTab.tsx              session, read budget, cache
  ui.tsx                   shared primitives

src/hooks/
  useAppData.ts            saara app state + data calls
  useBatchView.ts          batch model -> dashboard component shapes

src/lib/backend/
  batchTypes.ts            BatchOps contract + pure helpers (date keys,
                           attendance maths, scorePercent, syllabus weight)
  firebaseBatches.ts       Firestore implementation
  mockBatches.ts           localStorage implementation

src/lib/
  adminAuth.ts             registerAdmin / loginAdmin / currentAdmin
  credentials.ts           PBKDF2 hashing + verification
  admin.ts                 passcode gate (mock), recomputeStudent, maths
  backend/readCache.ts     TTL + de-dupe + stats
```

`OfflineAttendanceDashboardView.tsx` 484 lines pe pahunch gaya tha, isliye uske
teen sections alag files me nikale gaye — `AttendanceCalendarSection.tsx`,
`DppSection.tsx`, `CenterTestsSection.tsx`. Markup bilkul wahi hai, sirf data
source badla. Repo me **koi file 500 lines cross nahi karti.**

Koi bhi file 500 lines cross nahi karti — ye repo me ek hard rule hai.

---

## 8. Tests

```bash
npm test                                    # 113 tests
npx vitest run src/tests/batches.spec.ts           # batch model (39 tests)
npx vitest run src/tests/backend-session.spec.ts   # login codes, restore, cache
npx vitest run src/tests/credentials.spec.ts       # PBKDF2 round trip
npx vitest run src/tests/admin.spec.ts             # recomputeStudent
```

Tests mock mode me chalte hain (`vitest.config.ts` → `env.VITE_BACKEND_MODE=mock`),
taaki ek developer ka `.env.local` suite ko firebase mode me na phenk de.
