/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

type Handler = (request: Request) => Promise<Response>;

/**
 * Dev only: serve /api/followups from api/followups.ts inside the Vite dev server, so
 * `npm run dev` runs the full flow without `vercel dev`. Production uses the Vercel function.
 */
function devApi(): Plugin {
  return {
    name: 'promptforge-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/followups', (req, res, next) => {
        void (async () => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end();
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const headers = new Headers();
          for (const [name, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(name, value);
          }
          const { POST } = (await server.ssrLoadModule('/api/followups.ts')) as { POST: Handler };
          const response = await POST(
            new Request(`http://localhost${req.originalUrl ?? ''}`, {
              method: 'POST',
              headers,
              body: Buffer.concat(chunks),
            }),
          );
          res.statusCode = response.status;
          response.headers.forEach((value, name) => res.setHeader(name, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        })().catch(next);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make .env.local values (GEMINI_API_KEY etc.) visible to the dev API via process.env.
  // Server-side only: nothing here is exposed to the browser (only VITE_* vars are).
  for (const [name, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
    process.env[name] ??= value;
  }

  return {
    plugins: [react(), tailwindcss(), devApi()],
    test: {
      include: ['tests/unit/**/*.test.ts'],
      environment: 'node',
    },
  };
});
