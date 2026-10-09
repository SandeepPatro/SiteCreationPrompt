import { generateFollowups, geminiModel } from './_lib/gemini.js';
import { createFollowupsHandler } from './_lib/handler.js';
import { upstashRateLimit } from './_lib/rateLimit.js';

/** POST /api/followups — Step 1 answers in, 3–6 tailored follow-up questions out. */
export const POST = createFollowupsHandler({
  generate: generateFollowups,
  rateLimit: upstashRateLimit,
  model: geminiModel,
  log: (entry) => console.info(JSON.stringify(entry)),
});
