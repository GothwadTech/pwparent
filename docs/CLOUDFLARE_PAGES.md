# Cloudflare Pages — Deploy Guide (PW Parent's App)

Ye app ek **Vite + React 19 SPA** hai. Build output = `dist/`. Cloudflare Pages
usko static assets ki tarah serve karta hai, aur `functions/` directory (optional)
server-side Pages Functions chalati hai.

> **TL;DR (90 second wala setup)**
> 1. `package-lock.json` commit karo (already committed hai).
> 2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → repo `GothwadTech/pwparent`.
> 3. Build settings:
>    - **Build command:** `npm run build`
>    - **Build output directory:** `dist`
>    - **Root directory:** `/`
>    - **Node version:** `22`  ← env var `NODE_VERSION=22` zaroor lagana
> 4. Environment variables (Production + Preview dono me) — see [Environment variables](#environment-variables)
> 5. **Save and Deploy.** URL: `https://pwparent.pages.dev`

---

## 1. Repo me kya-kya hai

| File | Kaam |
|---|---|
| `wrangler.jsonc` | Pages project config (`name`, `pages_build_output_dir: ./dist`, SPA 404 handling). `wrangler pages dev` / `wrangler pages deploy` isko padhta hai. |
| `public/_redirects` | Redirect/rewrite rules. **Note:** classic SPA rule `/*  /index.html  200` yahan mat daalo — wo infinite-loop me discard ho jata hai. SPA fallback `wrangler.jsonc` ke `not_found_handling` se aata hai. |
| `public/_headers` | Security + cache headers (hashed assets = immutable, `index.html` = no-cache). |
| `functions/_middleware.ts` | `/api/*` pe CORS + `/api/health` endpoint. Static routes ko touch nahi karta. |
| `functions/api/ai.ts` | Optional Gemini proxy — API key **server side** rehti hai, bundle me nahi jati. |
| `.github/workflows/ci.yml` | Har push/PR pe typecheck → test → build → build-output validation. |
| `.github/workflows/deploy-cloudflare-pages.yml` | Wrangler se direct deploy (Option B). |
| `scripts/check-build-output.mjs` | Deploy se pehle `dist/` sanity + secret-leak check. |
| `.env.example` | Saare env vars ka template + explanation. |
| `.dev.vars.example` | Local Pages Functions ke secrets (copy → `.dev.vars`, git-ignored). |
| `.npmrc` | CI install behaviour (audit/fund off). |

---

## 2. Deploy — Option A: Git integration (recommended)

Cloudflare khud build karta hai jab bhi tum push karte ho.

1. **Dashboard** → Workers & Pages → **Create application** → **Pages** → **Connect to Git**.
2. GitHub account connect karo → `GothwadTech/pwparent` select karo.
3. **Production branch:** `main`
4. Build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | **Vite** |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (leave empty) |
   | Build system | **Vite** (agar option dikhe) |

   Repo me `wrangler.jsonc` already hai (`pages_build_output_dir: ./dist`), to
   Cloudflare in settings ko khud detect kar leta hai — phir bhi ek baar
   cross-check kar lena.

5. **Environment variables** (neeche section 4) add karo → **Save and Deploy**.

> ⚠️ **Sabse zaroori:** env vars add karne ke baad deployment **dobara run** karni
> padti hai. Vite env ko **build time** pe inline karta hai — runtime pe nahi.
> (Deployments → latest → **Retry deployment**.)

Preview: har non-`main` branch/PR ko apna preview URL milta hai
(`https://<hash>.pwparent.pages.dev`), production URL untouched rehta hai.

---

## 3. Deploy — Option B: Wrangler (CLI ya GitHub Actions)

```bash
npm ci
npm run pages:build                 # vite build + dist validation
npx wrangler login                  # browser me Cloudflare auth
npx wrangler pages project create pwparent --production-branch=main
npx wrangler pages deploy --project-name=pwparent --branch=main
```

`npm run pages:deploy` = upar wale last 2 steps (build + deploy) ek saath.

GitHub Actions se automatic deploy chahiye to `.github/workflows/deploy-cloudflare-pages.yml`
already ready hai. Bas 2 repo secrets chahiye:

| Secret | Kahan se |
|---|---|
| `CLOUDFLARE_API_TOKEN` | dash.cloudflare.com → My Profile → **API Tokens** → Create Token → template *Edit Cloudflare Workers* (ya custom: **Account → Cloudflare Pages → Edit**) |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard ke right sidebar me, ya URL `dash.cloudflare.com/<32-char-id>` |

> Option A aur Option B **ek saath mat chalao** — dono deploy karenge aur
> deployments ek dusre ko override karenge. Git integration use kar rahe ho to
> `deploy-cloudflare-pages.yml` delete kar do (CI workflow kaafi hai).

---

## 4. Environment variables

### 4a. Client (browser) variables — `VITE_` prefix zaroori

Pages dashboard → project → **Settings → Environment variables** → add for
**Production** *and* **Preview**:

| Variable | Example | Zaroori? | Kya karta hai |
|---|---|---|---|
| `VITE_APP_ENV` | `production` | nahi | Logs/badges ke liye environment label |
| `VITE_APP_URL` | `https://pwparent.pages.dev` | nahi | Self-referential links / callbacks |
| `VITE_APP_VERSION` | `1.0.0` | nahi | Profile screen pe version dikhane ke liye |
| `VITE_BACKEND_MODE` | `mock` \| `firebase` | haan | Data source switch (default `mock`) |
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | firebase ke liye | Firebase web config |
| `VITE_FIREBASE_AUTH_DOMAIN` | `pwparent.firebaseapp.com` | firebase ke liye | " |
| `VITE_FIREBASE_PROJECT_ID` | `pwparent` | firebase ke liye | " |
| `VITE_FIREBASE_STORAGE_BUCKET` | `pwparent.firebasestorage.app` | firebase ke liye | " |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1234567890` | firebase ke liye | " |
| `VITE_FIREBASE_APP_ID` | `1:1234...:web:abcd` | firebase ke liye | " |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-XXXXXXXXXX` | nahi | Analytics (optional) |
| `VITE_RECAPTCHA_SITE_KEY` | `6Lf...` | nahi | Phone auth ka reCAPTCHA (agar enable kiya) |

**Rules:**
- Bina `VITE_` prefix wala variable browser bundle me **nahi** jata.
  (`src/lib/config.ts` convenience ke liye `FIREBASE_*` bhi padh leta hai —
  Firebase console ka snippet as-is paste kar sakte ho.)
- Ye values **public** hain. Firebase web config public hota hai by design —
  security **Firestore rules + App Check** se aati hai, key chhupane se nahi.
- Placeholder (`MY_...`) values ko code "not set" maanta hai → app mock mode pe
  chalti rehti hai, crash nahi hoti.

### 4b. Server secrets — Pages Functions ke liye

`GEMINI_API_KEY` jaisi cheezein **kabhi** `VITE_` prefix ke saath mat daalna.

```bash
# CLI se (encrypt ho ke store hota hai)
npx wrangler pages secret put GEMINI_API_KEY --project-name=pwparent

# ya dashboard: Settings -> Environment variables -> Encrypt
```

Local dev me: `cp .dev.vars.example .dev.vars` aur value bhar do
(`.dev.vars` git-ignored hai, `wrangler pages dev` usko padhta hai).

| Secret | Use |
|---|---|
| `GEMINI_API_KEY` | `functions/api/ai.ts` — Gemini proxy |
| `GEMINI_MODEL` | optional, default `gemini-2.5-flash` |
| `ALLOWED_ORIGIN` | optional, `/api/*` CORS allowlist (pages.dev auto-allowed) |

### 4c. Build-time vars (dashboard me env var ki tarah add karo)

| Variable | Value | Kyun |
|---|---|---|
| `NODE_VERSION` | `22` | Vite 8 ko Node ≥ 20.19 chahiye. Cloudflare ka default Node aksar purana hota hai → build fail. |
| `NPM_FLAGS` | *(khali chhod do)* | `--legacy-peer-deps` **mat** daalo — lockfile commit hai, zaroorat nahi. |
| `NODE_OPTIONS` | `--max-old-space-size=4096` | Sirf agar build OOM ho (ise pehle mat lagana). |

---

## 5. Local dev + local Pages preview

```bash
cp .env.example .env.local        # values bharo (optional — mock mode chalta hai)
npm ci

npm run dev                       # http://localhost:3000  (Vite dev server)

# Functions ke saath real Pages behaviour locally:
cp .dev.vars.example .dev.vars    # secrets bharo (optional)
npm run pages:dev                 # build + wrangler pages dev dist -> http://localhost:8788
```

`wrangler pages dev` `_redirects`, `_headers` aur `functions/` — sab emulate
karta hai, to production jaisa behaviour local pe mil jata hai.

---

## 6. Verify deployment

```bash
curl -I https://pwparent.pages.dev                    # 200 + security headers
curl -I https://pwparent.pages.dev/some/deep/link     # 200 (SPA fallback), 404 NAHI
curl -s  https://pwparent.pages.dev/api/health        # {"ok":true,...}  (Functions live)
curl -I https://pwparent.pages.dev/index.html         # 307 -> /  (auto-trailing-slash)
```

Ye sab local pe bhi verify ho chuka hai (`wrangler pages dev dist`): `/`, `/dashboard`,
`/profile`, `/some/random/deep/link` → **200**, `/assets/*` → `max-age=31536000, immutable`,
`/api/health` → `{ok:true}`.

Checklist:
- [ ] `index.html` 200 deta hai, assets `/assets/*` se load ho rahe hain
- [ ] Refresh pe blank/404 nahi aata
- [ ] `dist/_redirects` + `dist/_headers` deploy hue (CI `check:build` ye verify karta hai)
- [ ] `wrangler.jsonc` me `assets.directory` + `not_found_handling` set hai (bina `directory` ke wrangler error deta hai)
- [ ] Console me `[config] Running in MOCK mode` ya Firebase init — jo expect kiya tha wahi
- [ ] Bundle me koi secret nahi (CI ka secret scan pass)

---

## 7. Custom domain

Pages project → **Custom domains** → Set up a custom domain →
`app.yourdomain.com`. DNS Cloudflare pe hai to record automatically ban jata hai
(CNAME `pwparent.pages.dev`) aur SSL bhi. Non-Cloudflare DNS pe CNAME manually
add karna padega.

---

## 8. Troubleshooting — "deploy nahi ho raha"

| Symptom (Pages build log) | Reason | Fix |
|---|---|---|
| `npm error code ERESOLVE` / `Could not resolve dependency: peerOptional esbuild` | Purana `package.json` me `esbuild@^0.25` pin tha jo Vite 8 (`esbuild ^0.27\|\|^0.28`) se conflict karta tha | **Fixed** — `esbuild` hata diya. Ab `package-lock.json` commit hai + `npm ci` use hota hai. |
| `Cannot read properties of null (reading 'edgesOut')` | npm 10 ka arborist bug, `jsdom` ke optional `canvas` peer pe | **Fixed** — tests ab `happy-dom` pe hain (koi native/optional peer nahi). |
| Build succeeds but site 404 / "There is nothing here yet" | Build output directory galat (`build/` ya `/dist` with slash) | **`dist`** set karo (no leading slash). |
| Blank white page, console me `Failed to load module script` | Asset base path ya stale cache | Hard refresh; `vite.config.ts` me `base` default `/` rehne do. |
| Page loads but app is empty / `undefined` values | `VITE_*` vars build ke time existing nahi the | Env vars **Production + Preview** dono me add karo, phir **Retry deployment**. |
| Refresh pe 404 | SPA fallback nahi laga | `wrangler.jsonc` → `assets.not_found_handling: "single-page-application"` (already set). `_redirects` me `/* /index.html 200` **mat** daalo — wo rule infinite-loop bol ke ignore hota hai. |
| `error:0308010C:digital envelope routines::unsupported` ya `SyntaxError: Unexpected token '?'` | Node version purana (16/18) | Env var `NODE_VERSION=22`. |
| `vite: command not found` | Install step skip / `npm ci` fail hua | Build command `npm run build` rakho (Cloudflare pehle `npm ci` chalata hai). |
| Deploy hota hai par purana version dikhta hai | Branch mapping | `main` = Production branch honi chahiye (Settings → Builds & deployments). |
| `Authentication error [code: 10000]` (wrangler) | Token/account id galat | `CLOUDFLARE_API_TOKEN` me **Cloudflare Pages: Edit** permission + correct `CLOUDFLARE_ACCOUNT_ID`. |
| Pages project ka naam alag hai | `wrangler.jsonc` me `name: "pwparent"` | Naam project se match karo, ya `--project-name=<actual>` pass karo. |
| Functions deploy nahi ho rahi | `functions/` root pe hona chahiye (dist ke andar nahi) | Structure: `functions/api/ai.ts` ✅ |
| Build bahut slow / timeout | Cold npm cache | `.npmrc` + lockfile se `npm ci` fast hai; `devDependencies` me jo use nahi hota wo hata diya gaya hai. |

**Quick diagnosis commands:**

```bash
npm ci && npm run verify          # local pe pura pipeline (typecheck+test+build+check)
npm run pages:build               # sirf build + dist validation
npx wrangler pages dev dist       # production-like local run
```

Agar `npm run verify` local pe pass hai aur Pages pe fail — to difference sirf
env vars ya Node version ka hai. Dono `NODE_VERSION=22` pe align karo.

---

## 9. Rollback

Pages → **Deployments** → kisi purani deployment pe **⋯ → Rollback to this
deployment**. Instant, no rebuild. (Git integration me rollback ek naya
deployment banata hai jo us commit ka artifact dobara serve karta hai.)

---

## 10. Related docs

- [`docs/ENVIRONMENT.md`](./ENVIRONMENT.md) — har variable ka detail + local vs Pages precedence
- [`docs/FIREBASE.md`](./FIREBASE.md) — Firebase backend enable karna, rules, phone OTP wiring
- [`docs/DEPLOYMENT_TROUBLESHOOTING.md`](./DEPLOYMENT_TROUBLESHOOTING.md) — full error-by-error guide
- Cloudflare: https://developers.cloudflare.com/pages/
- Vite env & modes: https://vite.dev/guide/env-and-mode
