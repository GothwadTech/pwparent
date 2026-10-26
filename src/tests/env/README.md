# Intentionally empty — do not add .env files here.

`vitest.config.ts` points Vite's `envDir` at this directory so that test runs
never pick up a developer's local `.env` / `.env.local`.

Without this, creating `.env.local` with real Firebase values flips the whole
suite into `firebase` mode and `config.spec.ts` (which asserts the mock-mode
defaults that protect a Cloudflare Pages build) fails for everyone.

Each test stubs exactly the variables it needs with `vi.stubEnv()`.
