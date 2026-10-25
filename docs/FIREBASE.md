# Firebase Backend — Setup & Wiring Guide

Repo me Firebase ka **poora scaffold ready hai**. Default pe app **mock mode** me
chalti hai (koi network nahi, demo data), aur jaise hi tum env vars bharte ho,
`VITE_BACKEND_MODE=firebase` se real backend on ho jata hai — components change
karne ki zaroorat nahi.

```
src/lib/config.ts               env parsing + validation + mode decide
src/lib/firebase/app.ts         initializeApp (safe: config missing -> null)
src/lib/firebase/auth.ts        phone OTP (send/verify), signOut, toE164()
src/lib/firebase/firestore.ts   db helpers + collection paths
src/lib/backend/index.ts        facade: mockBackend | firebaseBackend  ← UI yahi import kare
src/lib/backend/mockData.ts     demo dataset
```

Dependency `firebase@^12` `package.json` me already hai.

---

## 1. Firebase project banao

1. https://console.firebase.google.com → **Add project** → naam `pwparent`.
2. Project → **⚙ Project settings → General → Your apps → Web (`</>`)**.
3. App nickname: `PW Parent's App (Web)` → Register.
4. SDK setup snippet copy karo — usse 6 values milti hain:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "pwparent.firebaseapp.com",
  projectId: "pwparent",
  storageBucket: "pwparent.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```

> Ye values **public** hain — browser me jana inka design hai. Security
> §5 (rules) aur §7 (App Check) se aati hai.

---

## 2. Authentication (phone OTP) enable karo

1. **Build → Authentication → Get started → Sign-in method**.
2. **Phone** → Enable → Save.
3. Testing ke liye: **Sign-in method → Phone numbers for testing** → apna number
   + fixed 6-digit code add karo. (Free tier me real SMS quota limited hoti hai.)

### reCAPTCHA / domain authorization — Cloudflare Pages ke liye zaroori

Web phone auth reCAPTCHA verifier use karta hai. Iske liye:

1. **Authentication → Settings → Authorized domains** me apna Pages domain add karo:
   - `pwparent.pages.dev`
   - `*.pages.dev` (preview URLs ke liye — ya har preview domain individually)
   - apna custom domain, e.g. `app.yourdomain.com`
   - `localhost` already hota hai
2. Agar Firebase console bole ki **App Check** chahiye, to §7 follow karo.

`src/lib/firebase/auth.ts` invisible `RecaptchaVerifier` use karta hai, jisko ek
DOM element chahiye. Apne login screen me ye div add karo (sirf firebase mode me
render ho, warna empty div harmless hai):

```tsx
import { isFirebaseEnabled } from './lib/config';

{isFirebaseEnabled && <div id="recaptcha-container" />}
```

---

## 3. Firestore enable karo

1. **Build → Firestore Database → Create database**.
2. Location: `asia-south1` (Mumbai) — India users ke liye best latency.
3. Mode: **Production mode** (locked rules) → phir §5 ke rules paste karo.

### Data model (jo `src/lib/firebase/firestore.ts` expect karta hai)

```
parents/{uid}                          ParentProfileData
  ├─ name, countryCode, mobileNumber, email
  └─ children/{childId}                StudentProfile
        name, batch, course, attendance, testsCompleted, dppsDone, videoWatchRate
  └─ purchases/{itemId}                PurchaseItem
        title, date, status, totalItem, price, category, imageBg

announcements/{id}                     AnnouncementItem (global feed)
  author, timeAgo, isNew, content, videoLink
```

`uid` = Firebase Auth ka user id (phone auth ke baad `user.uid`).

Seed data chahiye to Firestore console → **Import/export** ya ek chhota Node
script; `src/lib/backend/mockData.ts` me ready JSON-shaped objects hain jo tum
direct copy kar sakte ho.

---

## 4. Env vars bhartna

