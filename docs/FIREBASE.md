# Firebase Backend — Setup Guide

> **TL;DR — code already likha ja chuka hai.** `src/App.tsx`, `src/lib/backend/`,
> `src/lib/firebase/` sab wire ho gaye hain. Tumhe sirf **Firebase console me 4
> kaam** karne hain aur **Cloudflare Pages me 8 env vars** daalne hain.
> Neeche §2 checklist hai.

---

## 1. Architecture — pehle samajh lo

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React SPA on Cloudflare Pages)                        │
│                                                                 │
│  LoginScreen  ──phone──▶  OtpScreen  ──demo code──▶  App.tsx    │
│                                                          │      │
│                                              getBackend()│      │
│                                                          ▼      │
│                              ┌────────────────────────────────┐ │
│                              │ src/lib/backend/index.ts       │ │
│                              │  (facade — UI sirf isi se      │ │
│                              │   baat karti hai)              │ │
│                              └───────────┬────────────────────┘ │
│                     VITE_BACKEND_MODE    │                      │
│                 ┌────────────────────────┴──────────────────┐   │
│                 ▼                                           ▼   │
│        ┌─────────────────┐                        ┌────────────┐│
│        │ mock            │                        │ firebase   ││
│        │ localStorage    │                        │ Anonymous  ││
│        │ (zero setup)    │                        │ Auth +     ││
│        └─────────────────┘                        │ Firestore  ││
│                                                   └────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Components kabhi `firebase/*` import nahi karte.** Sirf `src/lib/backend`.
Isliye `VITE_BACKEND_MODE` flip karne se poora data source badal jata hai
bina ek bhi screen chhede.

---

## 2. Console checklist — 6 kaam

Project: **`pwparentapp`**

### ① Firestore Database banao
Console → **Build → Firestore Database → Create database**

- **Region: `asia-south1` (Mumbai)** — India ke liye sabse low latency.
  ⚠️ **Region create ke baad KABHI change nahi hota.** Sochke select karna.
- Mode: **Production mode** (rules hum publish karenge, §4). Test mode bhi
  chalega dev ke liye par 30 din baad auto-lock ho jata hai.

> ⚠️ **Zaroori:** tumhare config me `databaseURL` dikh raha hai
> (`pwparentapp-default-rtdb.asia-southeast1...`) — wo **Realtime Database**
> hai, ek *alag* product. **Firestore separately banana padega.** Ye app
> Firestore use karti hai, Realtime Database nahi.

### ② Anonymous Auth enable karo
Console → **Build → Authentication → Sign-in method → Anonymous → Enable → Save**

Ye **zaroori** hai. Iske bina `signInAnonymously()` fail hoga (`auth/operation-not-allowed`) aur
app khaali reh jayegi — **koi demo data fallback nahi hai** (neeche §7).

**Phone/SMS OTP enable mat karna** — wo Spark plan pe chalta hi nahi
(`auth/billing-not-enabled`). Neeche §3 me poora reason hai.

### ②b Email/Password Auth enable karo
Console → **Build → Authentication → Sign-in method → Email/Password → Enable → Save**

Admin Panel ke username + password ke liye zaroori. Password **sirf yahin**
rehta hai — Firestore me uska koi trace nahi jaata. Username ek synthetic
address ban jata hai: `<username>@admin.pwparent.local` (local domain, koi mail
nahi jaata).

> ⚠️ **Pehla register karne wala hi admin banega — permanently.** Deploy ke
> turant baad khud register karo. Details [`ADMIN_PANEL.md §2`](./ADMIN_PANEL.md).

### ③ Rules publish karo
Console → **Firestore Database → Rules** → repo ka `firestore.rules` paste karo → **Publish**

Ya CLI se:
```bash
npx --yes firebase-tools login
npx --yes firebase-tools deploy --only firestore:rules --project pwparentapp
```

