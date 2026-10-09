import { ApiError, GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { FollowupsRequest } from '../../shared/followupsApi.js';
import { geminiResponseJsonSchema } from '../../shared/questionSchema.js';
import { SYSTEM_PROMPT, buildUserContent } from './systemPrompt.js';

/** Abort Gemini before the browser's 15s timeout so we can still answer with a clean 503. */
export const GEMINI_TIMEOUT_MS = 12_000;

export type UpstreamErrorCode = 'config' | 'timeout' | 'quota' | 'upstream' | 'invalid_output';

export class UpstreamError extends Error {
  constructor(
    readonly code: UpstreamErrorCode,
    readonly status?: number,
  ) {
    super(`Gemini request failed: ${code}${status ? ` (${status})` : ''}`);
  }
}

export function geminiModel(): string | undefined {
  return process.env.GEMINI_MODEL?.trim() || undefined;
}

/** Calls Gemini with structured output and returns the parsed (still untrusted) JSON. */
export async function generateFollowups(request: FollowupsRequest): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = geminiModel();
  if (!apiKey || !model) throw new UpstreamError('config');

  const ai = new GoogleGenAI({
    apiKey,
    // The SDK retries 429/5xx up to 5 times with long backoff by default — that would blow our
    // time budget and burn free-tier quota. One attempt; the frontend falls back instead.
    httpOptions: { timeout: GEMINI_TIMEOUT_MS, retryOptions: { attempts: 1 } },
  });

  let text: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildUserContent(request),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseJsonSchema: geminiResponseJsonSchema,
        temperature: request.regenerate ? 0.8 : 0.4,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      },
    });
    text = response.text;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new UpstreamError(error.status === 429 ? 'quota' : 'upstream', error.status);
    }
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      throw new UpstreamError('timeout');
    }
    throw new UpstreamError('upstream');
  }

  if (!text) throw new UpstreamError('invalid_output');
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new UpstreamError('invalid_output');
  }
}
