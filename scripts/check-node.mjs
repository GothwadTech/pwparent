#!/usr/bin/env node
/**
 * Node version guard — runs before `vite build`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Vite 8 needs Node ^20.19 || >=22.12. On an older Node the build dies with a
 * confusing low-level error (or npm dies during install), and in a Cloudflare
 * Pages log that looks like an opaque "Build failed" with no obvious cause.
 *
 * Cloudflare's build images default to different Node versions:
 *   Build System V2 -> Node 18.17.1   (Vite 8 REJECTS this)
 *   Build System V3 -> Node 22.16.0   (fine)
 * and Cloudflare IGNORES the `engines` field in package.json. It only reads
 * NODE_VERSION, .nvmrc or .node-version — all of which are set to 22 here.
 *
 * So this script turns a mystery failure into one loud, actionable paragraph in
 * the build log.
 */

const MIN_MAJOR = 20;
const MIN_MINOR = 19;

const current = process.versions.node;
const [major, minor] = current.split('.').map(Number);

const tooOld = major < MIN_MAJOR || (major === MIN_MAJOR && minor < MIN_MINOR);

if (!tooOld) {
  console.log(`✔ Node ${current} satisfies the Vite 8 requirement (>= ${MIN_MAJOR}.${MIN_MINOR}).`);
  process.exit(0);
}

const line = '─'.repeat(78);
console.error(`
${line}
✖ BUILD STOPPED — Node.js ${current} is too old for Vite 8.
${line}

Vite 8 requires Node ^${MIN_MAJOR}.${MIN_MINOR}.0 || >=22.12.0.

If this is a Cloudflare Pages build log, fix it in ONE of these ways:

  1. This repo already ships .nvmrc and .node-version containing "22".
     If Pages ignored them, your project is on Build System V2 (default
     Node 18.17.1). Switch it:
       Pages -> <project> -> Settings -> Builds & deployments
             -> Build system version -> V3
     Then retry the build.

  2. Or pin it explicitly with an environment variable. NOTE: Production and
     Preview keep SEPARATE env vars, so add it to BOTH or PR builds stay broken:
       Pages -> <project> -> Settings -> Environment variables
         NODE_VERSION = 22        (Production)
         NODE_VERSION = 22        (Preview)
     Then Deployments -> latest -> Retry deployment.
     (If .nvmrc/.node-version exist, they WIN over NODE_VERSION.)

  3. Local dev: nvm install 22 && nvm use   (reads .nvmrc)

Confirm success by looking for this near the top of the next build log:
  "Using Node.js version 22.x"
and this line from the build step:
  "✔ Node 22.x.x satisfies the Vite 8 requirement"
${line}
`);

process.exit(1);
