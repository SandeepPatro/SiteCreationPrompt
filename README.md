# PromptForge

Describe your software project in a 3-step card wizard, answer a few AI-generated follow-up
questions, and get a detailed, ready-to-paste **kickoff prompt** for any AI coding agent
(Claude Code, Cursor, Copilot, …).

**Live:** https://sitecreationprompt.vercel.app

1. **Project**: name, what you're building, audience, type, must-have features, scope, stack, experience.
2. **Details**: 3–6 tailored follow-up questions from Google Gemini (all optional). If the AI is
   unavailable or rate-limited, rule-based questions for your project type are shown instead.
3. **Prompt**: the full Markdown prompt, with **Copy** and **Download .md**.

Progress is autosaved in your browser. Only your Step 1 answers leave the browser (to generate
the follow-up questions); nothing is stored on the server.

## Stack

- Vite + React + TypeScript (strict) + Tailwind CSS v4
- React Hook Form + Zod (schemas in `shared/` are used by both the frontend and the API)
- One Vercel Function, `api/followups.ts`, calls Gemini via `@google/genai` with structured JSON output
- Upstash Redis rate limiting (10 requests per IP per hour)
- Vitest (unit), Playwright + axe-core (end-to-end and accessibility)

## Local setup

Requirements: Node.js 20+ and a [Google AI Studio API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/SandeepPatro/SiteCreationPrompt.git
cd SiteCreationPrompt
npm install
cp .env.example .env.local   # then put your key in .env.local
npm run dev                  # http://localhost:5173
```

`npm run dev` runs the whole app, including `/api/followups` with real Gemini calls (through a
dev-only Vite middleware). Without a key, the API fails and you'll see the fallback questions.

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

| Command                   | What it does                                                         |
| ------------------------- | -------------------------------------------------------------------- |
| `npm run dev`             | Dev server with the API                                              |
| `npm run build`           | Type-check and production build                                      |
| `npm test`                | Unit tests (Vitest)                                                  |
| `npm run e2e`             | End-to-end + accessibility tests (Playwright, API mocked)            |
| `npm run smoke:api`       | Live call to Gemini through the real handler (uses 2 quota requests) |
| `npm run lint` / `format` | ESLint / Prettier                                                    |

First e2e run: `npx playwright install chromium`.

## Deploy (Vercel)

```bash
npx vercel login
npx vercel link                               # create/link the project
npx vercel env add GEMINI_API_KEY production --sensitive
npx vercel env add GEMINI_MODEL production
npx vercel env add RATE_LIMIT_SALT production --sensitive
npx vercel --prod
```

Then add **Upstash Redis** from the project's **Storage** tab in the Vercel dashboard (free tier)
and redeploy so the function picks up its variables. To deploy on every push, connect the GitHub
repo under **Settings → Git** (requires a GitHub login connection on your Vercel account).

Vercel detects Vite automatically: build `npm run build`, output `dist`, functions in `api/`.

## Customizing

| What                                | Where                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Gemini instructions                 | `api/_lib/systemPrompt.ts`                                                                    |
| Question shape / limits             | `shared/questionSchema.ts`, `shared/limits.ts`                                                |
| Fallback questions per project type | `src/lib/fallbackQuestions.ts`                                                                |
| Generated prompt template           | `src/lib/buildPrompt.ts` (update the snapshot with `npx vitest -u` after intentional changes) |
| Brand colours / icon                | `src/index.css` (`@theme`), `public/favicon.svg`                                              |

More detail on conventions and design decisions: [`CLAUDE.md`](./CLAUDE.md).

## Privacy and security

- Step 1 answers are sent to Google's Gemini API (free tier: Google may retain and use them under
  its terms). The server logs only status, latency, model and error codes, never answers.
- The API key exists only in the serverless function; the client bundle is checked for it.
- Model output is untrusted: validated with Zod, clamped, and rendered as plain text only.
- Requests over 8 KB are rejected; Gemini errors or quota limits return 503 and the app falls back.