### ④ Env vars Cloudflare Pages me daalo
Dashboard → **pwparent → Settings → Environment variables** → neeche §5 ki
8 values **Production aur Preview dono** me add karo → phir
**Deployments → latest → Retry deployment**.

Vite env vars ko **build time** pe inline karta hai, isliye sirf save karna
kaafi nahi — **rebuild zaroori hai**.

### ⑤ Authorized domains me Pages host daalo
Console → **Authentication → Settings → Authorized domains** →
`pwparent.pages.dev` add karo (aur har preview host jo use karna ho).

Iske bina `signInAnonymously()` us origin se `auth/unauthorized-domain` dega.
`*.pages.dev` wildcard support nahi hota — exact host chahiye.

### ⑥ Admin code issue karo, phir test karo
App kholo → Settings dock → **Admin Panel** → register karo → **Login codes**
tab → apne number ka 6-digit code set karo → logout → us number + code se login
karke dekho.

Jab tak koi code exist nahi karta, **koi login nahi kar sakta**. Peeche koi demo
dataset nahi hai — ye intentional hai.

---

## 3. Auth model — phone number credential KYUN nahi hai

Tumhara original idea tha: *number daalo, number hi username aur password.*
Problem ye thi ki **koi bhi kisi ka bhi number daal ke andar aa jata**, aur
bina authenticated identity ke **Firestore rules kuch protect hi nahi kar
sakte** (rules `request.auth.uid` pe chalte hain).

### Jo ab hota hai

Ye **username + password** hai, SMS OTP nahi. Number username hai; admin ke
diye hue 6-digit code password hain.

| Step | Kya hota hai |
|---|---|
| 1 | User 10-digit number type karta hai |
| 2 | `sendOtp()` sirf **check** karta hai ki `credentials/{phone}` exist karta hai — kuch bhejta nahi |
| 3 | Number registered nahi hai to screen saaf bol deti hai: *"An administrator must set a login code for it first."* |
| 4 | Registered hai to 6 boxes khulte hain. Typed code PBKDF2 digest se **constant-time** verify hota hai |
| 5 | Verify hone par `ensureSession()` → `signInAnonymously()` → ek **real, stable `uid`** |
| 6 | Number **profile field** ki tarah `parents/{uid}.mobileNumber` me save hota hai |
| 7 | Rules us `uid` se har user ka data isolate kar dete hain |

**Result:**
- ✅ Free (Anonymous Auth + Email/Password, Spark plan pe 50,000 MAU tak)
- ✅ **₹0 SMS cost** — koi message bhejta hi nahi, koi inbox padhta hi nahi
- ✅ Number **ab actually gate karta hai** — bina admin-set code ke andar nahi aa sakte
- ✅ Session reload pe bhi rehta hai (`restoreSession()` bina likhe resume karta hai)
- ✅ Har user ka data rules se locked
- ⚠️ Verification **browser me** hoti hai — 6-digit code strong password nahi hai.
  Poora analysis [`SECURITY.md §2`](./SECURITY.md).
- ⚠️ Number ko kisi bachche ke records ka **lookup key mat banana**. Lookup key
  hamesha `uid` hai — number badal sakta hai, uid nahi.

### Phone OTP kyun nahi
Firebase Phone Auth (SMS) ke liye **1 September 2024 se linked Cloud Billing
account (Blaze plan) zaroori hai**. Spark plan pe `auth/billing-not-enabled`
error aata hai. Pricing table me Phone Auth ke against Spark column me
"**Not applicable**" likha hai. Blaze pe pehle 10 SMS/day free, phir
per-SMS billing — aur SMS-pumping se bill ka risk.

Isliye ye app SMS use hi nahi karti. **₹0 cost.**

---

## 4. Data model

`src/lib/firebase/firestore.ts` → `paths` object yahi layout expect karta hai:

