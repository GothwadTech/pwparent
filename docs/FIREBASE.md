# Firebase Backend — Setup Guide (DEMO BUILD)

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

## 2. Console checklist — sirf 4 kaam

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

Ye **zaroori** hai. Iske bina `signInAnonymously()` fail hoga
(`auth/operation-not-allowed`) aur app mock data pe gir jayegi.

**Phone/SMS OTP enable mat karna** — wo Spark plan pe chalta hi nahi
(`auth/billing-not-enabled`). Neeche §3 me poora reason hai.

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

---

## 3. Auth model — phone number credential KYUN nahi hai

Tumhara original idea tha: *number daalo, number hi username aur password.*
Problem ye thi ki **koi bhi kisi ka bhi number daal ke andar aa jata**, aur
bina authenticated identity ke **Firestore rules kuch protect hi nahi kar
sakte** (rules `request.auth.uid` pe chalte hain).

### Jo ab hota hai

| Step | Kya hota hai |
|---|---|
| 1 | User 10-digit number type karta hai |
| 2 | OTP screen pe demo code (`1234`) — **koi SMS nahi bhejta, koi inbox nahi padhta** |
| 3 | `ensureSession()` chup-chaap `signInAnonymously()` karta hai → ek **real, stable `uid`** milta hai |
| 4 | Number **profile field** ki tarah `parents/{uid}.mobileNumber` me save hota hai |
| 5 | Rules us `uid` se har user ka data isolate kar dete hain |

**Result:**
- ✅ Free (Anonymous Auth Spark plan pe 50,000 MAU tak)
- ✅ Zero friction — user ko OTP/email/password kuch nahi chahiye
- ✅ Session reload pe bhi rehta hai (Firebase IndexedDB me persist karta hai)
- ✅ Har user ka data rules se locked
- ⚠️ Number **verify nahi hota** — koi bhi koi bhi number type kar sakta hai.
  Isliye number ko **kabhi bhi kisi bachche ke records ka lookup key mat
  banana**. Lookup key hamesha `uid` hai.

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
  ├─ signInMethod                      "anonymous"
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

announcements/{id}                     AnnouncementItem (shared feed)
admins/{uid}                           {role, grantedAt}  ← console se banao
```

**Har parent-scoped path `parents/{uid}` se shuru hota hai** — isse rules me
ek line me poora subtree lock ho jata hai.

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
VITE_DEMO_BUILD=true
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
| `parents/{uid}` | sirf owner | sirf owner (delete: sirf console) |
| `parents/{uid}/children/{childId}` | sirf owner | sirf owner |
| `parents/{uid}/purchases/{itemId}` | sirf owner | sirf owner |
| `announcements/{id}` | koi bhi signed-in | sirf `admins/{uid}` |
| `admins/{uid}` | owner ya admin | **koi nahi** (console-only) |
| baaki sab | ❌ | ❌ |

**Default deny** — nayi collection bina explicit rule ke kaam nahi karegi.

`admins/{uid}` pe `write: if false` jaan-boojh ke hai: app khud ko promote
nahi kar sakti. Admin banana ho to console se `admins/<your-uid>` document
banao.

---

## 7. Demo build — jo honest limitations hain

Ye ek **demonstration project** hai, production product nahi. Ye baatein
jaan-na zaroori hai:

1. **OTP verify kuch nahi karta.** `1234` (ya `4286`) accept hota hai. Koi SMS
   nahi bhejta, koi inbox nahi padhta. Screen pe ye saaf likha hai.
2. **Phone number verify nahi hota.** Koi bhi koi bhi number type kar sakta hai.
3. **Admin passcode client-side hai.** Vite use bundle me inline kar deta hai,
   to jo bundle padh lega use passcode mil jayega. Real authorisation
   `firestore.rules` ke `admins/{uid}` me hai. See `docs/ADMIN_PANEL.md`.
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

App ke bottom-right pe ek chhota **`DEMO · <mode> · admin`** badge rehta hai
(`src/components/DemoBadge.tsx`). Uspe click karke Admin Panel khulta hai.
`VITE_DEMO_BUILD=false` karne se badge hat jata hai — par tab tak mat hatana
jab tak saara sample data real integration se replace na ho jaye.

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
| Data reload pe chala gaya | Mock mode me `resetLocalData()` chala tha | Admin Panel → Data → Seed demo data |

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
