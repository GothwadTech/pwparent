# Admin Panel

Ek hi administrator. Username + password. Firebase mode me real authentication,
mock mode me local passcode.

> **Security ki poori tasveer** — login codes, PBKDF2, permanent admin, read
> budget — [`docs/SECURITY.md`](./SECURITY.md) me hai. Ye file sirf *use* karna
> sikhata hai.

---

## 1. Kaise kholein

Do raste, dono hamesha available:

| Rasta | Kahan |
|---|---|
| **Settings dock** | Bottom-right corner ka chhota pill (`🟢 firebase` / `🟡 mock`) → **Admin Panel** |
| **URL hash** | `https://pwparent.pages.dev/#admin` |

Settings dock ne purana `DEMO` badge replace kiya hai. Wo ab live backend mode
bhi dikhata hai aur wahi entry point hai "doosre number se login" ka.

---

## 2. Login — mode ke hisaab se alag

### Firebase mode (production)

**Username + password.** Pehli baar kholne par form *registration* dikhata hai;
uske baad hamesha sirf *login*.

```
Username  3-30 chars: a-z 0-9 . - _
Password  min 8 chars, ek letter + ek digit zaroori
```

Password **Firebase Authentication** me rehta hai (Email/Password provider).
Firestore me sirf role marker `admins/{uid}` hai — password ka koi trace nahi,
hash bhi nahi. Username ek synthetic address ban jata hai:
`<username>@admin.pwparent.local` (local domain, koi mail nahi jaata).

> ### ⚠️ Jo pehle register karega, wahi admin banega — hamesha ke liye
>
> Ye feature hai, bug nahi. `admins/{uid}` create hone ki ijazat sirf tab hai
> jab `adminConfig/singleton` exist nahi karta, aur registration dono documents
> ek hi atomic batch me likhti hai. Pehla admin bante hi window band.
>
> **Deploy ke turant baad khud register karo.** Warna koi aur ban jayega aur app
> se undo nahi hoga.
>
> Reset karna ho to console se: Firebase → Authentication → Users me user
> delete karo **aur** Firestore me `adminConfig/singleton` + `admins/{uid}`
> delete karo. Dono, warna slot band hi rahega.

**Zaroori:** Authentication → Sign-in method me **Anonymous** aur
**Email/Password** dono enabled hon. Anonymous isliye zaroori hai kyunki
registration anonymous session ko `linkWithCredential` se upgrade karti hai —
uid wahi rehta hai, us visit me bana data orphan nahi hota.

### Mock mode (dev + tests)

Firebase nahi hai, isliye Email/Password provider bhi nahi. Panel
`VITE_ADMIN_PASSCODE` (default `pw-admin-demo`) maangta hai.

> Ye passcode Vite se **public JS bundle me inline** ho jata hai. Koi bhi padh
> sakta hai. Mock mode me real data hota hi nahi, isliye ye sirf UI friction
> hai — security nahi.

---

## 3. Tabs

### Students — academic record

Har student ka card expand hota hai. Editable:

- name, batch, course
- attendance %, video watch %
- DPPs done, total tests
- **test records** — title, date, mode (Online/Offline), status
  (Attempted/Missed), marks obtained, marks total, accuracy %

Har save par `recomputeStudent()` (`src/lib/admin.ts`) derived figures dobara
calculate karta hai.

### Login codes — OTP ka replacement ⭐

Ye naya tab hai aur sabse zaroori.

**Koi SMS nahi jaata.** Admin ek number ke liye fixed 6-digit code set karta
hai — number username hai, code password.

1. Phone number daalo (10 digits)
2. Code daalo, ya 🔄 se random generate karo
3. **Save code** — hashing me ek second lagta hai, jaan-boojh kar (210 000
   PBKDF2 rounds)

Neeche registered numbers ki list hai: number + kab bana. **Code kabhi nahi
dikhta** — list me sirf metadata aata hai.

- **Replace** → number + naya random code pre-fill kar deta hai; Save dabao
- 🗑️ → us number ka code delete (wo number phir login nahi kar sakta)

Firestore me sirf digest jaata hai:

```json
{"v":1,"salt":"…","iterations":210000,"hash":"…","createdAt":"…"}
```

Fresh 16-byte salt per code, phone number pepper ki tarah mix, constant-time
verify. Details [`SECURITY.md §2`](./SECURITY.md).

> **Pehla kaam ye karo:** apne number ka code issue karo, phir login karke
> dekho. Jab tak koi code exist nahi karta, **koi login nahi kar sakta** — ye
> intentional hai, peeche koi demo data nahi hai.

