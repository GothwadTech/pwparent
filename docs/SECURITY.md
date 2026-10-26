# Security model — and its honest limits

This app is a **pure client-side SPA** deployed to Cloudflare Pages. There is no
application server in the request path. That single fact shapes everything
below, including what this app can and cannot protect against.

Read this before trusting it with real student data.

---

## 1. What is actually enforced

**Firestore security rules** (`firestore.rules`) are the only real security
boundary. They run server-side, on Google's infrastructure, and cannot be
bypassed by editing the JS bundle. Everything else in this document is
convenience or friction.

The rules guarantee:

| Guarantee | How |
|---|---|
| A parent can only read/write their own subtree | `isOwner(uid)` on `parents/{uid}/**` |
| Only an admin can write announcements | `isAdmin()` on `announcements/{id}` |
| Only an admin can issue or change login codes | `isAdmin()` on `credentials/{phone}` writes |
| Nobody can enumerate registered phone numbers | `allow list` on `credentials` is admin-only |
| **Only one admin can ever exist** | `admins/{uid}` create is gated on `!exists(adminConfig/singleton)` |
| The admin slot cannot be reopened from the app | `adminConfig/singleton` is `update, delete: false` |
| An unknown collection is unreadable | Firestore denies any unmatched path |

Deploy them with:

```bash
npx --yes firebase-tools@latest deploy --only firestore:rules
```

Until you do, the default rules apply and **none of the above holds**.

---

## 2. Login codes (the OTP replacement)

No SMS is sent, read, or intercepted at any point. The model is ordinary
username + password:

- the **phone number** is the username — stored as a profile field at
  `parents/{uid}.mobileNumber`, not as a credential
- the **6-digit code** is the password — set per number by the administrator

### Storage

Only a digest is written to Firestore, at `credentials/{phone}`:

```json
{
  "v": 1,
  "salt": "<base64, 16 random bytes>",
  "iterations": 210000,
  "hash": "<base64, PBKDF2-SHA256>",
  "createdAt": "2026-10-26T12:00:00.000Z"
}
```

- **PBKDF2-SHA256, 210 000 iterations** via Web Crypto (`crypto.subtle`),
  implemented in `src/lib/credentials.ts`.
- A **fresh 16-byte random salt per code**, so two identical codes produce
  different hashes and a leaked document cannot be rainbow-tabled across users.
- The **phone number is mixed in as a pepper** — the derived input is
  `"${code}|${phone}"`. A digest copied to another number's document will not
  verify.
- Verification is **constant-time** (XOR-accumulate over the whole hash), so a
  wrong code cannot be detected by timing.
- The plaintext code is **never** written anywhere — not to Firestore, not to
  `localStorage`, not to the console.

### The limitation you must understand

**Verification happens in the browser.** `credentials/{phone}` is `get`-able by
anyone, because there is no server to fetch and check it for us. That means:

1. Anyone who knows a phone number can download its digest and attack it
   offline. With 210 000 PBKDF2 rounds, brute-forcing the full 10⁶ code space
   costs roughly a day on a modern CPU and minutes on a GPU — **friction, not a
   wall**. A 6-digit code is not a strong password.
2. There is no server-side rate limiting. Firestore quotas throttle abuse, but
   that is not a designed defence.

**The proper fix** is to move verification into a Cloudflare Pages Function
(`functions/`) holding a Firebase Admin SDK service account, and then set
`credentials/{phone}` to `allow read, write: if false` in the rules. The
interface in `src/lib/backend/types.ts` is already shaped for that swap — only
`verifyOtp` changes.

Until then, treat login codes as **obfuscation with real friction**, suitable
for a single-operator app, and not as a defence against a determined attacker.

### Why 210 000 and not OWASP's 600 000

600 000 SHA-256 rounds takes ~1 s on a mid-range phone. Login happens on every
session, so that is a visible stall on the exact devices this app targets.
210 000 lands at ~150–300 ms on desktop, which is imperceptible, while still
making an offline attack on 10⁶ candidates impractical for a casual attacker.

---

## 3. The permanent admin

Whoever registers first becomes **the one and only administrator, forever**.

`registerAdmin()` (in `src/lib/adminAuth.ts`) writes two documents in a **single
`writeBatch`**:

- `admins/{uid}` — `{username, role: 'owner', createdAt}`
- `adminConfig/singleton` — `{closedAt, reason}`

A batch is atomic, and `exists()` inside a rule sees **pre-batch** state. So the
`!exists(adminConfig/singleton)` condition that gates creating `admins/{uid}`
passes for that one batch and is false for every request afterwards. The window
closes the instant the first admin exists.

