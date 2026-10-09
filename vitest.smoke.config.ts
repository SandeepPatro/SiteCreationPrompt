import { defineConfig } from 'vitest/config';

// Live API smoke tests — never part of `npm test`. Run with `npm run smoke:api`.
export default defineConfig({
  test: {
    include: ['tests/smoke/**/*.smoke.ts'],
    environment: 'node',
  },
});