### Local
```bash
cp .env.example .env.local
```
```bash
VITE_BACKEND_MODE=firebase
VITE_FIREBASE_API_KEY="AIza..."
VITE_FIREBASE_AUTH_DOMAIN="pwparent.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="pwparent"
VITE_FIREBASE_STORAGE_BUCKET="pwparent.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abc123"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### Cloudflare Pages
Pages → **Settings → Environment variables** → upar wale saare vars
**Production + Preview** dono me → **Retry deployment**.

> ⚠️ Env change ke baad rebuild zaroori hai (Vite build-time inline karta hai).

### Safety net
Agar 6 me se koi bhi required var missing/blank/`MY_*` placeholder hai, to
`VITE_BACKEND_MODE=firebase` **ignore** ho jata hai aur app mock mode pe chalti
reh-ti hai. Console me exact list mil jati hai:

```
[config] Running in MOCK mode. Set these to enable Firebase: VITE_FIREBASE_API_KEY, ...
```

Tests is behaviour ko lock karte hain: `src/tests/config.spec.ts`.

---

## 5. Firestore security rules

Firestore → **Rules** → paste → Publish. Ye rules is app ke data model ke liye
hain: parent sirf apna data padh/sakta hai, announcements sab padh sakte hain.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }
    function isOwner(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    // Parent profile + everything nested under it (children, purchases)
    match /parents/{uid} {
      allow read:   if isOwner(uid);
      allow write:  if isOwner(uid);

      match /{document=**} {
        allow read, write: if isOwner(uid);
      }
    }

    // Global announcements feed: read for signed-in parents, write only for staff
    match /announcements/{id} {
      allow read:  if signedIn();
      allow write: if signedIn() && request.auth.token.staff == true;
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Staff/admin** ke liye: Firebase Auth → user → **Custom claims** me
`staff: true` set karo (Admin SDK se), ya rules me ek alag `admins/{uid}`
collection check karo.

Testing: Firestore → Rules → **Rules Playground** me
`request.auth = {uid: "test"}` simulate karke verify karo.

---

## 6. UI me wire karna (exact steps)

Backend facade already ready hai — bas 3 jagah connect karna hai.

### 6a. `src/App.tsx` — data load

```tsx
import { useEffect, useState } from 'react';
import { getBackend } from './lib/backend';
import { mockStudents, mockParentProfile } from './lib/backend';

const [students, setStudents] = useState<StudentProfile[]>(mockStudents);
const [parentProfile, setParentProfile] = useState<ParentProfileData>(mockParentProfile);

useEffect(() => {
  let alive = true;
  getBackend().then(async (backend) => {
    const [linked, profile] = await Promise.all([
      backend.getLinkedStudents(),
      backend.getParentProfile(),
    ]);
    if (!alive) return;
    if (linked.length) setStudents(linked);        // mock fallback already set
    setParentProfile(profile);
    if (linked[0]) setActiveStudent(linked[0]);
  });
  return () => { alive = false; };
}, []);
```

### 6b. `src/App.tsx` — OTP bhejna (LoginScreen submit)

```tsx
import { useRef } from 'react';
import type { SendOtpResult } from './lib/backend';

const otpFlow = useRef<SendOtpResult | undefined>(undefined);

const handleLoginSubmit = async (phone: string) => {
  const backend = await getBackend();
  const sent = await backend.sendOtp(phone);        // mock: instant, firebase: real SMS
  otpFlow.current = sent;
  setPhoneNumber(phone);
  setParentProfile((p) => ({ ...p, mobileNumber: phone }));
  setCurrentScreen('otp');
};
```

`otpFlow` ko `OtpScreen` ko prop ki tarah bhejo.

### 6c. `src/components/OtpScreen.tsx` — OTP verify

Abhi `handleComplete` ek fake `setTimeout` hai. Real banao:

```tsx
interface OtpScreenProps {
  phoneNumber: string;
  sendResult?: SendOtpResult;                 // ← naya prop
  onEditPhone: () => void;
  onVerifySuccess: (uid?: string | null) => void;
  onVerifyError: (message: string) => void;   // ← naya prop
  onHowItWorks: () => void;
  customLogoUrl?: string | null;
  onOpenLogoCustomizer: () => void;
}

