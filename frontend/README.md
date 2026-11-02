# Sprite Studio — Frontend

React + Vite + TypeScript UI for the sprite pipeline. Plays the latest animation on a `<canvas>`, lets you submit a new prompt, shows pipeline progress, then swaps in the new animation without a reload.

Stack: React, Vite, TypeScript, Tailwind CSS v4, shadcn/ui-style primitives, TanStack Query, Axios, React Hook Form + Zod, Vitest + React Testing Library, ESLint, Prettier, Docker.

## Run

Start the backend first (`../backend`, API on http://localhost:4000).

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

All configuration lives in `.env` (the only env file): `VITE_API_URL=http://localhost:4000`.

| Script                                                        |                             |
| ------------------------------------------------------------- | --------------------------- |
| `npm test` / `npm run test:coverage`                          | Vitest + Testing Library    |
| `npm run lint` / `npm run typecheck` / `npm run format:check` | Quality checks              |
| `npm run build`                                               | Production build in `dist/` |

Docker: `docker compose up --build` serves the build with nginx on http://localhost:5173 (`VITE_API_URL` is baked in from `.env` at build time).

## Structure

```
src/
  api/         axios client, Zod schemas, ApiError normalisation, endpoint functions
  hooks/       useStudio (flow), useGeneration (2s polling), useSpriteAssets (preload), useSpriteAnimation (rAF canvas)
  components/  feature components; ui/ holds the design-system primitives
  pages/       HomePage, DesignSystemPage (/design-system), NotFoundPage
  lib/         pure helpers (frame timing, step mapping, prompt schema)
```

Errors: API errors become `ApiError`; render errors hit `ErrorBoundary`; a failed initial load or unknown route shows the error page. 409 shows "A generation is already running"; FAILED shows the backend message and the form stays usable.
`public/assets/` holds the original character image shown before the first generation.
