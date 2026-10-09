import { z } from 'zod';
import { LIMITS } from './limits.js';
import { questionSchema } from './questionSchema.js';
import { step1Schema } from './step1Schema.js';

/** POST /api/followups request body. */
export const followupsRequestSchema = z.object({
  step1: step1Schema,
  regenerate: z.boolean().optional(),
  /** Labels of previously shown questions, so a regeneration asks different ones. */
  avoid: z
    .array(z.string().max(LIMITS.label))
    .max(LIMITS.maxQuestions * 2)
    .optional(),
});
export type FollowupsRequest = z.infer<typeof followupsRequestSchema>;

/** 200 response body. The frontend re-validates with this (the network is untrusted too). */
export const followupsResponseSchema = z.object({
  questions: z.array(questionSchema).min(1).max(LIMITS.maxQuestions),
});
export type FollowupsResponse = z.infer<typeof followupsResponseSchema>;

export type FollowupsErrorCode =
  'payload_too_large' | 'bad_request' | 'rate_limited' | 'upstream_unavailable';
