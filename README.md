<div align="center">

# PW Parent's App

**Vite + React 19 + Tailwind 4 SPA** — Cloudflare Pages pe deploy-ready, Firebase backend ke liye scaffolded.

![CI](https://github.com/GothwadTech/pwparent/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.19-brightgreen)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)

Onboarding · Login · Login codes · Linked child accounts · **Batches** ·
**day-wise attendance** · **batch tests with syllabus + per-student marks** ·
Lectures & DPP dashboard · Announcements · Help centre · Purchases · Parent
profile · Admin Panel · **installable PWA** · **full-bleed fluid layout**

</div>

---

## 🚀 Quick start (local)

```bash
nvm use                 # .nvmrc -> Node 22 (Cloudflare Pages bhi yahi padhta hai)
npm ci                  # lockfile committed hai -> deterministic install
cp .env.example .env.local   # optional: bina env ke bhi app mock mode pe chalti hai
npm run dev             # http://localhost:3000
```

Full pipeline (jo CI aur Cloudflare dono chalate hain):

```bash
npm run verify          # typecheck + test + build + dist validation
npm run doctor          # deploy se pehle pre-flight checks
```

## ☁️ Deploy to Cloudflare Pages

**Short version:** Cloudflare Dashboard → Workers & Pages → Create → **Pages** →
Connect to Git → `GothwadTech/pwparent`, phir:

| Setting | Value |
|---|---|
| Framework preset | **Vite** |
| Build command | `npm run build` |
| Build output directory | **`dist`** |
| Root directory | `/` |
| Build system version | **V3** (Settings → Builds & deployments), agar option dikhe |
| Node version | **22** — repo me `.nvmrc` + `.node-version` committed hain, Cloudflare inhe khud padh leta hai |
| Env var `NODE_VERSION` | `22` *(sirf backup ke liye — Production **aur** Preview dono me)* |

Baaki environment variables: [`docs/CLOUDFLARE_PAGES.md`](docs/CLOUDFLARE_PAGES.md)

> **Deploy fail ho raha tha?** Repo side ki do asli wajah thi — `esbuild`
> peer-dependency conflict (`npm ci` hi fail ho jata tha) aur ek npm-10 arborist
> bug. Dono fix ho chuke hain, aur is branch pe GitHub Actions CI green hai
> (Node 20 + Node 22 dono pe).
>
> Agar Cloudflare ka build **phir bhi** fail ho aur CI green ho, to farq sirf
> build environment ka hai → **`NODE_VERSION=22`** env var Production *aur*
> Preview dono me lagao, output dir `dist` rakho, phir **Retry deployment**.
> Details: [`docs/DEPLOYMENT_TROUBLESHOOTING.md`](docs/DEPLOYMENT_TROUBLESHOOTING.md) §0b

CLI se deploy (`wrangler` deliberately dependency nahi hai — `npx` se on-demand
aata hai, warna 135 MB workerd + sharp native binaries install hote jo build ko
fail kar sakte hain):
```bash
npm run pages:build                                       # vite build + dist validation
npx wrangler@4 pages project create pwparent --production-branch=main
npx wrangler@4 pages deploy --project-name=pwparent       # ya: npm run pages:deploy
```

Production jaisa local preview (Functions + `_headers` + SPA fallback ke saath):
```bash
npm run pages:dev                                    # http://localhost:8788
```

> ### ⚠️ Ye ek DEMO BUILD hai
> Official Physics Wallah Parent's App **nahi** hai, aur kisi coaching
> organisation se affiliated nahi hai. Sign-in **koi SMS nahi bhejta**,
> academic records **editable sample data** hain, aur app ke corner pe ek
> `DEMO` badge rehta hai. Details: [`docs/FIREBASE.md` §7](docs/FIREBASE.md).

## 🔥 Firebase backend — ye default hai

**Firestore hi production path hai.** `VITE_BACKEND_MODE` ka default
`firebase` hai aur app me **koi demo dataset nahi** — adhoore env pe app
khaali dikhegi aur `backendConfigError` missing vars naam se batayega, nakli
marks invent nahi karega.

Mock mode (`VITE_BACKEND_MODE=mock`, localStorage) sirf **tests aur offline
dev** ke liye hai.

```bash
VITE_BACKEND_MODE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_USE_ANONYMOUS_AUTH=true
VITE_ADMIN_PASSCODE=...
```

Console me 6 kaam: Firestore create (`asia-south1`) → **Anonymous** +
**Email/Password** Auth enable → `firestore.rules` publish → Pages me env vars
daal ke **Retry deployment** → `pwparent.pages.dev` Authorized domains me →
admin register karke apne number ka login code issue karo.
Poora checklist → [`docs/FIREBASE.md`](docs/FIREBASE.md)

UI sirf `src/lib/backend` se baat karti hai, isliye mode switch karne pe
components change nahi karne padte:

```ts
import { getBackend } from './lib/backend';

const backend  = await getBackend();          // firebase | mock | unconfigured
const restored = await backend.restoreSession();        // boot: read-only resume
const result   = await backend.sendOtp(phone);          // registered? kuch bhejta nahi
const session  = await backend.verifyOtp(code, result); // PBKDF2 verify -> anonymous uid
const children = await backend.getLinkedStudents(session.uid);   // cached read
await backend.saveStudent({ ...child, attendance: '98%' });      // invalidates cache
```

Har read `cachedRead()` se guzarta hai (60s TTL + in-flight de-dupe) aur har
write `cachedWrite()` se (invalidate-after). Isliye screens ke beech navigate
karne pe **0 extra Firestore reads** — Spark ka 50k/day budget safe rehta hai.
Live counter app me hai: Settings dock → *Firestore reads*.

### Auth model: number = username, admin-set code = password
Phone/SMS OTP ke liye Firebase **Blaze (billing)** maangta hai — Spark pe
`auth/billing-not-enabled`. Isliye app **koi SMS nahi bhejti aur koi inbox
nahi padhti.** ₹0.

Uski jagah: user number type karta hai → admin ne us number ke liye jo 6-digit
code set kiya hai wahi maanga jata hai → verify hone par **Anonymous Auth** se
ek stable `uid` banta hai → number `parents/{uid}.mobileNumber` me **profile
field** ki tarah save hota hai. Rules us `uid` se har user ka data isolate
karte hain.

Code Firestore me **PBKDF2-SHA256 digest** bankar rehta hai (210 000 rounds,
per-code 16-byte salt, phone pepper, constant-time verify) — plaintext kabhi
nahi. See [`docs/SECURITY.md`](docs/SECURITY.md).

⚠️ Verification browser me hoti hai, isliye 6-digit code strong password nahi
hai. ⚠️ Number ko kisi bachche ke records ka lookup key mat banana — lookup key
hamesha `uid` hai.

## 🛠️ Admin Panel

Bottom-right ke **Settings dock** pe click karo, ya `#admin` URL pe jao.

**Firebase mode:** username + password. **Jo pehle register karta hai wahi ek
lauta admin banta hai — permanently.** `admins/{uid}` create hone ki ijazat
sirf tab hai jab `adminConfig/singleton` exist nahi karta, aur registration
dono documents ek atomic batch me likhti hai. Password **sirf Firebase Auth**
me rehta hai, Firestore me nahi.

**Mock mode:** `VITE_ADMIN_PASSCODE` (default `pw-admin-demo`) — bundle me
inline, sirf dev friction.

Paanch tabs:

| Tab | Kaam |
|---|---|
| **Batches** | ⭐ batch banao → students allot karo → **din-ba-din attendance** → **test + syllabus + har bachche ke marks** |
| **Students** | per-child academic record, DPPs |
| **Login codes** | har number ke liye 6-digit code issue/replace/delete |
| **Announcements** | shared feed |
| **Data** | session, Firestore read counter, cache control |

> ⚠️ Deploy ke **turant baad** khud register karo — warna koi aur admin ban
> jayega aur app se undo nahi hoga (console se karna padega).
> Poora guide → [`docs/ADMIN_PANEL.md`](docs/ADMIN_PANEL.md) ·
> threat model → [`docs/SECURITY.md`](docs/SECURITY.md)

Derived fields (`testsCompleted`, `avgScorePercent`, `accuracyPercent`,
per-test `scorePercent`) admin bharta nahi — `recomputeStudent()` har save pe
calculate karta hai, taaki scorecard kabhi apne aap se contradict na kare.
Ye invariant test-covered hai.

## 🗂️ Batch model — attendance, tests aur marks ka asli ghar

Model **batch-centric** hai, student-centric nahi. Pehle `TestRecord` har
student ke document ke *andar* embed tha aur `batch` sirf ek free-text string
thi. Ab:

```
batches/{batchId}                        admin banata hai
  ├─ members/{parentUid}                 allotment — studentIds[]
  ├─ attendance/{studentId}              EK doc, saare months andar
  └─ tests/{testId}                      test BATCH ka hai
       ├─ syllabus[]                     {subject, topic, weightage}
       └─ results/{studentId}            marksObtained · status · scorePercent
```

Teen design decisions jo soch-samajh ke liye gaye hain:

1. **`members` parent uid se keyed hai**, student id se nahi — taaki rules ek
   `exists()` me decide kar lein ki caller is batch ko padh sakta hai.
2. **Attendance ka ek document per student** (saare months andar), mahine ke
   hisaab se alag nahi. Isse rule me `attendance/{studentId}` pe seedha
   "kya ye is student ka parent hai?" lag jata hai — composite id parse karni
   nahi padti — aur calendar kholne pe 1 read lagta hai.
3. **Batch me hona = batch ka owner hona, nahi.** Har parent dekh sakta hai ki
   5 October ko test hua tha, 720 marks ka. Par `s1` ne kitna laya, ye sirf
   `s1` ka parent dekh sakta hai — `isParentOfStudent()` wahi check karta hai.

Isi wajah se **rank parents ko nahi dikhta**: rank ke liye poore class ke marks
chahiye, jo rules deliberately deny karte hain. Us slot pe attendance % hai.
Nakli rank dikhana ya class leak karna — dono usse bure hain.

`scorePercent` **derive** hota hai (`marksObtained / marksTotal`), caller use
bhej hi nahi sakta. Attendance % me **unmarked din denominator me nahi ginte**,
warna chalta mahina hamesha absent dikhta. Late = present.

Parents ka dashboard ab real data pe hai — `src/hooks/useBatchView.ts` Firestore
documents ko components ke purane shapes me map karta hai, isliye pixel-matched
UI ko chhedna nahi pada. Sirf `DppSection` aur lectures section abhi bhi sample
hain: batch model DPPs aur lectures track hi nahi karta, to jhootha source wire
karne se behtar hai saaf kehna.

## 📐 Layout — phone UI, poora screen

Mobile pe jo dikhta hai **wahi** desktop pe dikhta hai — koi alag desktop
design nahi. Farq sirf itna hai ki phone frame hat gaya hai aur UI poori
window bhar deta hai.

`src/lib/layout.ts` design ki 880px height se ek **uniform scale** nikalta hai
(cap 1.35), aur shell pe `transform: scale()` lagata hai saath me
`width/height: calc(100% / scale)` — shrink-then-scale trick, taaki layout
reflow kare aur result exactly viewport ke edges pe land ho. Uniform isliye ki
aspect ratio na toote; height-driven isliye ki width pe scale karne se layout
vertically squash ho jaye.

Scale `1` par ye ek **no-op** hai — mobile rendering byte-for-byte wahi hai jo
pehle thi. `zoom` deliberately use nahi kiya (uneven support + `position: fixed`
ke saath problem).

> Modals aur Settings dock scaled shell ke **sibling** hain, child nahi — CSS
> transform `position: fixed` descendants ka containing block ban jata hai,
> jo overlays ko andar trap kar deta.

## 📲 PWA — installable

`vite-plugin-pwa` (generateSW) se manifest + service worker build me aate hain.
Chrome/Edge me **Install** milega, Android pe home screen icon, aur shell
offline khulega.

| Cheez | Strategy |
|---|---|
| Build output (hashed JS/CSS/HTML) | precached, `autoUpdate` |
| `/assets/**` images | CacheFirst, 30 din |
| Navigation | NetworkFirst, offline pe cached shell |
| **`*.googleapis.com`, `*.firebaseapp.com`** | **NetworkOnly** — auth/Firestore kabhi SW cache me nahi |
| `/api/**` | NetworkOnly |

Firebase ko NetworkOnly rakhna zaroori hai: cached credential digest ya stale
scorecard dono galat hain. Read bachane ka kaam `readCache.ts` karta hai, SW
nahi.

⚠️ Plugin `dist/404.html` emit **nahi** karta — wo Pages ko SPA mode se bahar
nikaal deta. `npm run check:build` iska guard hai.

## 🧭 Admin Panel drill-down

Admin Panel flat tabs ka row **nahi** hai — ye ek drill-down hai:

```
Batches → ek batch → Students → ek bachcha
                                     ├─ academic record (edit)
                                     ├─ batches (jo actually exist karte hain, picker)
                                     └─ us family ke login codes (name + numbers)
```

Top-level sirf **Batches · Announcements · Data** bache hain. "Students" aur
"Login codes" alag tabs the hi nahi chahiye: ek flat Students tab hamesha
sirf *signed-in admin ke apne* bachche dikhata tha, isliye batch me 2 bachche
allot hone ke baad bhi list me 1 dikhta tha. Ab bachcha hamesha us batch ke
context me khulta hai jisse aap andar aaye.

Parent app me **Add Child nahi hai**. Bachcha admin banata hai (family chun ke),
taki record placeholder numbers se shuru na ho.

**Ek number = ek student.** Login ke baad parent app me chunne wali
("Continue") screen nahi aati — number jis bachche se bound hai, seedha uska
dashboard khulta hai. Binding `credentials/{phone}.studentId` pe hoti hai,
isliye zaroori hai: anonymous auth ek hi browser me har number ko same uid deta
hai, yaani uid se pata hi nahi chalta ki aap kis bachche ke liye aaye the.
Doosre bachche ka number do, to wahi doosra bachcha khulega — dono nahi.

Admin me login codes ek alag tab nahi hain: wo us bachche ke details me hain aur
**sirf usi bachche ke numbers** dikhate hain. Pehle global list dikhti thi,
isliye ek bachche ka code doosre ke screen pe bhi dikh jaata tha.

Ye narrowing **har parent screen** pe hoti hai, sirf login pe nahi. Binding se
sahi bachcha select ho jaata tha, par Profile section pura sibling list render
kar raha tha — isliye doosre bachche ki profile wahan bhi dikh jaati thi. Ab
`src/lib/studentScope.ts` ka `visibleStudentsFor()` har screen ko **exactly ek**
bachcha deta hai (bound → pehle se khula → pehla). Kuch delete nahi hota: admin
panel `listAllStudents()` se sabko dekhta rehta hai.

**Splash screen bhi nahi hai** — pehla paint hi usable screen hota hai
(pehli baar onboarding, uske baad seedha login). `src/lib/firstVisit.ts`.

## 📁 Structure

```
src/
  components/          screens + modals (UI) + SettingsDock
    admin/             AdminPanelScreen · AdminGate · BatchesTab ·
                       BatchDetailView · BatchMembersPanel ·
                       BatchAttendancePanel · BatchTestsPanel ·
                       TestResultsPanel · StudentDetailView ·
                       StudentCreatePanel · LoginCodesTab ·
                       AnnouncementsTab · DataTab · ui
  App.tsx              layout shell + screen router + #admin route
  hooks/useAppData.ts  saara state + saare data calls
  hooks/useBatchView.ts batch model -> dashboard component shapes
  types.ts             shared domain types (StudentProfile, TestRecord, ...)
  lib/layout.ts        fluid full-bleed scaling (uniform, height-driven)
  lib/config.ts        env parsing, mock/firebase/unconfigured resolution
  lib/admin.ts         passcode gate (mock), marks maths, recomputeStudent()
  lib/adminAuth.ts     registerAdmin / loginAdmin / currentAdmin (Firebase Auth)
  lib/credentials.ts   PBKDF2 hashing + constant-time verification
  lib/backend/         ← UI sirf yahi import kare
    index.ts             facade + unconfigured fallback
    types.ts             Backend interface
    firebaseBackend.ts   Firestore implementation (no demo fallbacks)
    mockBackend.ts       localStorage implementation (dev + tests)
    readCache.ts         TTL + in-flight de-dupe + cacheStats()
    batchTypes.ts        BatchOps contract + pure helpers (date keys,
                         attendance maths, scorePercent, syllabus weight)
    firebaseBatches.ts   batch ops — Firestore
    mockBatches.ts       batch ops — localStorage
    mockData.ts          TEST FIXTURE (mock mode ka starting content)
    demoStore.ts         localStorage layer
  lib/firebase/        app / auth (ANONYMOUS) / firestore helpers + paths
  tests/               vitest + happy-dom + Testing Library (113 tests)
    env/               intentionally empty — keeps tests env-independent
functions/             Cloudflare Pages Functions (optional, server-side)
  _middleware.ts       /api/* CORS + /api/health
  api/ai.ts            Gemini proxy (key server-side rehti hai)
public/_headers        security + cache headers
public/_redirects      redirect rules (SPA fallback Pages khud karta hai — 404.html mat banao)
firestore.rules        owner-scoped + admins allow-list + permanent admin slot
public/icons/          PWA icons (192, 512, maskable, apple-touch, favicon)
firebase.json          rules pointer ONLY — no hosting (site Pages se deploy hoti hai)
scripts/
  check-build-output.mjs   dist sanity + secret-leak scan
  doctor.mjs               deploy pre-flight
.github/workflows/
  ci.yml               typecheck → test → build → validate  (ONLY workflow)
docs/                  CLOUDFLARE_PAGES · ENVIRONMENT · FIREBASE · ADMIN_PANEL
                       · SECURITY · TROUBLESHOOTING
```

> Deploy **Cloudflare Git integration** se hota hai (Option A). Isliye koi
> `deploy-cloudflare-pages.yml` nahi hai — do workflows ek saath production
> deployments compete karte. `npm run doctor` iska guard hai.

## 🧪 Scripts

| Command | Kaam |
|---|---|
| `npm run dev` | Vite dev server (`:3000`, host `0.0.0.0`) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | `dist/` ko Vite preview pe serve karo (`:4173`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (43 tests, happy-dom) |
| `npm run test:watch` | Watch mode |
| `npm run check:build` | `dist/` validation + secret-leak scan |
| `npm run doctor` | Deploy pre-flight (lockfile, Node, configs, git hygiene) |
| `npm run verify` | typecheck + test + build + check:build |
| `npm run pages:build` | build + check (CI/Pages ke liye) |
| `npm run pages:dev` | build + `npx wrangler@4 pages dev dist` (`:8788`) |
| `npm run pages:deploy` | build + `npx wrangler@4 pages deploy` |
| `npm run clean` | `dist/`, vite cache, `.wrangler/` hatao |

## 🔐 Secrets

- `VITE_*` = **public**, build time pe bundle me inline. Firebase web config yahan
  aata hai (wo public hota hai by design).
- Bina prefix wale (`GEMINI_API_KEY`) = **secret**, sirf Pages Functions ke liye:
  ```bash
  npx wrangler pages secret put GEMINI_API_KEY --project-name=pwparent
  ```
  Local pe `.dev.vars` (git-ignored, template: `.dev.vars.example`).

CI har build pe bundle scan karta hai — secret leak hone pe build **fail**.

## 📚 Docs

- [Cloudflare Pages deploy guide](docs/CLOUDFLARE_PAGES.md) — dashboard + CLI + Actions, verification, rollback
- [Environment variables](docs/ENVIRONMENT.md) — precedence, har variable, copy-paste sets
- [Firebase setup](docs/FIREBASE.md) — anonymous auth, Firestore, rules, console checklist, troubleshooting
- [Admin Panel](docs/ADMIN_PANEL.md) — passcode, editable fields, derived maths, honest limits
- [Deployment troubleshooting](docs/DEPLOYMENT_TROUBLESHOOTING.md) — error-by-error fixes
- [Contributing](docs/CONTRIBUTING.md)

---

<sub>Originally generated with [Google AI Studio](https://ai.studio/apps/e150708e-6287-459f-89a4-5d57e7827e8c) · Apache-2.0</sub>
