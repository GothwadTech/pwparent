#!/usr/bin/env node
/**
 * Post-build sanity checks. Runs in CI right after `vite build` and locally via
 *   npm run check:build
 *
 * Catches the failure modes that actually break a Cloudflare Pages deploy:
 *   1. dist/ missing or empty (wrong build output dir in the dashboard)
 *   2. index.html without #root / without the module script
 *   3. JS or CSS assets missing
 *   4. Pages config files (_redirects / _headers) not copied into dist/
 *   5. Secrets or unreplaced env placeholders baked into the bundle
 *   6. Absurd bundle size (accidental debug/sourcemap build)
 */
import {readdirSync, readFileSync, statSync, existsSync} from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const errors = [];
const warnings = [];

const read = (p) => {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return null;
  }
};

function fail(msg) {
  errors.push(msg);
}

console.log('▶ check:build — validating dist/ for Cloudflare Pages');

if (!existsSync(dist) || !statSync(dist).isDirectory()) {
  fail('dist/ does not exist. Run `npm run build` first (Cloudflare build output dir must be `dist`).');
} else {
  const htmlPath = path.join(dist, 'index.html');
  const html = read(htmlPath);
  if (!html) {
    fail('dist/index.html is missing — Pages would serve nothing.');
  } else {
    if (!html.includes('id="root"')) fail('dist/index.html has no #root element.');
    if (!/type="module"/.test(html)) fail('dist/index.html has no module script tag.');
    if (html.includes('import.meta.env')) fail('dist/index.html still contains a raw `import.meta.env` reference.');
    console.log(`  ✔ index.html (${(html.length / 1024).toFixed(2)} kB)`);
  }

  const assetsDir = path.join(dist, 'assets');
  if (!existsSync(assetsDir)) {
    fail('dist/assets/ is missing — CSS/JS were not emitted.');
  } else {
    const assets = readdirSync(assetsDir);
    const js = assets.filter((f) => f.endsWith('.js'));
    const css = assets.filter((f) => f.endsWith('.css'));
    if (!js.length) fail('No .js file in dist/assets/.');
    if (!css.length) fail('No .css file in dist/assets/ (Tailwind not emitted?).');

    const jsBytes = js.reduce((sum, f) => sum + statSync(path.join(assetsDir, f)).size, 0);
    const MAX_JS = 3 * 1024 * 1024; // 3 MB
    if (jsBytes > MAX_JS) {
      warnings.push(`JS bundle is ${(jsBytes / 1024 / 1024).toFixed(2)} MB — consider code splitting.`);
    }
    console.log(`  ✔ assets: ${js.length} js (${(jsBytes / 1024).toFixed(1)} kB), ${css.length} css`);

    // --- secret / placeholder leak scan -----------------------------------
    /** @type {[RegExp, string, 'fail' | 'warn'][]} */
    const leakPatterns = [
      [/import\.meta\.env/, 'unreplaced `import.meta.env` (build did not inline env vars)', 'fail'],
      [/import\.meta\.env\.VITE_FIREBASE_API_KEY/, 'unreplaced env lookup left in the bundle', 'fail'],
      [/MY_FIREBASE_|MY_GEMINI_API_KEY|MY_APP_URL/, 'a placeholder value from .env.example shipped to production', 'fail'],
      [/GEMINI_API_KEY\s*[=:]\s*["'][A-Za-z0-9_\-]{16,}/, 'a Gemini API key looks hardcoded', 'fail'],
      [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key is embedded in the bundle', 'fail'],
      [/\bsk-[A-Za-z0-9_\-]{24,}/, 'an `sk-` style secret token is embedded in the bundle', 'fail'],
      [
        /AIza[0-9A-Za-z_\-]{35}/,
        'Found an `AIza...` key in the bundle. If this is your Firebase web API key that is expected and safe; ' +
          'if it is a Gemini/Maps server key, remove it and use functions/api/ai.ts + `wrangler pages secret`.',
        'warn',
      ],
    ];
    const bundle = [...js, ...css].map((f) => read(path.join(assetsDir, f)) ?? '').join('\n');
    for (const [pattern, label, level] of leakPatterns) {
      if (pattern.test(bundle)) {
        if (level === 'warn') warnings.push(label);
        else fail(`Secret/env leak: ${label}`);
      }
    }
    console.log('  ✔ secret scan finished');
  }

  // --- Cloudflare Pages config files --------------------------------------
  for (const file of ['_redirects', '_headers']) {
    if (!existsSync(path.join(dist, file))) {
      warnings.push(`dist/${file} is missing (public/${file} not copied?). SPA deep links may 404.`);
    } else {
      console.log(`  ✔ ${file} present`);
    }
  }

  const redirects = read(path.join(dist, '_redirects'));
  if (redirects && /^\s*\/\*\s+\/index\.html\s+200/m.test(redirects)) {
    fail(
      'dist/_redirects contains `/*  /index.html  200`. Cloudflare rejects that rule as an ' +
        'infinite loop when html_handling is auto-trailing-slash, so the SPA fallback silently dies. ' +
        'Deep links are handled by wrangler.jsonc -> assets.not_found_handling = "single-page-application".',
    );
  }
}

if (warnings.length) {
  console.log('\n⚠ warnings:');
  for (const w of warnings) console.log(`   - ${w}`);
}

if (errors.length) {
  console.error('\n✖ check:build FAILED:');
  for (const e of errors) console.error(`   - ${e}`);
  process.exit(1);
}

console.log('\n✔ check:build passed — dist/ looks deployable to Cloudflare Pages.');
