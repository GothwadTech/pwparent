<div align="center">

# PW Parent's App

**Vite + React 19 + Tailwind 4 SPA** — Cloudflare Pages pe deploy-ready, Firebase backend ke liye scaffolded.

![CI](https://github.com/GothwadTech/pwparent/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.19-brightgreen)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)

Onboarding · Login · OTP · Linked child accounts · Lectures & DPP dashboard ·
Weekly report · Announcements · Help centre · Purchases · Parent profile

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

## 🔥 Firebase backend — wired, ready to flip

**Code poora likha ja chuka hai.** `src/App.tsx`, `src/lib/backend/` aur
`src/lib/firebase/` wire ho gaye hain. Default **mock mode** (localStorage,
zero network) — env vars bharne pe **Anonymous Auth + Firestore**:

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

Console me sirf 4 kaam: Firestore create (`asia-south1`) → **Anonymous Auth
enable** → `firestore.rules` publish → Pages me env vars daal ke **Retry
deployment**. Poora checklist → [`docs/FIREBASE.md`](docs/FIREBASE.md)

UI sirf `src/lib/backend` se baat karti hai, isliye mode switch karne pe
components change nahi karne padte:

```ts
import { getBackend } from './lib/backend';

const backend  = await getBackend();          // mock | firebase (env se decide)
const session  = await backend.signInWithPhone(phone);  // anonymous uid + phone as profile field
const children = await backend.getLinkedStudents(session.uid);
await backend.saveStudent({ ...child, attendance: '98%' });
```

### Auth model: phone number credential KYUN nahi hai
Phone/SMS OTP ke liye Firebase **Blaze (billing)** maangta hai — Spark pe
`auth/billing-not-enabled`. Isliye app **Anonymous Auth** use karti hai
(free, 50K MAU): user number type karta hai, ek stable `uid` silently ban
jata hai, aur number `parents/{uid}.mobileNumber` me **profile field** ki
tarah save hota hai. Rules us `uid` se har user ka data isolate karte hain.

⚠️ Number **verify nahi hota** — isliye use kabhi bhi kisi bachche ke
records ka lookup key mat banana. Lookup key hamesha `uid` hai.

## 🛠️ Admin Panel

Bottom-right ke `DEMO · <mode> · admin` badge pe click karo, ya `#admin`
URL pe jao. Passcode: `pw-admin-demo` (`VITE_ADMIN_PASSCODE` se badlo).

Edit kar sakte ho: students, **attendance, marks, tests (raw marks → derived
percentages)**, DPPs, announcements, purchases. Plus **Seed demo data**
(atomic) aur **Clear local demo store**.

> ⚠️ Passcode ek **client-side gate** hai — Vite use public bundle me inline
> kar deta hai. Real authorisation `firestore.rules` ke `admins/{uid}`
> allow-list me hai (console-only, app khud ko promote nahi kar sakti).
> Poora guide → [`docs/ADMIN_PANEL.md`](docs/ADMIN_PANEL.md)

Derived fields (`testsCompleted`, `avgScorePercent`, `accuracyPercent`,
per-test `scorePercent`) admin bharta nahi — `recomputeStudent()` har save pe
calculate karta hai, taaki scorecard kabhi apne aap se contradict na kare.
Ye invariant test-covered hai.

## 📁 Structure

```
src/
  components/          38 screens + modals (UI) + AdminPanelScreen + DemoBadge
  App.tsx              screen router, backend wiring, #admin route
  types.ts             shared domain types (StudentProfile, TestRecord, ...)
  lib/config.ts        env parsing, validation, mock/firebase mode, demo flags
  lib/admin.ts         passcode gate, marks maths, recomputeStudent()
  lib/backend/         facade + mock dataset + demoStore  ← UI yahi import kare
    index.ts             Backend interface + mock & firebase implementations
    mockData.ts          shipped demo dataset
    demoStore.ts         localStorage layer (mock mode persistence)
  lib/firebase/        app / auth (ANONYMOUS) / firestore helpers + paths
  tests/               vitest + happy-dom + Testing Library
    env/               intentionally empty — keeps tests env-independent
functions/             Cloudflare Pages Functions (optional, server-side)
  _middleware.ts       /api/* CORS + /api/health
  api/ai.ts            Gemini proxy (key server-side rehti hai)
public/_headers        security + cache headers
public/_redirects      redirect rules (SPA fallback Pages khud karta hai — 404.html mat banao)
firestore.rules        Firestore security rules (owner-scoped + admins allow-list)
firebase.json          rules pointer ONLY — no hosting (site Pages se deploy hoti hai)
scripts/
  check-build-output.mjs   dist sanity + secret-leak scan
  doctor.mjs               deploy pre-flight
.github/workflows/
  ci.yml               typecheck → test → build → validate  (ONLY workflow)
docs/                  CLOUDFLARE_PAGES · ENVIRONMENT · FIREBASE · ADMIN_PANEL · TROUBLESHOOTING
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
