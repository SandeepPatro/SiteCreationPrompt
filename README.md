# PromptForge

> ### ▶ Use the app: **[sitecreationprompt.vercel.app](https://sitecreationprompt.vercel.app/)**
>
> Free, no sign-up. Works on desktop and mobile, in light and dark mode.

Describe your software project in a 3-step card wizard, answer a few AI-generated follow-up
questions, and get a detailed, ready-to-paste **kickoff prompt** for any AI coding agent
(Claude Code, Cursor, Copilot, …).

People often start AI coding projects with a vague one-line prompt. PromptForge turns your idea
into a structured brief: what to build, scope, stack, standards, and a "clarify → plan → wait for
approval → build in milestones" workflow, so the agent asks the right questions before writing code.

## How to use it

1. Open **https://sitecreationprompt.vercel.app/**.
2. **Step 1 – Project.** Fill in the name, what you're building, who it's for, the project type,
   at least one must-have feature, anything out of scope (optional), your stack preference
   ("recommend one for me" or your own notes) and your experience level. Press **Next →**.
   If something is missing, the page jumps to the first field that needs fixing.
3. **Step 2 – Details.** After about 2–3 seconds, 3–6 follow-up questions tailored to your
   project appear. They come from Google Gemini and are all optional.
   - **↻ Regenerate questions** gets a different set, up to 2 times per session.
   - If the AI is unavailable or you hit the hourly limit, you get standard questions for your
     project type instead, with a short notice. You can still finish.
4. **Step 3 – Prompt.** Press **Copy** or **Download .md**, then paste the prompt as the first
   message to your AI coding agent.

Tips:

- **← Back** keeps everything you entered. If Step 1 hasn't changed, the same questions are
  reused and the AI isn't called again.
- Your progress is **autosaved in your browser**, so a refresh or an accidentally closed tab
  doesn't lose it.
- **Start over** asks for confirmation, then clears everything.
- Each visitor can get tailored questions **10 times per hour**.
- Don't enter confidential information (see [Privacy](#privacy-and-security)).

## Features

- One centered card with a progress bar and a smooth height animation (turned off when
  `prefers-reduced-motion` is set).
- AI follow-up questions use five field types (short text, long text, single choice, multiple
  choice, yes/no). Rule-based fallback questions cover every project type.
- The generated prompt adapts to your experience level, project type (accessibility and
  responsive notes are added only for UI projects) and stack choice. It leaves out empty sections.
- Copy with "Copied ✓" feedback and a fallback for older browsers. The download filename comes
  from your project name.
- Accessible:
  - Keyboard navigable, with visible focus.
  - Focus moves to each step's heading.
  - Screen readers announce loading and status messages.
  - Start over uses a native `<dialog>` for confirmation.
  - Passes WCAG 2.1 AA checks in light and dark mode.