```
parents/{uid}                          ParentProfileData
  ├─ name                              string
  ├─ countryCode                       "IN +91"
  ├─ mobileNumber                      "9876543210"   ← profile field, credential nahi
  ├─ email                             string
  ├─ signInMethod                      "anonymous+login-code"
  └─ lastLoginAt                       ISO timestamp

parents/{uid}/children/{childId}       StudentProfile
  ├─ name, batch, course               string
  ├─ attendance                        "96%"   (display string)
  ├─ testsCompleted                    number  ← derived
  ├─ testsTotal                        number
  ├─ avgScorePercent                   number  ← derived
  ├─ accuracyPercent                   number  ← derived
  ├─ dppsDone                          number
  ├─ videoWatchRate                    "91%"
  └─ tests[]                           TestRecord[]
       ├─ id, title, date, mode        "Online" | "Offline"
       ├─ status                       "ATTEMPTED" | "MISSED"
       ├─ marksObtained, marksTotal    number
       └─ scorePercent, accuracyPercent number ← derived

parents/{uid}/purchases/{itemId}       PurchaseItem
  └─ imageBg                           Tailwind gradient classes, hex NAHI
                                       ("from-blue-600 to-indigo-700")

batches/{batchId}                      Batch — admin banata hai
  ├─ name, course                      string
  ├─ batchType                         "online" | "offline"
  ├─ startDate                         "YYYY-MM-DD"
  ├─ active                            boolean (false = draft, parents ko nahi dikhta)
  └─ createdAt, createdBy

batches/{batchId}/members/{parentUid}  allotment — PARENT uid se keyed
  ├─ studentIds[]                      is parent ke kaun se bachche is batch me hain
  └─ joinedAt                          ISO timestamp
      ⚠️ id JAAN-BOOJH KE parentUid hai: rules isi se ek `exists()` me
         decide kar lete hain ki caller is batch ko padh sakta hai ya nahi.

batches/{batchId}/attendance/{studentId}   ← EK doc per student, saare months
  ├─ studentId                         string
  └─ months                            {"2026-10": {"2026-10-05": "P"}}
      ⚠️ Month-wise alag docs NAHI banaye. Ek doc isliye ki:
         (a) rules me "kya ye caller is student ka parent hai?" seedha
             `attendance/{studentId}` pe lag jata hai — composite
             `{studentId}__{month}` id parse karni padti
         (b) calendar kholne pe 1 read lagta hai, mahine pe nahi
         (c) size negligible hai — poora saal = 372 chhote entries

batches/{batchId}/tests/{testId}       BatchTest — test BATCH ka hai, student ka nahi
  ├─ title, date, mode                 string / "YYYY-MM-DD" / "Online"|"Offline"
  ├─ marksTotal                        number
  ├─ status                            "scheduled" | "completed"
  └─ syllabus[]                        {subject, topic, weightage?}

batches/{batchId}/tests/{testId}/results/{studentId}
  ├─ studentName                       denormalised — list bina profile read ke render ho
  ├─ marksObtained, accuracyPercent    number (admin bharta hai)
  ├─ status                            "ATTEMPTED" | "MISSED"
  └─ scorePercent                      number ← DERIVED, admin bharta nahi

announcements/{id}                     AnnouncementItem (shared feed)

admins/{uid}                           role marker — admin allow-list
  ├─ username                          "a-z0-9._-", 3-30 chars
  ├─ role                              "owner"
  └─ createdAt                         ISO timestamp
                                       ⚠️ password YAHAN NAHI hai (Firebase Auth me hai)

adminConfig/singleton                  registration permanently band karta hai
  ├─ closedAt                          ISO timestamp
  └─ reason                            string
                                       ⚠️ username YAHAN NAHI — ye doc world-readable
                                       hai (login screen ko pata hona chahiye ki
                                       registration open hai ya nahi)

credentials/{phone}                    phone ka login code — SIRF digest
  ├─ v                                 1  (CREDENTIAL_VERSION)
  ├─ salt                              base64, 16 random bytes
  ├─ iterations                        210000
  ├─ hash                              base64, PBKDF2-SHA256 over "code|phone"
  └─ createdAt                         ISO timestamp
```

