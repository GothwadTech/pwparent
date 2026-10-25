# Environment Variables — Complete Reference

Is app me **do tarah** ke variables hain. Dono ko mix karna sabse common galti hai.

| Type | Prefix | Kahan set hota hai | Browser me jata hai? |
|---|---|---|---|
| **Client config** | `VITE_` | Pages env vars / `.env.local` — **build time** pe inline | ✅ Haan (public) |
| **Server secret** | *(koi prefix nahi)* | `npx wrangler@4 pages secret put` / `.dev.vars` — **runtime** | ❌ Nahi (safe) |

> Rule of thumb: agar value leak hone se nuksaan hai → wo secret hai → `VITE_`
> prefix mat lagao, Pages secret banao.

---

## 1. Precedence (kaun jeet-ta hai)

### Local dev (`npm run dev`)
Vite `.env` files padhta hai, project root se:

```
.env                     # sab modes ke liye
.env.local               # sab modes, git-ignored  ← yahan apni values rakho
.env.production          # sirf production build
.env.production.local    # sirf production build, git-ignored
```

Baad wala pehle wale ko override karta hai. `.env.example` sirf template hai —
Vite usko **nahi** padhta.

### Cloudflare Pages build
Pages dashboard ke env vars build container ke `process.env` me inject hote hain
**aur** ek `.env.production` file generate karte hain. Practical result:

```
Pages dashboard env var   >   .env.production.local   >   .env.production   >   .env.local   >   .env
```

Isliye repo me `.env.production` commit karne ki zaroorat nahi — dashboard wale
values jeet-te hain. (Aur `.gitignore` ne `.env*` already block kiya hua hai,
sirf `*.example` allowed hain.)

### Pages Functions (`functions/**`)
Runtime pe `env` object se milte hain — build time se koi lena-dena nahi:

```ts
export async function onRequestPost({ env }: { env: { GEMINI_API_KEY?: string } }) {
  // env.GEMINI_API_KEY  ← Pages secret / dashboard "Encrypt" / .dev.vars (local)
}
```

---

## 2. Client variables (`VITE_*`)

Source of truth: `src/lib/config.ts` (+ types `src/vite-env.d.ts`).

| Variable | Default | Required | Notes |
|---|---|---|---|
| `VITE_APP_ENV` | `development` / `production` (mode se) | nahi | `development` \| `staging` \| `production` |
| `VITE_APP_URL` | `window.location.origin` | nahi | Self links, callbacks, share URLs |
| `VITE_APP_VERSION` | `1.0.0` | nahi | UI me version badge |
| `VITE_BACKEND_MODE` | `mock` | **haan (intent ke liye)** | `mock` \| `firebase`. `firebase` tabhi effective jab saare 6 Firebase vars set hon. |
| `VITE_FIREBASE_API_KEY` | – | firebase ke liye | Firebase console → Project settings → Your apps → SDK setup |
| `VITE_FIREBASE_AUTH_DOMAIN` | – | firebase ke liye | `yourproj.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | – | firebase ke liye | |
| `VITE_FIREBASE_STORAGE_BUCKET` | – | firebase ke liye | `yourproj.firebasestorage.app` (naye projects) ya `.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | – | firebase ke liye | numeric |
| `VITE_FIREBASE_APP_ID` | – | firebase ke liye | `1:<sender>:web:<hash>` |
| `VITE_FIREBASE_MEASUREMENT_ID` | – | nahi | `G-XXXXXXXXXX`, sirf Analytics |
| `VITE_FIREBASE_DATABASE_URL` | – | nahi | Sirf Realtime Database use karo to |
| `VITE_RECAPTCHA_SITE_KEY` | – | nahi | Phone auth ka reCAPTCHA (App Check / Enterprise) |

### Fallback naming
`src/lib/config.ts` pehle `VITE_<NAME>` padhta hai, na mile to `<NAME>`:

```
VITE_FIREBASE_PROJECT_ID   →  FIREBASE_PROJECT_ID
VITE_BACKEND_MODE          →  BACKEND_MODE
```

Matlab Firebase console ka snippet bina rename kiye paste kar sakte ho:

```bash
VITE_FIREBASE_API_KEY="AIza..."          # explicit (preferred)
FIREBASE_API_KEY="AIza..."               # bhi chalega
```