- "Ember & Ink" theme (follows your system's light/dark setting), "Three Cards" logo and
  self-hosted fonts (Bricolage Grotesque, IBM Plex Sans, JetBrains Mono).

### Measured quality (production, 2026-10-09)

| Check                                      | Result                                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| Lighthouse mobile (perf / a11y / BP / SEO) | 96 / 100 / 100 / 100                                            |
| Lighthouse desktop                         | 100 / 100 / 100 / 100                                           |
| axe-core WCAG 2.1 AA                       | 0 violations on every step, error state and dialog, both themes |
| JS bundle                                  | ~122 KB gzipped (budget 200 KB)                                 |
| AI question latency                        | ~2–2.5 s                                                        |
| Secrets in client bundle                   | none (checked)                                                  |

## How it works

```
Browser (React SPA)                         Vercel Function                    Google
┌───────────────────────────┐  POST /api/followups  ┌──────────────────────────┐
│ Step 1 form (RHF + Zod)   │ ────────────────────▶ │ 1. body ≤ 8 KB      (413) │
│ Wizard state machine      │   { step1, regenerate,│ 2. validate with Zod (400)│
│  step1 → loading → step2  │     avoid? }          │ 3. rate limit 10/h  (429) │──▶ Gemini (structured
│        → step3            │ ◀──────────────────── │ 4. Gemini, 12 s timeout   │◀──  JSON output)
│ Fallback questions on any │  200 { questions }    │ 5. clean & validate output│
│ error / timeout (15 s)    │  or 4xx/5xx           │    (< 3 valid → 503)      │
└────────────┬──────────────┘                       └────────────┬─────────────┘
             │ autosave (localStorage)                           │ hashed IP
             ▼                                                   ▼
        promptforge:v1                                  Upstash Redis (rate limit)
```

- **One AI call per Step 1 version.** Questions are cached by a normalized copy of your Step 1
  answers. The browser never talks to Gemini directly, and the API key exists only in the function.
- **Model output is untrusted.** It's validated with Zod and then cleaned up: lengths are clamped,
  duplicate options and ids removed, and invalid questions dropped one by one. It's rendered as
  plain text only. If fewer than 3 valid questions survive, the API returns 503 and the browser
  shows the fallback questions.
- **The prompt is built entirely in the browser** (`src/lib/buildPrompt.ts`). Step 2 answers
  never leave your device.

## Tech stack

| Area     | Choice                                                                                    |
| -------- | ----------------------------------------------------------------------------------------- |
| Frontend | Vite 8, React 19, TypeScript 6 (strict), Tailwind CSS v4                                  |
| Forms    | React Hook Form + Zod v4 (schemas in `shared/` are used by both the frontend and the API) |
| API      | One Vercel Function, `api/followups.ts` (Node.js runtime, Web `Request`/`Response`)       |
| AI       | Google Gemini via `@google/genai`, structured JSON output, model `gemini-3.5-flash-lite`  |
| Abuse    | Upstash Redis via `@upstash/ratelimit` (sliding window, 10 requests / IP / hour)          |
| Tests    | Vitest (94 unit tests), Playwright + `@axe-core/playwright` (e2e + accessibility)         |
| Hosting  | Vercel, auto-deploys from GitHub `main`                                                   |

## Project structure

```
api/
  followups.ts          POST handler (wires real dependencies)
  _lib/                 handler logic, Gemini call, system prompt, rate limit (not routed)
shared/                 Zod schemas and limits used by both app and API
src/
  App.tsx, main.tsx, index.css (theme tokens)
  components/           Card, ProgressBar, CodeBox, DynamicField, ConfirmDialog, Header, Footer, …
  steps/                Step1, Step2, Step3
  state/                wizardReducer, useFollowups, useAutosave
  lib/                  buildPrompt, fallbackQuestions, apiClient, storage, download, …
public/                 logo, favicon, apple-touch-icon
tests/unit/             Vitest unit tests
tests/smoke/            live Gemini / Upstash smoke tests (run manually)
e2e/                    Playwright end-to-end + accessibility tests
CLAUDE.md               conventions and design decisions for AI agents and contributors
```

## Run it locally

Requirements: Node.js 20+ and a free [Google AI Studio API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/SandeepPatro/SiteCreationPrompt.git
cd SiteCreationPrompt
npm install
cp .env.example .env.local   # then put your key in .env.local
npm run dev                  # open http://localhost:5173
```

`npm run dev` runs the whole app, including `/api/followups` with real Gemini calls (through a
dev-only Vite middleware). If the key is missing, the API fails and you'll see the fallback questions.

> Put secrets **only** in `.env.local` (gitignored). `.env.example` is committed, and a unit test
> fails if a secret is ever filled in there.

## Environment variables

| Name                                                  | Required   | Description                                                                                                                          |
| ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `GEMINI_API_KEY`                                      | yes        | Google AI Studio key. Server-side only.                                                                                              |
| `GEMINI_MODEL`                                        | yes        | Gemini model id, e.g. `gemini-3.5-flash-lite`. Check [current models](https://ai.google.dev/gemini-api/docs/models) when it changes. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | production | Rate limiting. The Vercel Marketplace integration sets `KV_REST_API_URL` / `KV_REST_API_TOKEN` instead; both work.                   |
| `RATE_LIMIT_SALT`                                     | production | Random string; client IPs are hashed with it before reaching Redis.                                                                  |

Never prefix these with `VITE_`, because that would ship them to the browser. Without Upstash
variables, rate limiting is skipped (fine locally).

## Scripts

| Command                   | What it does                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`             | Dev server with the API (real Gemini via `.env.local`)                   |
| `npm run dev:full`        | Same, through the Vercel runtime (`vercel dev`; needs `npx vercel link`) |
| `npm run build`           | Type-check and production build                                          |
| `npm run preview`         | Serve the production build locally                                       |
| `npm run typecheck`       | TypeScript only                                                          |
| `npm test`                | Unit tests (Vitest)                                                      |
| `npm run e2e`             | End-to-end + accessibility tests (Playwright, API mocked)                |
| `npm run smoke:api`       | Live calls to Gemini and Upstash through the real handler (uses quota)   |
| `npm run lint` / `format` | ESLint / Prettier                                                        |

First e2e run: `npx playwright install chromium`. The e2e tests mock the API, so they never call
Gemini.

## Deploy (Vercel)

**Current setup:** the GitHub repo is connected to the Vercel project `sitecreationprompt`, so
**every push to `main` deploys to production automatically** (about a minute). For a manual
deploy, run `npx vercel --prod`; for a preview URL, run `npx vercel`.

Setting it up from scratch:

```bash
npx vercel login
npx vercel link                               # create/link the project
npx vercel env add GEMINI_API_KEY production --sensitive
npx vercel env add GEMINI_MODEL production
npx vercel env add RATE_LIMIT_SALT production --sensitive
npx vercel --prod
```

Then, in the Vercel dashboard:

1. **Storage → Upstash for Redis** (Marketplace, free tier). Create a database and connect it to
   the project for Production (and Preview). This adds the `KV_*` variables automatically.
2. **Settings → Git:** connect the GitHub repo so every push deploys.
3. Redeploy once so the function picks up the new variables.

Vercel detects Vite automatically: build `npm run build`, output `dist`, functions in `api/`.

## Troubleshooting

| Symptom                                  | Likely cause / fix                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Always standard questions, never AI ones | `GEMINI_API_KEY` / `GEMINI_MODEL` missing or wrong, or Gemini free-tier quota used up. Check the function logs in Vercel. |
| "You've hit the hourly limit" notice     | 10 AI requests per hour from your IP. Wait, or continue with the standard questions.                                      |
| Rate limit never triggers                | Upstash variables missing. Locally that's expected; in production, check the Storage connection.                          |
| Old progress shows up                    | Autosave. Use **Start over**, or clear the site's data in your browser.                                                   |
| Copy button does nothing                 | Clipboard blocked by the browser: the prompt text gets selected, so press Ctrl/Cmd+C.                                     |

## Customizing

| What                                | Where                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Gemini instructions                 | `api/_lib/systemPrompt.ts`                                                                    |
| Question shape / limits             | `shared/questionSchema.ts`, `shared/limits.ts`                                                |
| Step 1 fields, caps and labels      | `shared/step1Schema.ts`, `src/lib/step1Form.ts`                                               |
| Fallback questions per project type | `src/lib/fallbackQuestions.ts`                                                                |
| Step 2 notices / regeneration cap   | `src/lib/notices.ts`, `MAX_REGENERATIONS` in `src/state/wizardReducer.ts`                     |
| Generated prompt template           | `src/lib/buildPrompt.ts` (update the snapshot with `npx vitest -u` after intentional changes) |
| Brand colours                       | `--pf-*` variables at the top of `src/index.css`                                              |
| Logo / icons                        | `public/logo-mark.svg`, `public/logo-mark-dark.svg`, `public/favicon.svg`                     |

More detail on conventions and design decisions: [`CLAUDE.md`](./CLAUDE.md).

## Privacy and security

- Only your **Step 1 answers** leave the browser. They're sent to Google's Gemini API to generate
  the follow-up questions. This uses the free tier, so Google may retain and use them under its
  terms: **don't enter anything confidential.** Step 2 answers and the final prompt stay in your
  browser.
- Nothing is stored on our server. The function logs only status, latency, model and error codes,
  never answers.
- The API key exists only in the serverless function; the client bundle is checked for it.
- IP addresses are hashed with a secret salt before reaching Redis, and only for rate limiting.
- Model output is untrusted: it's validated with Zod, clamped and rendered as plain text only.
  User text is escaped so it can't break out of the prompt's data section.
- Requests over 8 KB are rejected; Gemini errors or quota limits return 503 and the app falls back.