**Har parent-scoped path `parents/{uid}` se shuru hota hai** — isse rules me
ek line me poora subtree lock ho jata hai.

**Batch tree ulta hai** — wo admin-owned hai, isliye `batches/{batchId}` se
shuru hota hai aur parent ko access *membership* se milta hai, uid path se
nahi. Ek bachcha kai batches me ho sakta hai (`StudentProfile.batchIds[]`).

### Derived fields
`testsCompleted`, `avgScorePercent`, `accuracyPercent` aur har test ka
`scorePercent` **Admin Panel khud calculate karta hai** (`recomputeStudent()`
in `src/lib/admin.ts`). Admin sirf raw marks bharta hai; percentages kabhi
directly set nahi hote, taaki scorecard apne aap se contradict na kare.

---

## 5. Env vars

### Local development
```bash
cp .env.example .env.local      # phir values bharo
npm run dev
```
`.env.local` gitignored hai — real values kabhi commit nahi hote.

### Cloudflare Pages
Dashboard → Settings → Environment variables → **Production + Preview dono**:

```
VITE_APP_ENV=production
VITE_APP_URL=https://pwparent.pages.dev
VITE_BACKEND_MODE=firebase
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=pwparentapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pwparentapp
VITE_FIREBASE_STORAGE_BUCKET=pwparentapp.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=543582188666
VITE_FIREBASE_APP_ID=1:543582188666:web:fc0d4a1ee188fd4a97b7c3
VITE_USE_ANONYMOUS_AUTH=true
VITE_ADMIN_PASSCODE=<apna passcode>
```

Add karne ke baad **Retry deployment** zaroori hai.

### Firebase API key secret nahi hai
Ye sabse common confusion hai. Firebase **web config** public hone ke liye hi
bana hai — wo har browser ko JS bundle me jaata hai. Tumhara data
`firestore.rules` se protect hota hai, in strings se nahi.

Phir bhi repo me commit mat karo — taaki project swap/rotate bina commit ke
ho sake. `npm run check:build` bundle me `AIza...` dekh ke **warning** deta
hai; Firebase key ke liye wo expected hai.

### Safety net
`src/lib/config.ts` me `VITE_BACKEND_MODE=firebase` **sirf tab** effect karta
hai jab saare 6 required Firebase vars maujood hon. Adhura env = automatic
mock mode fallback. Isliye half-configured deploy kabhi white-screen nahi karta.

Aur `src/lib/backend/index.ts` me `withFallback()` har Firestore read ko wrap
karta hai — database bana hi na ho, region galat ho, rules locked hon, ya
visitor offline ho — to console me warning aati hai aur UI demo data pe chalta
rehta hai.

---

## 6. Security rules — kya karte hain

`firestore.rules` (repo root) ka summary:

| Path | Read | Write |
|---|---|---|
| `parents/{uid}` + subcollections | owner **ya admin** | owner **ya admin** (delete: sirf console) |
| `announcements/{id}` | koi bhi signed-in | sirf `isAdmin()` |
| `admins/{uid}` | owner ya admin | **create**: sirf jab slot khula ho; update/delete ❌ |
| `adminConfig/singleton` | **koi bhi** (jaan-boojh ke) | **create**: ek hi baar; update/delete ❌ |
| `credentials/{phone}` | **get**: koi bhi · **list**: sirf admin | sirf `isAdmin()` |
| baaki sab | ❌ | ❌ |

**Default deny** — nayi collection bina explicit rule ke kaam nahi karegi.
Root-level `match /{document=**}` catch-all deliberately nahi hai: Firestore
pehle se har unmatched path deny karta hai, aur recursive wildcard upar ke
matches se overlap karta.

Teen design decisions jo surprising lag sakte hain:

1. **`adminConfig/singleton` world-readable hai** — login screen ko
   authenticate hone se *pehle* pata hona chahiye ki registration open hai ya
   nahi. Isliye usme username ya koi sensitive cheez **nahi** hai.
