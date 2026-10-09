import { LIMITS } from '../shared/limits.js';

// Smoke-test endpoint: proves Vercel can bundle imports from shared/.
export function GET(): Response {
  return Response.json({ ok: true, maxQuestions: LIMITS.maxQuestions });
}
