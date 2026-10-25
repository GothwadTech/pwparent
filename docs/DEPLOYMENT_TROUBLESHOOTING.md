# Deployment Troubleshooting — Cloudflare Pages

Har error ka **exact log line**, reason, aur fix. Pehle 2 issues is repo me
already fix ho chuke hain (section 1) — wahi asli wajah thi ki deploy nahi ho
raha tha.

---

## 0. 30-second diagnosis

```bash
npm ci
npm run verify        # typecheck + test + build + dist validation
```

- **Local pass, Pages fail** → problem env vars / Node version / build settings me hai (§3, §4).
- **Local fail** → pehle local fix karo; Pages kabhi pass nahi hoga (§1, §2).

---

## 1. Dependency resolution failures  *(is repo me fix ho chuka)*

### 1a. `ERESOLVE` — esbuild vs vite

**Log:**
```
npm error code ERESOLVE
npm error While resolving: vite@8.3.5
npm error Found: esbuild@0.25.12
npm error   dev esbuild@"^0.25.0" from the root project
npm error Could not resolve dependency:
npm error peerOptional esbuild@"^0.27.0 || ^0.28.0" from vite@8.3.5
```

**Reason:** AI Studio ke exported `package.json` me `esbuild@^0.25.0` ek alag
devDependency tha. Vite 8 ko esbuild 0.27/0.28 chahiye → npm strict peer
resolution fail → **Cloudflare ka build `npm install` step pe hi ruk jata tha.**

**Fix (already applied):**
- `esbuild` dependency hata di — Vite usko khud transitively laata hai, alag se
  pin karne ki zaroorat hi nahi thi.
- Saath me unused server deps bhi hataye (`express`, `@types/express`, `dotenv`,
  `tsx`) — repo me koi `server.js` nahi tha, aur ye Cloudflare install time
  badha rahe the.
- `package-lock.json` **commit** kiya (340 packages) → Cloudflare `npm ci`
  chalaega → resolution dobara hota hi nahi, tree already decided hai.

**Dobara kabhi na ho:** naya dependency add karo to `npm install` local pe
chalao aur **`package-lock.json` commit karo**. `npm install --force` /
`--legacy-peer-deps` se fix mat karo — wo sirf error chhupata hai.

### 1b. `Cannot read properties of null (reading 'edgesOut')`

**Log:**
```
npm error Cannot read properties of null (reading 'edgesOut')
npm error     at #loadPeerSet (.../@npmcli/arborist/lib/arborist/build-ideal-tree.js:1289:38)
```

**Reason:** npm 10.x ka arborist bug. Trigger: `jsdom@26/27` ka **optional peer**
`canvas@^3` (native module). npm peer-set load karte waqt crash ho jata hai.
Cloudflare ka default npm bhi 10.x hi hota hai → same failure wahan.

**Fix (already applied):** test environment `jsdom` → **`happy-dom`** kar diya
(`vitest.config.ts`). happy-dom pure-JS hai, koi native/optional peer nahi →
npm 10, npm 12, Node 20, Node 22 sab pe install ho jata hai.

**Agar tumhe jsdom hi chahiye:** npm ko upgrade karo — Pages env var
`NPM_FLAGS` nahi, balki build command me:
```
npm i -g npm@12 && npm ci && npm run build
```
ya GitHub Actions wale deploy path (Option B) use karo jahan Node 22 + npm 12
guaranteed hai.

---

## 2. Build failures

### 2a. Node version purana

**Log:** `SyntaxError: Unexpected token '?'` · `error:0308010C:digital envelope routines::unsupported` · `Cannot find module 'node:path'`

**Fix:** Pages → Settings → Environment variables →
```
NODE_VERSION=22
```
(Vite 8 + Tailwind 4 ko Node ≥ 20.19 chahiye. `package.json` me `engines` bhi
set hai.)

### 2b. `vite: command not found`

**Reason:** Cloudflare ne install step skip kiya, ya build command me direct
`vite build` likha hai jab `node_modules` install hi nahi hua.

**Fix:** Build command sirf `npm run build` rakho. Cloudflare usse pehle khud
`npm ci`/`npm install` chalata hai. Custom command chahiye to:
```
npm ci && npm run build
```

### 2c. TypeScript errors

`npm run build` is repo me sirf `vite build` chalata hai (esbuild transpile
karta hai, type-check nahi). Isliye type errors build fail **nahi** karte —
CI (`npm run typecheck`) pakadta hai.

Agar tum chahte ho ki type error pe deploy ruke:
```json
"build": "tsc --noEmit && vite build"
```
(Thoda slow ho jata hai, par strict rehta hai.)

### 2d. Out of memory / build timeout

**Log:** `JavaScript heap out of memory` · build 15+ min