2. **`credentials/{phone}` pe `get: if true`** — browser ko digest fetch karke
   typed code check karna padta hai, koi server nahi jo ye kaam kare. `list`
   admin-only hai, isliye collection enumerate karke registered numbers pata
   nahi chal sakte.
3. **`admins/{uid}` ka create `!exists(adminConfig/singleton)` pe gated hai** —
   aur `registerAdmin()` dono documents ek atomic batch me likhta hai. Rule ke
   andar `exists()` **pre-batch** state dekhta hai, isliye pehla admin bante hi
   window permanently band. App se doosra admin kabhi nahi ban sakta.

Admin ko `parents/{uid}` subtree ka access isliye hai kyunki Admin Panel ka
kaam hi doosron ka academic record manage karna hai.

---

## 7. Koi demo data nahi — jo honest limitations hain

1. **Login code browser me verify hota hai.** `credentials/{phone}` ka digest
   client pe download hota hai aur PBKDF2 se check hota hai. 210 000 rounds +
   per-code salt + phone pepper se offline brute force mehnga padta hai, par
   6-digit code strong password nahi hai. Sahi fix: verification ko Cloudflare
   Pages Function me le jao (Admin SDK ke saath) aur rules me
   `credentials/{phone}` ko `read, write: if false` kar do.
   Poora analysis [`SECURITY.md §2`](./SECURITY.md).
2. **Phone number ownership prove nahi hota.** SMS nahi jaata, isliye ye
   confirm nahi hota ki number type karne wala uska malik hai. Gate ye hai ki
   admin ne us number ke liye code issue kiya hai — jo effectively ek
   allow-list hai.
3. **Firebase mode me koi demo data nahi hai.** Adhoore env pe app khaali
   dikhegi aur `backendConfigError` missing vars naam se batayega — nakli
   marks invent nahi karegi. Mock mode (`VITE_BACKEND_MODE=mock`) sirf dev +
   tests ke liye hai; uska passcode bundle me inline hota hai, security nahi.
4. **Kuch views me abhi bhi sample numbers hardcoded hain.**
   Wired: student name/batch (LinkedAccounts, Profile), test scorecard +
   recent tests + marks (`StudentDashboardView`), announcements
   (`AnnouncementsView`), purchases (`PurchasesScreen`).
   Abhi hardcoded: `OfflineAttendanceDashboardView` ka attendance calendar,
   `SubjectDetailsModal` ke subject-wise DPP counts, lectures section.
   Ye deliberately chhoda gaya — 38 components ka risky refactor avoid karne
   ke liye. Follow-up me wire kiya ja sakta hai.
5. **8 components original AI Studio export se unused (orphan) hain**:
   `AnnouncementsScreen`, `BottomNavBar`, `ContactSupportModal`,
   `MainAppHeader`, `StatusBar`, `StudentLecturesDashboard`,
   `StudentTestsDashboard`, `SupportScreen`. Inhe chheda nahi gaya.

App ke bottom-right pe ek chhota **Settings dock** rehta hai
(`src/components/SettingsDock.tsx`) jo live backend mode dikhata hai — 🟢
`firebase`, 🟡 `mock`, 🔴 `setup` (env adhoora). Wahi se Admin Panel khulta
hai, doosre number se login hota hai, aur Firestore read budget dikhta hai.

---

## 8. Cloudflare Pages + Firebase — kya chalta hai

| | Status |
|---|---|
| Firestore reads/writes from the browser | ✅ chalta hai |
| Anonymous Auth from the browser | ✅ chalta hai |
| `pages.dev` domain ko Firebase Auth me allow karna | ⚠️ zaroori hai, neeche dekho |
| Cloud Functions for Firebase | ❌ Blaze-only — isliye hum Cloudflare Pages Functions use karte hain |
| Firebase Hosting | ❌ use mat karo — site Pages se deploy hoti hai (double deploy) |

