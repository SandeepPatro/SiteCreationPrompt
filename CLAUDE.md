# PromptForge

3-step card wizard → AI follow-up questions (Gemini) → ready-to-paste kickoff prompt for AI coding agents.
The approved v1 plan (architecture, schema, milestones M1–M8) lives outside the repo; this file records the decisions that matter day to day.
Owner is intermediate: give brief reasoning, explain only non-obvious choices.

## Stack

- Vite 8 + React 19 + TypeScript 6 (strict, `noUncheckedIndexedAccess`) + Tailwind v4 (`@tailwindcss/vite`, tokens in `src/index.css` `@theme`)
- React Hook Form + Zod v4 (schemas in `shared/`, used by both frontend and API)
- One Vercel function `api/followups.ts` (Web `Request`/`Response`) → Gemini via `@google/genai` (structured output: `responseMimeType` + `responseJsonSchema`)
- Upstash Redis rate limit (10 req / IP / hour, IP hashed with `RATE_LIMIT_SALT`)
- Vitest (unit, `tests/unit`), Playwright (e2e, `e2e/`, API mocked with `page.route`)

## Commands

| Task                      | Command                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Dev (full flow)           | `npm run dev` — Vite + dev-only `/api/followups` middleware (real Gemini via `.env.local`) |
| Dev via Vercel runtime    | `npm run dev:full` (`vercel dev`; needs `npx vercel link` once)                            |
| Typecheck / lint / format | `npm run typecheck` / `npm run lint` / `npm run format`                                    |
| Unit tests                | `npm test`                                                                                 |
| Live Gemini smoke test    | `npm run smoke:api` (uses `.env.local`; spends 2 free-tier requests)                       |
| e2e                       | `npm run e2e` (first time: `npx playwright install chromium`)                              |
| Build                     | `npm run build`                                                                            |
| Deploy                    | `npx vercel` (preview) / `npx vercel --prod`                                               |

## Env vars (see `.env.example`; local values in `.env.local`, gitignored)

`GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-3.5-flash-lite`), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_SALT`.
Upstash via the Vercel Marketplace sets `KV_REST_API_URL` / `KV_REST_API_TOKEN` instead — both naming schemes work.
Never prefix with `VITE_` — that ships them to the browser. Upstash vars are optional locally (rate limit skipped).

## Conventions

- `api/` and `shared/` use **`.js` extensions on relative imports** (NodeNext resolution — required for Vercel's Node ESM runtime). `src/` uses extensionless imports.
- `api/_lib/` = helpers (underscore prefix → not routed by Vercel).
- Model output is untrusted: validate with Zod + `normalizeQuestions`, render as text only. No `dangerouslySetInnerHTML`.
- Never log user answers server-side; only status/latency/model/error code.
- No `any` without a comment. No new dependency without stating why and what it replaces.
- Small commits, clear messages. Each milestone: run app + tests, summarize, stop for review.

## Where to edit things

- Gemini system prompt: `api/_lib/systemPrompt.ts`. Output shape: `shared/questionSchema.ts` (wire schema → `responseJsonSchema`; snapshot test guards it). Cleanup rules: `shared/normalizeQuestions.ts`
- Fallback questions per project type: `src/lib/fallbackQuestions.ts` (test checks every list against the Question schema)
- Step 2 notice texts: `src/lib/notices.ts`; regeneration cap: `MAX_REGENERATIONS` in `src/state/wizardReducer.ts`
- Saved-state shape: `src/lib/storage.ts` — if `WizardState` changes incompatibly, bump `STORAGE_KEY`/`version` (old data is then discarded, not migrated)
- Prompt template: `src/lib/buildPrompt.ts` (snapshot in `tests/unit/__snapshots__/buildPrompt.test.ts.snap` — run `npx vitest -u` after intentional template changes and review the diff)
- Download filename / copy fallback: `src/lib/download.ts`
- Limits (question count, label lengths, body size): `shared/limits.ts`; Step 1 caps + labels: `shared/step1Schema.ts`; Step 1 form messages: `src/lib/step1Form.ts`
- Brand colours: `--pf-*` variables at the top of `src/index.css`; logo/icons: `public/`

## Key decisions

- **ESLint pinned to v9**: `eslint-plugin-jsx-a11y` doesn't support ESLint 10 yet; avoided `--legacy-peer-deps`.
- **`responseJsonSchema` over `responseSchema`**: lets `z.toJSONSchema()` generate Gemini's schema from the same Zod source.
- **Gemini free tier** → privacy notice says Google may retain inputs under its terms.
- **Generated prompt is agent-neutral**: tells the agent to maintain `AGENTS.md` (or `CLAUDE.md` / `.cursor/rules`).
- **No animation library**: CSS transitions + `ResizeObserver` for card height (bundle budget 200 KB gz).
- **Regenerate cap (2)** persisted in localStorage, reset by Start over.
- npm blocked install scripts for `@google/genai` (no-op) and `protobufjs` (version-check postinstall) — both safe to leave unapproved.
- **Two Step 1 shapes**: `src/lib/step1Form.ts` (form: `{value}` rows for RHF field arrays, `''` radios, flat stack fields, all checks continuable so every error shows at once) → `toStep1Answers()` → canonical `shared/step1Schema.ts` (sent to API, used by buildPrompt).
- **Error focus**: RHF `shouldFocusError` off; we focus the first `[aria-invalid="true"]` in DOM order (works for radios and field arrays).
- **Handler uses dependency injection** (`api/_lib/handler.ts` → `createFollowupsHandler`): tests fake Gemini/rate limit/clock; `api/followups.ts` only wires real deps.
- **Gemini SDK retries disabled** (`retryOptions.attempts: 1`): default is 5 attempts incl. 429 with up to 60s backoff — would exceed the 12s budget and burn quota. 12s abort < client 15s timeout so the server can still reply 503.
- **`thinkingLevel: LOW`** to keep latency under ~5s. Verified live 2026-10-09: `gemini-3.5-flash-lite` accepts it, ~2.5s, 3 valid questions.
- **Bad questions are dropped individually**; only < 3 survivors → 503 → frontend fallback.
- **Rate limit after validation** (malformed requests don't burn quota), **fails open** if Upstash is missing/down (Gemini quota is the backstop).
- `<` escaped as `\u003c` in the JSON sent to Gemini so user text can't close the `<project>` tags.
- **`.env.example` guard test**: fails if a secret has a value there (repo is public; real values only in `.env.local`).
- **Dev API middleware** (`devApi()` in `vite.config.ts`, serve-only): routes `/api/followups` to `api/followups.ts` via `ssrLoadModule`; `.env.local` is loaded into `process.env` server-side. Lets `npm run dev` run the real flow without a Vercel account. Note: React StrictMode double-runs effects in dev, so a Step 1 → Step 2 transition may send 2 requests in dev (first aborted client-side). Production sends 1.
- **Question cache** = `normalizeKey(step1)` (whitespace-insensitive). Unchanged Step 1 → straight to Step 2, no request. Changed → refetch; answers kept only when same id AND compatible type/options (`keepCompatibleAnswers`).
- **Stale responses ignored**: reducer applies a response only if still loading for the same key; leaving the loading phase aborts the fetch.
- **Failed regeneration keeps current questions** (notice `regenerate_failed`) instead of swapping in fallbacks.
- **Step 2 answers sync to wizard state on every change** (RHF `subscribe`), so Back/Next never loses them. Booleans are Yes/No radios (unanswered stays possible); empty answers are dropped.
- ESLint allows non-null `!` in `tests/` only.
- **buildPrompt rules**: sections without content are omitted (tested: no empty headings, no `undefined`/`null`); multi-line answers are indented to stay inside their list item; stack preferences are quoted (`>`); accessibility/responsive notes only for UI project types; one experience-specific line (beginner line per spec, plus lighter ones for intermediate/senior).
- **Code box** is a `<pre role="region" tabIndex={0}>` so keyboard users can scroll it; ESLint's `no-noninteractive-tabindex` allows the `region` role for this.
- **Copy**: Clipboard API, falls back to hidden textarea + `execCommand`; on failure the prompt text is selected and a hint stays visible. Windows' clipboard turns `\n` into `\r\n` — expected.
- **Autosave** (`src/state/useAutosave.ts` + `src/lib/storage.ts`): whole wizard state incl. Step 1 drafts (`step1Changed`) and `regenCount`, debounced 300ms, flushed on `pagehide`, key `promptforge:v1`. Restored state is Zod-validated (stored questions are as untrusted as API output); invalid → discarded, impossible phases repaired to step1. Every storage access is try/catch — the app works with storage blocked (verified).
- **Start over** uses native `<dialog>` (`ConfirmDialog`): focus trap, Esc, focus return for free; Cancel gets initial focus. Confirm → `initialWizardState` → autosave removes the key.
- **Prompt paragraphs are single lines** (no hard wraps) so they don't look broken when pasted into chat inputs.
- **`@axe-core/playwright`** (dev only): WCAG 2.1 AA audit (incl. contrast) in Playwright — same engine as Lighthouse a11y. M7: 0 violations on all steps, error state and dialog, light + dark.
- **Kept full `zod`** (not `zod/mini`): bundle is 122 KB gz vs 200 KB budget; not worth the API churn.
- ESLint `no-unused-vars` uses `ignoreRestSiblings` (omit-a-key destructuring).
- **e2e** (`e2e/`, `npm run e2e`): happy path (copy + download + cache), API failure → fallback → finish, 429 notice, invalid API data never rendered, axe WCAG AA on every step in light + dark. Desktop + Pixel 7 projects, against `vite build && vite preview`, API mocked via `page.route` (never calls Gemini). Notice text exists twice (visible + sr-only live region) → scope text selectors to `#step2-form`.
- **`.vercelignore`** excludes `.env*` (except `.env.example`), build output and reports. Tests ARE uploaded because `tsc -b` in the Vercel build type-checks them.
- `tsconfig.node.json` includes DOM libs (e2e `page.evaluate` callbacks run in the browser).
- **Filename** slug keeps non-Latin letters (`\p{L}\p{N}`), max 60 chars, falls back to `project`.
- **Redis env lookup uses `||`, not `??`** (`redisConfig()` in `api/_lib/rateLimit.ts`): an empty `UPSTASH_REDIS_REST_URL=` (copied from `.env.example`) silently disabled the limiter before this fix.
- **Theme tokens** (`src/index.css`): `--pf-*` CSS variables switch on `prefers-color-scheme`; `@theme inline` maps them to utilities `ground surface line ink muted accent accent-hover on-accent code-bg code-ink code-heading`. Use these, not raw palette colours or `dark:` variants (exceptions: red for errors/danger, amber for the Step 2 notice). Accent is ONLY for primary buttons, progress, focus rings and code-box headings; selected options use ink. Dark-mode accent hover `#FDBA74` was chosen by us (the brief only gave the light hover). Code box is dark in both themes; its headings use `#FB8A3C` (light accent `#C2410C` on the dark box fails contrast).
- Fonts: Bricolage Grotesque 700 (`font-display`), IBM Plex Sans (`font-sans`, default), JetBrains Mono (`font-mono`), **self-hosted** via `@fontsource/*` imports in `src/main.tsx` (only the weights used; `font-display: swap`; per-script `unicode-range` so only Latin downloads normally). Google Fonts was dropped: its render-blocking cross-origin stylesheet cut mobile Lighthouse from 98 to 85, and self-hosting also keeps visitor IPs away from Google. Radius tokens `rounded-card` (18px) / `rounded-control` (10px).
- Logo: `public/logo-mark.svg` / `logo-mark-dark.svg` swapped via `<picture>` in `Header.tsx`; `favicon.svg` adapts by itself; `apple-touch-icon.png` (180×180) was rendered from `logo-mark.svg` on `#F6F7F9` with Playwright.

