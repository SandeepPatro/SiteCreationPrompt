# PromptForge

3-step card wizard → AI follow-up questions (Gemini) → ready-to-paste kickoff prompt for AI coding agents.
Full approved plan: `C:\Users\sande\.claude\plans\pasted-content-id-fcb0-project-sharded-squid.md`.
Owner is intermediate: give brief reasoning, explain only non-obvious choices.

## Stack

- Vite 8 + React 19 + TypeScript 6 (strict, `noUncheckedIndexedAccess`) + Tailwind v4 (`@tailwindcss/vite`, tokens in `src/index.css` `@theme`)
- React Hook Form + Zod v4 (schemas in `shared/`, used by both frontend and API)
- One Vercel function `api/followups.ts` (Web `Request`/`Response`) → Gemini via `@google/genai` (structured output: `responseMimeType` + `responseJsonSchema`)
- Upstash Redis rate limit (10 req / IP / hour, IP hashed with `RATE_LIMIT_SALT`)
- Vitest (unit, `tests/unit`), Playwright (e2e, `e2e/`, API mocked with `page.route`)

## Commands

| Task                      | Command                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| Frontend only dev         | `npm run dev`                                                        |
| Frontend + `/api`         | `npm run dev:full` (`vercel dev`; needs `npx vercel link` once)      |
| Typecheck / lint / format | `npm run typecheck` / `npm run lint` / `npm run format`              |
| Unit tests                | `npm test`                                                           |
| Live Gemini smoke test    | `npm run smoke:api` (uses `.env.local`; spends 2 free-tier requests) |
| e2e                       | `npm run e2e` (first time: `npx playwright install chromium`)        |
| Build                     | `npm run build`                                                      |
| Deploy                    | `npx vercel` (preview) / `npx vercel --prod`                         |

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
- Fallback questions per project type: `src/lib/fallbackQuestions.ts` (M5)
- Prompt template: `src/lib/buildPrompt.ts` (M6)
- Limits (question count, label lengths, body size): `shared/limits.ts`; Step 1 caps + labels: `shared/step1Schema.ts`; Step 1 form messages: `src/lib/step1Form.ts`
- Brand colours: `src/index.css` `@theme`; icon: `public/favicon.svg`

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
- **`thinkingLevel: LOW`** to keep latency under ~5s; verify with `npm run smoke:api`.
- **Bad questions are dropped individually**; only < 3 survivors → 503 → frontend fallback.
- **Rate limit after validation** (malformed requests don't burn quota), **fails open** if Upstash is missing/down (Gemini quota is the backstop).
- `<` escaped as `<` in the JSON sent to Gemini so user text can't close the `<project>` tags.

## Status

- M1–M4 done (scaffold, card shell, Step 1 form, /api/followups). Placeholders: fake 800ms loading in App.tsx (→ M5); window.confirm for Start over (→ M7).
- Bundle 111 KB gz after Zod + RHF (budget 200). Consider `zod/mini` in M7 if needed.
- Not yet verified live: Gemini call (needs GEMINI_API_KEY in .env.local → `npm run smoke:api`), Upstash rate limit, Vercel bundling of api/ + shared/ (needs Vercel account).
