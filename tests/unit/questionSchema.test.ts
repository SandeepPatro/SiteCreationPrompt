import { describe, expect, it } from 'vitest';
import { geminiResponseJsonSchema } from '../../shared/questionSchema';

// JSON Schema keywords Gemini's responseJsonSchema supports (per the Gemini API docs).
const SUPPORTED = new Set([
  'type',
  'format',
  'title',
  'description',
  'enum',
  'items',
  'prefixItems',
  'minItems',
  'maxItems',
  'minimum',
  'maximum',
  'anyOf',
  'oneOf',
  'properties',
  'additionalProperties',
  'required',
  '$id',
  '$defs',
  '$ref',
  '$anchor',
]);

function keywords(node: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(node)) node.forEach((n) => keywords(n, found));
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      found.add(key);
      if (key === 'properties' || key === '$defs') {
        Object.values(value as object).forEach((v) => keywords(v, found));
      } else keywords(value, found);
    }
  }
  return found;
}

describe('geminiResponseJsonSchema', () => {
  it('uses only keywords Gemini supports', () => {
    const unsupported = [...keywords(geminiResponseJsonSchema)].filter((k) => !SUPPORTED.has(k));
    expect(unsupported).toEqual([]);
  });

  it('matches the expected shape', () => {
    expect(geminiResponseJsonSchema).toMatchSnapshot();
  });
});
