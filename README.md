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

CLI se deploy:
```bash
npm run pages:build                                  # vite build + dist validation
npx wrangler pages project create pwparent --production-branch=main
npx wrangler pages deploy --project-name=pwparent    # ya: npm run pages:deploy
```

Production jaisa local preview (Functions + `_headers` + SPA fallback ke saath):
```bash
npm run pages:dev                                    # http://localhost:8788
```

## 🔥 Firebase backend

Firebase ka scaffold ready hai — default **mock mode** (demo data, zero network),
aur env vars bharne pe real Firebase Auth (phone OTP) + Firestore:

```bash
VITE_BACKEND_MODE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Step-by-step setup, Firestore security rules, App Check, phone-OTP wiring aur
Cloudflare Pages ke saath kya chalta hai / kya nahi →
[`docs/FIREBASE.md`](docs/FIREBASE.md)

UI sirf `src/lib/backend` se baat karti hai, isliye mode switch karne pe
components change nahi karne padte:

```ts
import { getBackend } from './lib/backend';

const backend = await getBackend();          // mock | firebase (env se decide)
const children = await backend.getLinkedStudents();
const sent     = await backend.sendOtp(phone);
const result   = await backend.verifyOtp(code, sent);
```

## 📁 Structure

```
src/
  components/          38 screens + modals (pure UI)
  lib/config.ts        env parsing, validation, mock/firebase mode
  lib/backend/         facade + mock dataset  ← UI yahi import kare
  lib/firebase/        app / auth (phone OTP) / firestore helpers
  tests/               vitest + happy-dom + Testing Library
  types.ts             shared domain types
functions/             Cloudflare Pages Functions (optional, server-side)
  _middleware.ts       /api/* CORS + /api/health
  api/ai.ts            Gemini proxy (key server-side rehti hai)
public/_headers        security + cache headers
public/_redirects      redirect rules (SPA fallback wrangler.jsonc se)
scripts/
  check-build-output.mjs   dist sanity + secret-leak scan
  doctor.mjs               deploy pre-flight
.github/workflows/
  ci.yml                       typecheck → test → build → validate
  deploy-cloudflare-pages.yml  wrangler deploy (Option B)
docs/                  CLOUDFLARE_PAGES · ENVIRONMENT · FIREBASE · TROUBLESHOOTING
```

## 🧪 Scripts

| Command | Kaam |
|---|---|
| `npm run dev` | Vite dev server (`:3000`, host `0.0.0.0`) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | `dist/` ko Vite preview pe serve karo (`:4173`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (12 tests, happy-dom) |
| `npm run test:watch` | Watch mode |
| `npm run check:build` | `dist/` validation + secret-leak scan |
| `npm run doctor` | Deploy pre-flight (lockfile, Node, configs, git hygiene) |
| `npm run verify` | typecheck + test + build + check:build |
| `npm run pages:build` | build + check (CI/Pages ke liye) |
| `npm run pages:dev` | build + `wrangler pages dev dist` |
| `npm run pages:deploy` | build + `wrangler pages deploy` |
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
- [Firebase setup](docs/FIREBASE.md) — Auth/Firestore/rules/App Check + exact wiring steps
- [Deployment troubleshooting](docs/DEPLOYMENT_TROUBLESHOOTING.md) — error-by-error fixes
- [Contributing](docs/CONTRIBUTING.md)

---

<sub>Originally generated with [Google AI Studio](https://ai.studio/apps/e150708e-6287-459f-89a4-5d57e7827e8c) · Apache-2.0</sub>