## Status

- M1–M8 done + "Ember & Ink" theme and "Three Cards" logo. Production: https://sitecreationprompt.vercel.app (Vercel project `sandeep-95f3/sitecreationprompt`, linked via `.vercel/`, gitignored). **GitHub is connected: every push to `main` deploys to production.**
- Verified in production (2026-10-09): page 200, bundle has no key/env names, 405 GET / 413 oversize / 400 invalid, real Gemini 200 in ~2s, logs metadata-only.
- Lighthouse with Google Fonts was mobile 85 (render-blocking stylesheet); fonts are now self-hosted (see Key decisions).
- Vercel env vars (Production): `GEMINI_API_KEY`, `GEMINI_MODEL`, `RATE_LIMIT_SALT` (added via CLI, sensitive) + `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `REDIS_URL` (managed by the Upstash Marketplace integration, resource `upstash-kv-alizarin-grass`, connected to this project for Production + Preview; don't edit these by hand). Rate limit verified: `npm run smoke:api` (10 allowed, 11th blocked) and production writes `promptforge:followups:<ip-hash>:<window>` keys.
- Local `.env.local` holds `KV_REST_API_URL` / `KV_REST_API_TOKEN` copied by hand. Don't run `vercel env pull` (it overwrites `.env.local`, and sensitive vars aren't pulled).
- The Upstash token was pasted into a chat log on 2026-10-09 → rotate it (Upstash console → Reset credentials), redeploy, and update `.env.local`.
- The duplicate Vercel project `site-creation-prompt` (created from the dashboard, no Gemini vars) was deleted on 2026-10-09. `sitecreationprompt` is the only project.
- Final live check (2026-10-09): full flow on production with real Gemini (AI questions in ~2.4s), copy works, no page errors.
- Bundle 122 KB gz (budget 200).