### Authorized domains
Console → **Authentication → Settings → Authorized domains** →
`pwparent.pages.dev` add karo. Preview deployments ke liye
`*.pwparent.pages.dev` kaam nahi karta — har preview URL separately add karna
padta hai, ya sirf production domain use karo.

Ye na karne pe error aata hai: `auth/unauthorized-domain`.

---

## 9. Local Firebase Emulator (optional, dev ke liye best)

Real project ko gande kiye bina test karna ho to:

```bash
npx --yes firebase-tools emulators:start --only auth,firestore --project pwparentapp
```

Phir app ko emulator pe point karo (dev-only code):
```ts
import {connectFirestoreEmulator} from 'firebase/firestore';
import {connectAuthEmulator} from 'firebase/auth';
if (import.meta.env.DEV) {
  connectFirestoreEmulator(getDb(), {host: '127.0.0.1', port: 8080});
  connectAuthEmulator(getFirebaseAuth(), 'http://127.0.0.1:9099');
}
```

⚠️ Ye snippet abhi repo me **nahi** hai — jaan-boojh ke, taaki production
bundle me emulator code na jaye. Chahiye to `if (import.meta.env.DEV)` guard
ke saath add karna.

---

## 10. Tests

```bash
npm test              # 43 tests
npm run verify        # typecheck + test + build + check:build
```

| File | Kya cover karta hai |
|---|---|
| `src/tests/config.spec.ts` | Adhura env kabhi firebase mode enable na kare (deploy safety) |
| `src/tests/backend.spec.ts` | Facade defaults, OTP demo codes, caching |
| `src/tests/backend-session.spec.ts` | Phone → session, profile persistence, admin writes round-trip |
| `src/tests/admin.spec.ts` | Passcode gate, marks maths, `recomputeStudent` consistency |
| `src/tests/login.spec.tsx` | LoginScreen validation |
| `src/tests/app.spec.tsx` | App mount smoke test |

**Note:** `vitest.config.ts` me `envDir` jaan-boojh ke `src/tests/env` (khali
directory) pe set hai. Iske bina tumhara local `.env.local` tests me leak ho
jata aur `config.spec.ts` fail hone lagta. Details: `src/tests/env/README.md`.

---

## 11. Troubleshooting

| Symptom | Reason | Fix |
|---|---|---|
| Console: `[config] Running in MOCK mode` | Env vars missing | §5 ke 8 vars Pages me daalo + **Retry deployment** |
| Console: `[backend] read children failed` | Firestore bana nahi / region galat / rules locked | §2 ① aur ③ |
| `auth/operation-not-allowed` | Anonymous sign-in disabled | §2 ② |
| `auth/unauthorized-domain` | `pages.dev` authorized nahi | §8 → Authorized domains |
| `permission-denied` on announcements | `admins/{uid}` doc nahi hai | Console me `admins/<uid>` banao |
| Deploy ke baad bhi purana behaviour | Vite build-time inline karta hai | **Retry deployment** (sirf save kaafi nahi) |
| Data reload pe chala gaya | Mock mode ka store clear ho gaya (`clearDemoStore`) | Ye mock mode ka behaviour hai; firebase mode me data Firestore me rehta hai |

---

## 12. Final checklist

- [ ] Firestore Database create — region `asia-south1`
- [ ] Authentication → Sign-in method → **Anonymous → Enable**
- [ ] Firestore → Rules → `firestore.rules` paste → **Publish**
- [ ] Authentication → Settings → **Authorized domains** → `pwparent.pages.dev`
- [ ] Cloudflare Pages → Environment variables → 8 values (**Production + Preview**)
- [ ] Cloudflare Pages → Deployments → **Retry deployment**
- [ ] `npm run doctor` locally pass
- [ ] `npm run verify` locally pass
- [ ] App kholo → bottom-right badge pe **`firebase`** dikhna chahiye (yellow `mock` nahi)
- [ ] Login karo → Firebase Console → Firestore → `parents/{uid}` doc dikhe
- [ ] Authentication → Users → ek anonymous user dikhe
