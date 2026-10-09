import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// .env.example is committed to a public repo: secrets must stay empty there (real values go in .env.local).
const SECRETS = ['GEMINI_API_KEY', 'UPSTASH_REDIS_REST_TOKEN', 'RATE_LIMIT_SALT'];

describe('.env.example', () => {
  const lines = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8').split(/\r?\n/);

  it.each(SECRETS)('leaves %s empty', (name) => {
    const line = lines.find((l) => l.startsWith(`${name}=`));
    expect(line, `${name} should be listed`).toBeDefined();
    expect(line?.slice(name.length + 1).trim(), `${name} must be empty in .env.example`).toBe('');
  });
});