**Fix:**
```
NODE_OPTIONS=--max-old-space-size=4096
```
Aur `devDependencies` clean rakho (is repo se express/tsx/jsdom nikal diye →
install ~40% fast).

---

## 3. Deploy ho gaya, par site kaam nahi kar rahi

### 3a. "There is nothing here yet" / 404 on `/`

| Reason | Fix |
|---|---|
| Build output directory galat | **`dist`** (leading slash nahi, `build/` nahi) |
| Root directory galat set | monorepo nahi hai → **`/`** ya khali |
| Branch mapping | Settings → Builds & deployments → **Production branch = `main`** |
| Deployment actually fail hui | Deployments list me status dekho — "Success" hai ya nahi |

### 3b. Page load hota hai par **blank white**

1. Browser DevTools → **Console** kya bolta hai?
2. `Failed to load module script` / MIME error → assets 404 ho rahe hain →
   output dir check karo.
3. `[config] Running in MOCK mode` → ye **error nahi**, informational hai. App
   mock data pe chalegi.
4. CSP violation → `public/_headers` me CSP **commented** hai by default. Agar
   tumne uncomment kiya hai to `index.html` ke inline Tailwind classes aur
   Vite ka inline modulepreload script block ho rahe honge → `style-src` aur
   `script-src` me `'unsafe-inline'` chahiye, ya inline script hatao.
5. Env var missing → `undefined` values se crash. Check:
   ```bash
   curl -s https://<yours>.pages.dev/assets/index-*.js | grep -c "undefined"
   ```
   Behtar: Pages env vars add karke **Retry deployment**.

### 3c. Refresh / deep link pe 404  *(is repo me fix ho chuka)*

**Reason:** SPA fallback set nahi tha.

**⚠️ Common galti:** `public/_redirects` me classic rule daalna:
```
/*    /index.html   200      ← MAT DAALO
```
Default `html_handling: auto-trailing-slash` ke saath ye rule `.html` strip karta
hai, dobara `/*` se match hota hai, aur Cloudflare isko **infinite loop** bol ke
ignore kar deta hai:
```
▲ [WARNING] Found 1 invalid redirect rule:
  ▶︎ Infinite loop detected in this rule and has been ignored...
      at dist/_redirects:9 | /*    /index.html   200
```
Matlab fallback chupchap mar jata hai aur tumhe 404 milte hain.

**Fix (already applied):** fallback `wrangler.jsonc` se aata hai:
```jsonc
"assets": {
  "directory": "./dist",                                   // REQUIRED
  "not_found_handling": "single-page-application",
  "html_handling": "auto-trailing-slash"
}
```

Verify:
```bash
npm run build
npx wrangler pages dev dist
curl -o /dev/null -sw "%{http_code}\n" localhost:8788/some/deep/link   # 200
curl -o /dev/null -sw "%{http_code}\n" localhost:8788/index.html       # 307 -> /
```
`npm run check:build` ab `_redirects` me us loop wale rule ko **fail** karta hai,
to ye galti dobara commit nahi ho sakti.

Agar tum Git-integration (Option A) use kar rahe ho aur `wrangler.jsonc` ignore
ho raha ho (kuch purane setups me hota tha), tab fallback `_redirects` se chahiye —
us case me `html_handling` ko `none` karo ya rule ko exact paths tak limited rakho.

### 3d. Purana version dikh raha hai

- `index.html` pe `Cache-Control: public, max-age=0, must-revalidate` set hai
  (`public/_headers`), to hard refresh se aa jana chahiye.
- Env vars change kiye par **redeploy nahi** kiya → purana bundle hi rahega.
- Galat branch dekh rahe ho: production `https://<project>.pages.dev` hai,
  preview `https://<hash>.<project>.pages.dev`.

### 3e. Env vars "set" hain par app unhe padh nahi rahi

Checklist:
1. Prefix `VITE_` hai? (bina prefix → browser me nahi jata)
2. **Production** aur **Preview** dono me add kiya? (ek me add karke dusre pe test karna = blank)
3. Deploy ke **baad** retry kiya? (Vite build-time inline karta hai)
4. Value ke around quotes theek hain? (`VITE_X="abc"` sahi; `'abc'` bhi chalega)
5. Local pe `.env.local` hai aur usme sahi mode? `npm run dev` `.env.local` padhta hai,
   `npm run build -- --mode production` `.env.production` bhi.

Debug: browser console me
```js
// dev server pe
import.meta.env            // saare VITE_* dikhenge
```
Production bundle me ye inline ho chuka hota hai, isliye `src/lib/config.ts` ka
log line dekho — wo missing keys ki exact list deta hai.

---

## 4. GitHub Actions failures