### Announcements

Shared feed. `announcements/{id}` — har signed-in visitor padh sakta hai, sirf
admin likh sakta hai. Author, content, time label, video link.

Yahan write fail ho to matlab `admins/{uid}` document missing hai — rules me
`isAdmin()` wahi check karta hai.

### Data — diagnostics

- **Session**: mode, admin username, uid, students/announcements count
- **Firestore reads**: network reads, cache hits, hit rate, cached keys

  Spark plan = **50 000 reads/din, sab visitors me banta hua**. Ye counter
  isliye hai ki read cache ka asar assume na karo, dekho. Deploy ke baad
  `hitRate` check karo — kam ho to koi cheez cache ke bahar padh rahi hai.
- **Clear read cache** — sirf cached reads, stored data safe
- **Delete all local data** — mock mode only, destructive, alag button jaan
  boojh kar
- **Sign out of admin account** — firebase mode me

---

## 4. Derived fields — direct edit nahi hote

`testsCompleted`, `avgScorePercent`, `accuracyPercent`, aur har test ka
`scorePercent` **type nahi kiye ja sakte**. `recomputeStudent()` inhe raw marks
se banata hai.

Iska matlab scorecard kabhi khud se contradict nahi kar sakta: agar 3 tests
attempted hain to counter 3 hi dikhega, aur average unhi 3 ke marks se aayega.

⚠️ **Ordering matter karti hai.** `recomputeStudent()` pehle `tests[]` ko
enrich karta hai (raw marks → `scorePercent`), *phir* average leta hai —
kyunki `averageScore()` sirf un tests ko ginta hai jinka `scorePercent` number
hai. Ulti order me average hamesha `0` aayega. Ye bug already fix hai; wapas
mat badalna.

---

## 5. Persistence

| Mode | Kahan | Reload ke baad |
|---|---|---|
| **firebase** | Firestore: `parents/{uid}`, `…/children/{id}`, `…/purchases/{id}`, `announcements/{id}`, `credentials/{phone}` | Sab rehta hai |
| **mock** | Is browser ka `localStorage` (`src/lib/backend/demoStore.ts`) | Rehta hai, sirf isi browser me |

**Firebase mode me koi demo dataset nahi hai.** Pehli baar app khaali khulegi
jab tak admin code issue na kare. Ye design decision hai: nakli marks dikhane
se behtar hai saaf "not configured" dikhana.

---

## 6. Kahan dikhta hai (aur kahan abhi nahi)

### ✅ Wired — admin ke edits turant render hote hain

`ChildDashboardScreen`, `StudentDashboardView` (tests), `AnnouncementsView`,
`PurchasesScreen`, `LinkedAccountsScreen`, `ProfileScreen`,
`ParentProfileScreen`

### ⚠️ Abhi bhi hardcoded (jaan-boojh kar)

`OfflineAttendanceDashboardView` (day calendar + ring %), `SubjectDetailsModal`
(subject-wise lecture/DPP counts), `StudentDashboardView` ka lectures section,
`ChildDashboardScreen.batchOptions`

Pattern fix karne ka: optional `items?` prop with built-in default — jaise
baaki screens me already hai. 38 components ko ek saath refactor karna risky
tha.

---

## 7. Files

```
src/components/admin/
  AdminPanelScreen.tsx   shell — gate + tabs (160 lines)
  AdminGate.tsx          username+password / passcode (273)
  StudentsTab.tsx        academic record + test marks (285)
  LoginCodesTab.tsx      per-phone 6-digit codes
  AnnouncementsTab.tsx   shared feed
  DataTab.tsx            session, read budget, cache
  ui.tsx                 shared primitives

src/lib/
  adminAuth.ts           registerAdmin / loginAdmin / currentAdmin
  credentials.ts         PBKDF2 hashing + verification
  admin.ts               passcode gate (mock), recomputeStudent, math helpers
  backend/readCache.ts   TTL + de-dupe + stats
```

Koi bhi file 500 lines cross nahi karti — ye repo me ek hard rule hai.

---

## 8. Tests

```bash
npm test                                    # 74 tests
npx vitest run src/tests/backend-session.spec.ts   # login codes, restore, cache
npx vitest run src/tests/credentials.spec.ts       # PBKDF2 round trip
npx vitest run src/tests/admin.spec.ts             # recomputeStudent
```

Tests mock mode me chalte hain (`vitest.config.ts` → `env.VITE_BACKEND_MODE=mock`),
taaki ek developer ka `.env.local` suite ko firebase mode me na phenk de.