**The password never touches Firestore.** It lives only in Firebase
Authentication (Email/Password provider). The username maps to a synthetic
address, `<username>@admin.pwparent.local` — a local domain that receives no
mail. Firestore stores only the role marker.

### Two operational consequences

1. **Register immediately after your first deploy.** Anyone who reaches the
   panel before you does becomes the admin, and you cannot undo it from the app.
2. **Resetting the admin is a console operation.** Delete the user in Firebase
   console → Authentication → Users, *and* delete `adminConfig/singleton` and
   `admins/{uid}` in Firestore → Data. Both, or the slot stays closed.

`adminConfig/singleton` is world-readable on purpose — the login screen must
know whether registration is open before anyone is authenticated. It therefore
stores **no username** and nothing else sensitive.

---

## 4. Session model

- **Anonymous Auth** gives every visitor a real `uid` — free on the Spark plan,
  and it is what the rules key on.
- `restoreSession()` resumes an existing session **without writing**. Boot must
  use it rather than `signInWithPhone('')`, which would overwrite the stored
  `mobileNumber` with an empty string on every page load.
- `linkWithCredential` upgrades the anonymous session to Email/Password **in
  place**, preserving the uid, so registering as admin does not orphan the data
  created during that visit.
- Signing out clears the read cache (`resetCache()`), so a shared device cannot
  show the next user cached values from the previous one.

---

## 5. The mock-mode passcode is not security

When `VITE_BACKEND_MODE=mock`, there is no Firebase Auth, so the panel falls
back to `VITE_ADMIN_PASSCODE` (default `pw-admin-demo`). That value is
**inlined into the public JS bundle by Vite** and readable by anyone.

Mock mode exists for the test suite and offline development. It holds no real
data and must never be the production configuration.

---

## 6. Firestore read budget

The Spark plan allows **50 000 document reads per day, shared across every
visitor**. `src/lib/backend/readCache.ts` is what keeps this app inside that:

| Mechanism | Effect |
|---|---|
| 60 s TTL per key | Navigating back to a screen costs 0 reads |
| In-flight promise de-duplication | N simultaneous mounts = **1** read (React 19 StrictMode double-invokes effects, so this is not hypothetical) |
| 30 s TTL on `credentials/{phone}` | Short enough that a newly issued code works promptly, long enough to survive a typo-and-retry |
| `cachedWrite` invalidates after every write | No call site can forget; no stale value survives an edit |
| Errors are **never** cached | A transient `permission-denied` does not poison the next 60 s |
| Memory-only, deliberately | `sessionStorage` would show another device's admin edits as stale for the whole session |

The live numbers are in the app: **Settings dock → Firestore reads**, and
**Admin Panel → Data**. Watch `hitRate` after a deploy — if it is low,
something is reading outside the cache.

The service worker deliberately uses `NetworkOnly` for `*.googleapis.com` and
`*.firebaseapp.com`. Caching auth or Firestore responses in the SW would serve
stale data and could cache a credential digest to disk.

---

## 7. Things this app does not do, on purpose

- **No demo or mock data in the production path.** A misconfigured deploy shows
  an explicit setup error naming the missing env vars — it never invents marks
  or attendance. See `backendConfigError` in `src/lib/backend/index.ts`.
- **No fake OS dialogs.** An earlier design proposed a dialog styled like an
  Android system prompt "autofilling your SMS". That is the SMS-stealer
  malware pattern and was removed. The OTP screen states plainly that no SMS is
  sent.
- **No covert self-service grade editing.** Academic records are editable only
  through the admin panel, by the single authenticated administrator, and every
  derived figure is recomputed from raw marks (`recomputeStudent`) so a
  scorecard can never contradict itself.

---

## 8. Checklist before this holds real data

- [ ] Firestore created (region is **unchangeable** after creation — `asia-south1` for India)
- [ ] Authentication → Sign-in method → **Anonymous** enabled
- [ ] Authentication → Sign-in method → **Email/Password** enabled
- [ ] `firestore.rules` deployed (`deploy --only firestore:rules`)
- [ ] `pwparent.pages.dev` added to Authorized domains
- [ ] All 6 `VITE_FIREBASE_*` vars set in Cloudflare Pages (Production **and** Preview)
- [ ] Deployment retried after setting the vars (Vite inlines env at build time)
- [ ] **You** registered the admin account before anyone else could
- [ ] Login code issued for your own number, then verified end-to-end
