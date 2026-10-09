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

| Task                      | Command                                                         |
| ------------------------- | --------------------------------------------------------------- |
| Frontend only dev         | `npm run dev`                                                   |
| Frontend + `/api`         | `npm run dev:full` (`vercel dev`; needs `npx vercel link` once) |
| Typecheck / lint / format | `npm run typecheck` / `npm run lint` / `npm run format`         |
| Unit tests                | `npm test`                                                      |
| e2e                       | `npm run e2e` (first time: `npx playwright install chromium`)   |
| Build                     | `npm run build`                                                 |
| Deploy                    | `npx vercel` (preview) / `npx vercel --prod`                    |

## Env vars (see `.env.example`; local values in `.env.local`, gitignored)

`GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-3.5-flash-lite`), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_SALT`.
Never prefix with `VITE_` — that ships them to the browser. Upstash vars are optional locally (rate limit skipped).

## Conventions

- `api/` and `shared/` use **`.js` extensions on relative imports** (NodeNext resolution — required for Vercel's Node ESM runtime). `src/` uses extensionless imports.
- `api/_lib/` = helpers (underscore prefix → not routed by Vercel).
- Model output is untrusted: validate with Zod + `normalizeQuestions`, render as text only. No `dangerouslySetInnerHTML`.
- Never log user answers server-side; only status/latency/model/error code.
- No `any` without a comment. No new dependency without stating why and what it replaces.
- Small commits, clear messages. Each milestone: run app + tests, summarize, stop for review.

## Where to edit things

- Gemini system prompt: `api/_lib/systemPrompt.ts` (M4)
- Fallback questions per project type: `src/lib/fallbackQuestions.ts` (M5)
- Prompt template: `src/lib/buildPrompt.ts` (M6)
- Limits (question count, label lengths, body size): `shared/limits.ts`
- Brand colours: `src/index.css` `@theme`; icon: `public/favicon.svg`

## Key decisions

- **ESLint pinned to v9**: `eslint-plugin-jsx-a11y` doesn't support ESLint 10 yet; avoided `--legacy-peer-deps`.
- **`responseJsonSchema` over `responseSchema`**: lets `z.toJSONSchema()` generate Gemini's schema from the same Zod source.
- **Gemini free tier** → privacy notice says Google may retain inputs under its terms.
- **Generated prompt is agent-neutral**: tells the agent to maintain `AGENTS.md` (or `CLAUDE.md` / `.cursor/rules`).
- **No animation library**: CSS transitions + `ResizeObserver` for card height (bundle budget 200 KB gz).
- **Regenerate cap (2)** persisted in localStorage, reset by Start over.
- npm blocked install scripts for `@google/genai` (no-op) and `protobufjs` (version-check postinstall) — both safe to leave unapproved.

## Status

- M1 scaffold done. Vercel link pending (owner needs a Vercel account). Upstash pending (needed by M4).
