# Sprite Editing Pipeline — Backend

REST API that turns the character image plus a text prompt into a re-editable sprite animation.

```
POST /generations ─► OpenAI image edit ─► fal image-to-video ─► FFmpeg frames ─► spritesheet.png + manifest.json
```

Express + TypeScript, Zod validation, Prisma + Postgres, Swagger docs, Jest tests, Docker Compose.
The frontend lives in a separate repo and talks to this API.

## Quick start

Requirements: Node 20+ and Docker.

```bash
cd backend
npm install
npm run docker:db            # Postgres on localhost:5433 (container: candidate-kit-postgres)
npm run prisma:migrate:deploy
npm run dev                  # API on http://localhost:4000
```

- Swagger UI: <http://localhost:4000/docs> (raw spec: `/docs.json`)
- Health: <http://localhost:4000/health>, readiness (checks DB): `/health/ready`

All configuration is in `backend/.env` (the only env file, no extension). It already contains the keys from
`PROJECT_SPEC.md`; replace them with your own if you like. `.env` is git-ignored.

### Docker (Postgres and API run separately)

| Command                    | What it does                                                          |
| -------------------------- | --------------------------------------------------------------------- |
| `npm run docker:db`        | Postgres only                                                         |
| `npm run docker:api`       | API only (`--no-deps`; needs Postgres reachable as service `postgres`) |
| `npm run docker:up`        | Both                                                                  |
| `npm run docker:down`      | Stop and remove both                                                  |
| `npm run docker:db:down`   | Stop Postgres                                                         |
| `npm run docker:api:down`  | Stop API                                                              |
| `npm run docker:logs`      | Tail logs                                                             |

Files: `docker/Dockerfile`, `docker/docker-compose.yml`. The container applies migrations on start and mounts
`../assets` (read-only) and `../output`.

## API for the frontend

| Method | Path                | Purpose                                                              |
| ------ | ------------------- | -------------------------------------------------------------------- |
| POST   | `/generations`      | Body `{ "prompt": "..." }`. Returns **202** with the job, or **409** if one is running |
| GET    | `/generations/:id`  | Poll every ~2 s until `finished: true`                               |
| GET    | `/generations/latest` | Latest completed generation (use on page load); 404 if none        |
| GET    | `/output/:file`     | `spritesheet.png`, `manifest.json`, `generation-log.json`, `edited_base_image.png`, `source_video.mp4` |
| GET    | `/health`, `/health/ready` | Liveness / readiness                                          |

Typical flow:

1. `POST /generations` → `{ id, status: "QUEUED", finished: false, ... }`
2. Poll `GET /generations/:id`. `status` moves through `EDITING_IMAGE` → `GENERATING_VIDEO` → `EXTRACTING_FRAMES` →
   `BUILDING_SPRITESHEET` → `COMPLETED` (or `FAILED` with `errorMessage`).
3. When `COMPLETED`, `artifacts.spritesheet` and `artifacts.manifest` are absolute URLs. Fetch the manifest
   (`frames[]`, `fps`, `frameWidth`, `frameHeight`, `loop`) and play the spritesheet.
4. Submitting again replaces the output with the new result. `/output` always holds the latest successful run.

CORS allows the origins in `CORS_ORIGIN` (comma separated, default `http://localhost:5173`).
Error shape: `{ "error": { "code", "message", "details?" } }`.

## Architecture

```
src/
  config/       Zod-validated env (.env)
  db/           Prisma singleton
  errors/       AppError hierarchy
  middleware/   validate (Zod), error handler, 404
  modules/      feature modules: routes → controller → service → repository
    health/
    generation/
  providers/    ImageEditProvider (OpenAI) and VideoGenerationProvider (fal) behind interfaces
  pipeline/     orchestrator, FFmpeg/sharp media processor, manifest + log builders
  docs/         OpenAPI document (schemas derived from the Zod schemas)
  container.ts  composition root
tests/          Jest + Supertest, providers and DB faked
prisma/         schema + migrations
```

To add a feature, create `src/modules/<name>/` and register it in `src/modules/index.ts`.
To swap a vendor, implement the interface in `src/providers/types.ts` and change `createProviders`.

Jobs run in-process, one at a time (no queue). On startup, jobs left running by a previous process are marked `FAILED`.
Only one video API call is made per generation; FFmpeg extracts every frame from that clip.

## Configuration (`.env`)

| Variable | Purpose |
| --- | --- |
| `PORT`, `CORS_ORIGIN`, `LOG_LEVEL` | Server |
| `DATABASE_URL`, `POSTGRES_*` | Postgres (host port 5433 by default) |
| `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL` | Image edit (`gpt-image-2`) |
| `FAL_KEY`, `FAL_VIDEO_MODEL`, `VIDEO_RESOLUTION`, `VIDEO_DRAFT` | Video (`bytedance/seedance-2.5/image-to-video`) |
| `IMAGE_GENERATION_TIMEOUT_MS`, `VIDEO_GENERATION_TIMEOUT_MS`, `FRAME_EXTRACTION_TIMEOUT_MS`, `SPRITESHEET_BUILD_TIMEOUT_MS` | Per-step timeouts |
| `VIDEO_DURATION_SECONDS`, `SPRITE_FPS`, `FRAME_WIDTH`, `FRAME_HEIGHT`, `SPRITESHEET_COLUMNS` | Sprite settings |
| `INPUT_IMAGE_PATH`, `OUTPUT_DIR`, `WORK_DIR`, `ASSET_ID`, `INITIAL_PROMPT` | Files and naming |
| `IMAGE_COST_ESTIMATE_USD`, `VIDEO_COST_ESTIMATE_USD` | Written to `generation-log.json` |

Each run stores per-step timings (`imageGenerationMs`, `videoGenerationMs`, `frameExtractionMs`,
`spritesheetBuildMs`, `totalMs`) in the `Generation` table and returns them from the API.
Video generation dominates the run time (minutes); everything else takes seconds.

## Scripts

| Script | |
| --- | --- |
| `npm run dev` | API with reload (tsx) |
| `npm run build` / `npm start` | Compile to `dist/` and run |
| `npm test` / `npm run test:coverage` | Jest (tests live only in `tests/`) |
| `npm run lint`, `npm run typecheck`, `npm run format:check` | Quality checks (run in CI) |
| `npm run prisma:migrate:dev` / `prisma:migrate:deploy` | Migrations |

## Output contract

A successful run writes the files required by `OUTPUT_CONTRACT.md` to `../output`: `spritesheet.png`, `manifest.json`,
`generation-log.json`, `edited_base_image.png`, `source_video.mp4`. `preview.html` is delivered by the frontend repo.
