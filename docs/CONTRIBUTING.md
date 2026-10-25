# Contributing

Chhota sa guide taaki har PR deploy-safe rahe.

## Dev loop

```bash
npm ci
cp .env.example .env.local     # optional (mock mode bina env ke chalta hai)
npm run dev                    # http://localhost:3000
npm run test:watch             # side terminal me
```

## PR bhejne se pehle

```bash
npm run verify     # typecheck + test + build + dist validation
npm run doctor     # deploy pre-flight (lockfile, Node, configs, git hygiene)
```

Dono green hone chahiye. CI wahi cheezein chalata hai, to local green = CI green.

## Rules

1. **`package-lock.json` hamesha commit karo.** Naya dependency add kiya →
   `npm install` local pe → lockfile commit. Cloudflare Pages `npm ci` chalata
   hai; lockfile out-of-sync hua to build fail.
2. **`npm install --force` / `--legacy-peer-deps` mat use karo.** Ye error
   chhupata hai, fix nahi karta. (Is repo ka original deploy failure isi wajah
   se tha — `esbuild` pin Vite 8 ke peer dep se conflict kar raha tha.)
3. **Client env vars `VITE_` prefix ke saath.** Bina prefix wala variable
   browser tak nahi pahunchta. Naya var add karo to:
   - `src/vite-env.d.ts` me type
   - `src/lib/config.ts` me read + default + validation
   - `.env.example` me entry (placeholder `MY_*` rakhna — code usko "not set" maanta hai)
   - `docs/ENVIRONMENT.md` me table row
4. **Secret kabhi `VITE_` prefix ke saath nahi.** `GEMINI_API_KEY` jaisi cheezein
   `wrangler pages secret put` se, local pe `.dev.vars` se. CI bundle scan karta
   hai — leak pe build fail hoga.
5. **UI hamesha `src/lib/backend` facade se data le**, `firebase/*` se directly
   nahi. Isse mock mode me app chalti rehti hai aur tests bina network ke pass
   hote hain.
6. **`public/_redirects` me `/*  /index.html  200` mat daalo** — Cloudflare usko
   infinite loop bol ke ignore karta hai. SPA fallback `wrangler.jsonc` ke
   `assets.not_found_handling` se aata hai. `check:build` is rule ko fail karta hai.
7. **Naya component** = `src/components/`, domain types `src/types.ts` me.
8. **Tests** — naye lib/logic pe test zaroori. Vitest + happy-dom + Testing
   Library already set hai (`src/tests/`). jsdom mat lao (npm 10 pe optional
   `canvas` peer se install crash hota tha).

## Commit / branch

- Branch: `feat/...`, `fix/...`, `docs/...`
- Har PR pe Cloudflare **preview deployment** banti hai (`<hash>.pwparent.pages.dev`)
  — merge se pehle usko dekh lo.
- `main` = production (`pwparent.pages.dev`).

## Naya Pages Function add karna

```
functions/api/<name>.ts      ->  /api/<name>
export async function onRequestGet(ctx) { ... }
export async function onRequestPost(ctx) { ... }
```

- Types: `{ request, env, params, waitUntil }` — `env` me Pages secrets/vars.
- Naya npm package chahiye to **`dependencies`** me daalo (devDependencies me
  nahi) — Functions root `node_modules` se resolve karte hain.
- `firebase-admin` Workers runtime pe nahi chalta → REST API + `fetch` use karo
  (`docs/FIREBASE.md` §8).
- Local test: `npm run pages:dev` → `curl localhost:8788/api/<name>`.
- `/api/*` ke alawa koi route mat pakdo, warna SPA/static assets se conflict hoga.

## Troubleshooting

Kuch bhi fail ho → [`docs/DEPLOYMENT_TROUBLESHOOTING.md`](./DEPLOYMENT_TROUBLESHOOTING.md)
(error-by-error, exact log lines ke saath).