### Placeholder safety
`MY_` se shuru hone wali values (`MY_FIREBASE_API_KEY`, `MY_APP_URL`, …) ko code
**"not set"** maanta hai, aur `""` / `"undefined"` / `"null"` bhi. Isse `.env.example`
galti se production me chala jaye to app crash nahi hoti — mock mode pe chali jati hai.

---

## 3. Server secrets (no prefix)

| Secret | Used by | Local dev me |
|---|---|---|
| `GEMINI_API_KEY` | `functions/api/ai.ts` | `.dev.vars` |
| `GEMINI_MODEL` | `functions/api/ai.ts` (default `gemini-2.5-flash`) | `.dev.vars` |
| `ALLOWED_ORIGIN` | `functions/_middleware.ts` + `/api/ai` CORS | `.dev.vars` |

Set karna:

```bash
# production / preview (encrypted, dashboard me bhi dikhega as secret)
npx wrangler@4 pages secret put GEMINI_API_KEY --project-name=pwparent

# local (npm run pages:dev)
cp .dev.vars.example .dev.vars    # git-ignored
```

Dashboard se: **Settings → Environment variables → Add variable → Encrypt**.
Secret **Production** aur **Preview** dono environments ke liye alag-alag add
karna padta hai.

### Firebase Admin SDK ka secret
Agar kabhi server-side admin access chahiye (email bhejna, user delete karna),
to service-account JSON ko **ek secret** ki tarah store karo, aur Pages Functions
me se Firebase **REST API** (`fetch`) call karo — `firebase-admin` Node SDK
Workers runtime pe directly support nahi hota. Details: `docs/FIREBASE.md` §8.

---

## 4. Build/runtime vars (Cloudflare specific)

| Variable | Value | Kyun |
|---|---|---|
| `NODE_VERSION` | `22` | **Sirf agar repo me `.nvmrc`/`.node-version` na ho.** Vite 8 ko Node ≥ 20.19 chahiye; Pages Build System **V2** ka default **18.17.1** hai (V3 = 22.16.0). Cloudflare `package.json` ka `engines` ignore karta hai. File aur env var dono ho to **file jeet-ti hai**. Production aur Preview me alag-alag add karna padta hai. |
| `NPM_FLAGS` | *(empty)* | Lockfile committed hai → `npm ci` deterministic. `--legacy-peer-deps` ki zaroorat nahi. |
| `NODE_OPTIONS` | `--max-old-space-size=4096` | Sirf OOM aaye to. |
| `DISABLE_HMR` | *(local only)* | AI Studio artifact — `vite.config.ts` isko padhta hai. Pages pe set mat karo. |

---

## 5. Copy-paste ready sets

### Cloudflare Pages — Production (mock/demo mode)
```
NODE_VERSION=22
VITE_APP_ENV=production
VITE_APP_URL=https://pwparent.pages.dev
VITE_APP_VERSION=1.0.0
VITE_BACKEND_MODE=mock
```

### Cloudflare Pages — Production (Firebase live)
```
NODE_VERSION=22
VITE_APP_ENV=production
VITE_APP_URL=https://pwparent.pages.dev
VITE_APP_VERSION=1.0.0
VITE_BACKEND_MODE=firebase
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=pwparent.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pwparent
VITE_FIREBASE_STORAGE_BUCKET=pwparent.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:000000000000
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```
Plus secret: `GEMINI_API_KEY` (encrypted).

### `.env.local` (laptop)
```bash
cp .env.example .env.local
# VITE_BACKEND_MODE=mock rehne do — bina Firebase ke app poori chalti hai
```

---

## 6. Env add karne ke baad

**Deployment dobara run karni padti hai.** Vite env ko build time pe inline karta
hai, isliye purani deployment me nayi values kabhi nahi aayengi:

> Pages → Deployments → latest → **⋯ → Retry deployment**

Verify:

```bash
# bundle me value inline hui ya nahi
curl -s https://pwparent.pages.dev/assets/index-*.js | grep -o "pwparent.firebaseapp.com" | head -1
```

Aur browser console me app khud bata deta hai:
`[config] Running in MOCK mode. Set these to enable Firebase: ...`
