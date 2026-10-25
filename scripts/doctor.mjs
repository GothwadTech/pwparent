#!/usr/bin/env node
/**
 * Pre-flight doctor — deploy se pehle local pe sab verify kar leta hai.
 *
 *   npm run doctor
 *
 * Checks the things that silently break a Cloudflare Pages deployment:
 * missing lockfile, wrong Node, un-ignored .env with real secrets, missing
 * _redirects, unparseable wrangler.jsonc, uncommitted config drift.
 */
import {execSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let errors = 0;
let warnings = 0;

const ok = (msg) => console.log(`  \u001b[32m✔\u001b[0m ${msg}`);
const warn = (msg) => {
  warnings++;
  console.log(`  \u001b[33m⚠\u001b[0m ${msg}`);
};
const bad = (msg) => {
  errors++;
  console.log(`  \u001b[31m✖\u001b[0m ${msg}`);
};
const section = (t) => console.log(`\n\u001b[1m${t}\u001b[0m`);

const read = (p) => {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return null;
  }
};
const git = (args) => {
  try {
    return execSync(`git ${args} 2>/dev/null`, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
  } catch {
    return '';
  }
};

console.log('\u001b[1mPW Parent\u0027s App — Cloudflare Pages pre-flight\u001b[0m');

// ---------------------------------------------------------------- runtime ----
section('Runtime');
const nodeMajor = Number(process.versions.node.split('.')[0]);
const nodeMinor = Number(process.versions.node.split('.')[1]);
if (nodeMajor > 20 || (nodeMajor === 20 && nodeMinor >= 19)) {
  ok(`Node ${process.versions.node} (Vite 8 needs >= 20.19)`);
} else {
  bad(`Node ${process.versions.node} is too old for Vite 8. Use Node 20.19+ / 22, and set NODE_VERSION=22 on Pages.`);
}
const nvmrc = (read('.nvmrc') ?? '').trim();
const nodeVersion = (read('.node-version') ?? '').trim();
if (nvmrc || nodeVersion) {
  const pinned = nvmrc || nodeVersion;
  const pinnedMajor = Number(pinned.split('.')[0]);
  if (pinnedMajor >= 20) {
    ok(`.nvmrc/.node-version pins Node ${pinned} — Cloudflare Pages reads these (its V2 image defaults to Node 18.17.1, which Vite 8 rejects)`);
  } else {
    bad(`.nvmrc pins Node ${pinned}, too old for Vite 8 (needs >= 20.19). Use 22.`);
  }
  if (nvmrc && nodeVersion && nvmrc !== nodeVersion) {
    warn(`.nvmrc (${nvmrc}) and .node-version (${nodeVersion}) disagree — keep them identical.`);
  }
} else {
  bad('No .nvmrc / .node-version. Cloudflare Pages ignores package.json `engines`, so without one of these (or NODE_VERSION env var in BOTH Production and Preview) the V2 build image uses Node 18 and the build fails.');
}
warn('Pages build image: Settings -> Builds & deployments -> Build system version = V3 if available.');

// ------------------------------------------------------------- git hygiene ---
section('Git hygiene');
const lockfile = read('package-lock.json');
if (lockfile) {
  const parsed = JSON.parse(lockfile);
  ok(`package-lock.json present (lockfileVersion ${parsed.lockfileVersion}, ${Object.keys(parsed.packages ?? {}).length} packages)`);
  if (git('ls-files --error-unmatch package-lock.json') === '') {
    bad('package-lock.json is NOT committed — Cloudflare will run `npm install` and can hit ERESOLVE. Commit it.');
  } else {
    ok('package-lock.json is tracked by git (Pages will use `npm ci`)');
  }
} else {
  bad('package-lock.json missing. Run `npm install` and commit it.');
}

const tracked = git('ls-files').split('\n').filter(Boolean);
const trackedEnv = tracked.filter((f) => /^\.env(\..+)?$/.test(f) && !f.endsWith('.example'));
if (trackedEnv.length) {
  bad(`Secret-looking env files are committed: ${trackedEnv.join(', ')}. Remove them: git rm --cached ${trackedEnv.join(' ')}`);
} else {
  ok('No real .env files tracked');
}
if (tracked.includes('.dev.vars')) bad('.dev.vars is committed — it holds local secrets.');
else ok('.dev.vars not tracked');

const ignoredDist = git('check-ignore dist') !== '';
if (ignoredDist) ok('dist/ is git-ignored (Cloudflare builds it fresh)');
else warn('dist/ is not ignored — make sure you are not committing build output.');

const drift = git('status --porcelain').split('\n').filter((l) => /^( M|M |\?\?)/.test(l) && /package(-lock)?\.json|wrangler|_redirects|_headers|\.github|vite\.config/.test(l));
if (drift.length) warn(`Uncommitted deploy config changes:\n      ${drift.join('\n      ')}`);
else ok('No uncommitted changes to deploy config');

// ------------------------------------------------------------- app config ----
section('App config');
const pkg = JSON.parse(read('package.json') ?? '{}');
/**
 * The build script must (a) end with `vite build` and (b) run the Node guard
 * first. Anything else means Cloudflare's `npm run build` will not produce dist/.
 */
const buildScript = pkg.scripts?.build ?? '';
if (/vite build\s*$/.test(buildScript)) ok(`build script ends with \`vite build\` (${buildScript})`);
else bad(`build script does not end with \`vite build\`: ${buildScript}`);
if (pkg.dependencies?.firebase) ok(`firebase ${pkg.dependencies.firebase} present (backend scaffold ready)`);
else warn('firebase dependency missing — docs/FIREBASE.md assumes it is installed.');
if (pkg.dependencies?.esbuild || pkg.devDependencies?.esbuild) {
  bad('esbuild is pinned in package.json — this conflicts with Vite 8 peer deps and breaks `npm ci` on Pages. Remove it.');
} else ok('No standalone esbuild pin (was the original ERESOLVE cause)');

// wrangler drags in workerd (~135 MB) and miniflare -> sharp (~28 MB) native
// binaries that `vite build` never needs. They are a classic CI/build-image
// failure source, so wrangler is invoked via `npx wrangler@4` instead.
if (pkg.dependencies?.wrangler || pkg.devDependencies?.wrangler) {
  bad('wrangler is a dependency — it installs ~200 MB of native binaries (workerd, sharp) that the build never uses and that break on some build images. Remove it and use `npx wrangler@4` in scripts.');
} else ok('No wrangler dependency (scripts use `npx wrangler@4` — keeps node_modules ~200 MB lighter)');

// 2) the Node guard must stay wired into `build`, else an old build image
//    fails with an opaque Vite error instead of an actionable message.
if (/check-node\.mjs/.test(pkg.scripts?.build ?? '')) {
  ok('build script runs the Node guard (old build images fail loudly, not mysteriously)');
} else {
  bad('build script lost `node scripts/check-node.mjs`. Without it a Node 18 build image (Cloudflare Build System V2 default) fails with a confusing Vite error.');
}
if (!existsSync(path.join(root, 'scripts/check-node.mjs'))) bad('scripts/check-node.mjs is missing but referenced by the build script.');

// ------------------------------------------------------------ pages assets ---
section('Cloudflare Pages assets');
for (const f of ['public/_redirects', 'public/_headers']) {
  if (existsSync(path.join(root, f))) ok(`${f} present`);
  else bad(`${f} missing — SPA routing / headers will not work.`);
}
const redirects = read('public/_redirects') ?? '';
if (/^\s*\/\*\s+\/(index\.html|200\.html)?\s*200/m.test(redirects)) {
  bad('_redirects contains a `/* -> 200` SPA catch-all. Cloudflare flags it as an infinite loop (code 100324) and it is redundant: Pages serves index.html for unmatched paths automatically when no 404.html exists.');
} else {
  ok('_redirects has no SPA catch-all (Pages native SPA detection covers deep links)');
}

// A 404.html switches Pages OUT of SPA mode -> every deep link would 404.
const notFoundFiles = ['public/404.html', 'dist/404.html', 'public/200.html'];
const present404 = notFoundFiles.filter((f) => existsSync(path.join(root, f)));
if (present404.length) {
  bad(`Found ${present404.join(', ')} — its presence makes Pages stop treating the app as an SPA, so deep links like /dashboard would 404. Remove it.`);
} else {
  ok('No 404.html/200.html — Pages stays in SPA mode (deep links return index.html)');
}

const wrangler = read('wrangler.jsonc');
if (!wrangler) {
  warn('wrangler.jsonc missing — `wrangler pages deploy` will need explicit flags.');
} else {
  // JSONC: strip /* */ blocks and // or # line comments before JSON.parse.
  const stripped = wrangler
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*(\/\/|#).*$/gm, '')
    .replace(/,\s*([}\]])/g, '$1');
  try {
    const cfg = JSON.parse(stripped);

    // THE root cause of the original Cloudflare build failure. Pages validates
    // this file BEFORE npm install, so nothing else in the repo can recover.
    if ('assets' in cfg) {
      bad('wrangler.jsonc contains an `assets` block. Classic Cloudflare Pages rejects it and the build dies before installing anything: "Configuration file for Pages projects does not support \\"assets\\"". Remove it — SPA fallback comes from Pages itself (no 404.html).');
    } else {
      ok('wrangler.jsonc has no `assets` block (Pages rejects that key — was the real build failure)');
    }

    if (cfg.pages_build_output_dir) ok(`pages_build_output_dir = "${cfg.pages_build_output_dir}"`);
    else bad('wrangler.jsonc has no `pages_build_output_dir` — Cloudflare will not treat this as a Pages project.');
  } catch (e) {
    bad(`wrangler.jsonc does not parse: ${e.message}`);
  }
}