const handleComplete = async (code: string) => {
  setIsVerifying(true);
  const backend = await getBackend();
  const result = await backend.verifyOtp(code, sendResult);
  setIsVerifying(false);
  if (result.ok) onVerifySuccess(result.uid);
  else onVerifyError(result.error ?? 'Invalid OTP');
};
```

Mock mode me OTP = `1234` (`MOCK_OTP`), firebase mode me real SMS code.
UI ka baaki hissa (timer, auto-focus, paste) waise ka waisa chalega.

### 6d. Write operations

```tsx
const backend = await getBackend();
await backend.saveParentProfile({ ...parentProfile, name: newName });
```

Firestore me direct write karna ho to `src/lib/firebase/firestore.ts` ke helpers
(`writeDoc`, `readCollection`, `subscribe`) use karo — paths helper se path
banao taaki rules ke saath consistent rahe.

Live updates chahiye (announcement feed):
```tsx
subscribe<AnnouncementItem>(paths.announcements(), setAnnouncements);
```

---

## 7. App Check (recommended for phone auth)

Firebase phone auth abuse (SMS pumping) rokne ke liye App Check on karo:

1. **Project settings → App Check → Apps → your web app → Register**.
2. Provider: **reCAPTCHA v3** (simplest on Cloudflare Pages) → site key copy karo.
3. Env: `VITE_RECAPTCHA_SITE_KEY=6Lf...` (client, public) — aur site secret
   ko Pages secret me daalo agar server-side verify karna ho.
4. `src/lib/firebase/app.ts` me init ke baad:

```ts
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
initializeAppCheck(app, { provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY!), isTokenAutoRefreshEnabled: true });
```

5. App Check → **APIs → Firestore / Authentication → Enforce** (pehle staging me).

Note: `*.pages.dev` wildcard domain App Check me allowed domains me add karna
zaroori hai, warna preview URLs pe token issue hoga.

---

## 8. Cloudflare Pages + Firebase: kya chalta hai, kya nahi

| Chahiye | Chalega? | Kaise |
|---|---|---|
| Client-side Firebase SDK (Auth, Firestore, Storage) | ✅ | Normal — SPA me `firebase/*` import |
| Phone OTP | ✅ | `signInWithPhoneNumber` + `RecaptchaVerifier` (§2) |
| Firestore reads/writes from browser | ✅ | Rules ke saath (§5) |
| Server-side admin (custom claims, user delete, send email) | ⚠️ | Pages Functions me `firebase-admin` **directly nahi** chalta (Workers runtime). Do options: (a) Identity Toolkit / Firestore **REST API** ko `fetch` se call karo, service-account key Pages secret me; (b) **Cloud Functions for Firebase** (Node) banao aur Pages Function se usko call karo. |
| FCM push | ⚠️ | Web push browser me chalta hai; bhejne wala hissa REST API/Cloud Function se |
| Firebase Hosting | – | Zaroorat nahi — Cloudflare Pages hi host kar raha hai. Firebase project sirf Auth/Firestore ke liye. |

**Cost:** Firebase free (Spark) tier me Firestore 1 GiB storage + 50k reads/day,
phone auth ke liye limited SMS quota. Pages free tier: 500 builds/month,
unlimited requests, 100k Functions requests/day. Dono hobby project ke liye
kaafi hain.

---

## 9. Local Firebase Emulator (optional, best for dev)

Bina quota jalaye test karne ke liye:

```bash
npm i -g firebase-tools
firebase login
firebase init emulators     # Auth + Firestore select karo
firebase emulators:start
```

Phir `.env.local` me:
```bash
VITE_BACKEND_MODE=firebase
VITE_FIREBASE_PROJECT_ID=demo-pwparent     # "demo-" prefix = no GCP calls
```

Emulator connect karna ho to `src/lib/firebase/firestore.ts` me dev-only:
```ts
if (import.meta.env.DEV) connectFirestoreEmulator(getDb(), 'localhost', 8080);
```

---

## 10. Tests

Firebase scaffold pehle se tested hai (mock mode default):

```bash
npm run test          # 12 tests
npm run typecheck
```

- `src/tests/config.spec.ts` — env parsing, placeholder safety, partial-config → mock fallback, unprefixed `FIREBASE_*` support
- `src/tests/backend.spec.ts` — mock backend ka data + OTP contract (wahi interface jo firebase backend implement karta hai)
- `src/tests/login.spec.tsx` — phone validation
- `src/tests/app.spec.tsx` — app mount smoke test

Firebase enable karne ke baad bhi ye tests pass rahenge, kyunki CI me
`VITE_FIREBASE_*` set nahi hote → mock mode. Real Firebase integration test
chahiye to emulator (§9) + ek alag `test:integration` script add karo.

---

## 11. Checklist

- [ ] Firebase project banaya, web app register kiya
- [ ] Authentication → Phone enable + test numbers add
- [ ] Authorized domains me `*.pages.dev` + custom domain
- [ ] Firestore create (asia-south1) + rules publish (§5)
- [ ] 6 `VITE_FIREBASE_*` vars Pages me (Production **aur** Preview)
- [ ] `VITE_BACKEND_MODE=firebase`
- [ ] Deployment retry kiya (env build-time inline hota hai)
- [ ] §6 ke 3 wiring steps App.tsx / OtpScreen.tsx me lagaye
- [ ] `#recaptcha-container` div login screen me
- [ ] App Check on (recommended)
- [ ] Browser console me `[config] Running in MOCK mode` **nahi** aa raha
- [ ] `npm run verify` green