| Error | Fix |
|---|---|
| `npm ci` → `can only install with an existing package-lock.json` | `package-lock.json` commit karo (`.gitignore` me nahi hona chahiye) |
| `npm ci` → lockfile out of sync | local pe `npm install` chalao, naya lockfile commit karo |
| `Authentication error [code: 10000]` | `CLOUDFLARE_API_TOKEN` me **Cloudflare Pages: Edit** permission; token expired to regenerate |
| `Could not find project with name` | `wrangler.jsonc` ka `name` aur Pages project ka naam same karo, ya workflow me `--project-name=<actual>` |
| `Authentication failed [code: 10011]` / account not found | `CLOUDFLARE_ACCOUNT_ID` galat — dashboard URL se 32-char id copy karo |
| Secret workflow me nahi mil raha | Secrets repo-level pe set hain? (Settings → Secrets and variables → **Actions**) Fork PR pe secrets available nahi hote — by design |
| Deploy job chala par Pages pe nahi dikha | `--branch=main` production hai; dusri branch → preview deployment banti hai |

Token banane ka exact tarika:
```
dash.cloudflare.com → My Profile → API Tokens → Create Token
 → Custom token
 → Permissions: Account | Cloudflare Pages | Edit
 → Account Resources: <your account>
 → Create → token copy → GitHub secret CLOUDFLARE_API_TOKEN
```

---

## 5. Pages Functions (`functions/`) issues

| Symptom | Reason / Fix |
|---|---|
| `The \`assets\` property in your configuration is missing the required \`directory\` property.` | `wrangler.jsonc` me `assets` block hai par `directory` nahi. Fix: `"assets": { "directory": "./dist", "not_found_handling": "single-page-application" }`. (Repo me already set.) |
| `/api/health` 404 deta hai | Functions deploy hi nahi hui. Check: `functions/` repo **root** pe hai (dist ke andar nahi), aur build output dir `dist` set hai. Deploy log me `Uploaded ... Functions` line dhoondho. |
| Static routes Functions se override ho rahe | Pages Functions ka route static file se pehle match hota hai. Hamare functions sirf `/api/*` pe hain, to SPA routes safe hain. Naya function add karo to `_redirects` ke saath conflict mat banao. |
| `env.GEMINI_API_KEY` undefined | Secret set nahi: `npx wrangler pages secret put GEMINI_API_KEY --project-name=pwparent`. Local pe `.dev.vars` chahiye. |
| CORS error browser me | `functions/_middleware.ts` sirf `*.pages.dev`, `localhost` aur `ALLOWED_ORIGIN` allow karta hai. Custom domain pe ho to `ALLOWED_ORIGIN=https://app.yourdomain.com` secret/var me add karo. |
| `firebase-admin` import crash | Workers runtime pe Node admin SDK support nahi. REST API + fetch use karo (docs/FIREBASE.md §8). |
| Function ka bundle fail (`Module not found`) | Functions ko root `node_modules` se resolve karte hain. Naya package chahiye to `dependencies` me add karo (devDependencies me nahi). |

Local pe Functions test:
```bash
cp .dev.vars.example .dev.vars      # GEMINI_API_KEY bharo
npm run pages:dev                   # http://localhost:8788
curl -s localhost:8788/api/health
curl -s -X POST localhost:8788/api/ai -H 'Content-Type: application/json' -d '{"prompt":"hello"}'
```

---

## 6. Security checklist (deploy ke baad)

```bash
# 1. koi secret bundle me to nahi
npm run build && node scripts/check-build-output.mjs     # CI me automatic chalta hai

# 2. Gemini key browser se accessible nahi honi chahiye
curl -s https://<yours>.pages.dev/assets/index-*.js | grep -o "AIza[A-Za-z0-9_-]\{35\}"
#    -> Firebase web key milna OK hai (public by design)
#    -> Gemini/Maps server key mile = TURANT revoke karo

# 3. headers
curl -I https://<yours>.pages.dev | grep -Ei "x-content-type|x-frame|referrer|cache-control"

# 4. SPA fallback
curl -o /dev/null -sw "%{http_code}\n" https://<yours>.pages.dev/any/random/path   # 200
```

Agar secret leak hua ho: key **revoke** karo (Google Cloud console / Firebase),
nayi banao, Pages secret update karo, redeploy karo. Sirf redeploy karne se leak
fix nahi hota — purani deployment ke artifacts me wo key hamesha rahegi.

---

## 7. Useful commands

```bash
npx wrangler pages deployment list --project-name=pwparent     # history
npx wrangler pages secret list --project-name=pwparent         # kaunse secrets hain
npx wrangler pages dev dist                                    # prod-like local
npx wrangler whoami                                            # kaunsa account/token
npm run verify                                                 # full local pipeline
```

Dashboard links:
- Deployments: `dash.cloudflare.com` → Workers & Pages → `pwparent` → Deployments
- Build log: kisi deployment pe click → **Build log** (asli error yahin milta hai)
- Env vars: Settings → Environment variables
- Rules: Settings → Builds & deployments