const workflows = existsSync(path.join(root, '.github/workflows'))
  ? readdirSync(path.join(root, '.github/workflows')).filter((f) => f.endsWith('.yml'))
  : [];
if (workflows.includes('ci.yml')) ok('CI workflow present (.github/workflows/ci.yml)');
else warn('ci.yml missing — PRs will not be tested.');
if (workflows.includes('deploy-cloudflare-pages.yml')) {
  ok('Wrangler deploy workflow present (Option B)');
  warn('If you use the Cloudflare Git integration (Option A), delete deploy-cloudflare-pages.yml to avoid double deploys.');
}

// ------------------------------------------------------------------- dist ----
section('Build output');
if (existsSync(path.join(root, 'dist/index.html'))) {
  ok('dist/index.html exists (stale? run `npm run build` again)');
} else {
  warn('dist/ not built yet — run `npm run build` (or `npm run verify`).');
}

// ------------------------------------------------------------------ result ---
console.log('');
if (errors) {
  console.log(`\u001b[31m✖ doctor found ${errors} problem(s) and ${warnings} warning(s). Fix the ✖ before deploying.\u001b[0m\n`);
  process.exit(1);
}
console.log(`\u001b[32m✔ doctor passed\u001b[0m (${warnings} warning(s)). Safe to deploy: npm run pages:deploy\n`);
