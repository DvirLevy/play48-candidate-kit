# Play48 AI Sprite Editing Pipeline

Prompt + character image -> edited image (OpenAI) -> video (fal) -> FFmpeg frames -> playable spritesheet.

- `backend/`: Express + TypeScript + Prisma + Postgres API (see `backend/README.md`)
- `frontend/`: React studio UI (see `frontend/README.md`)
- `output/`: latest generated artifacts (spritesheet, manifest, video, log, edited image)

## Run everything in Docker

Requires Docker and a `backend/.env` file (not committed, it holds the API keys).

```bash
./scripts/docker.sh up       # build + start Postgres, API and frontend
./scripts/docker.sh logs     # follow logs
./scripts/docker.sh down     # stop (keeps the database)
./scripts/docker.sh reset    # stop and delete the database volume
```

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:5173        |
| API      | http://localhost:4000        |
| Swagger  | http://localhost:4000/docs   |
| Postgres | localhost:5433               |

Each part can still run on its own: `cd backend && npm run docker:db` (Postgres only) or `npm run docker:api` (API only).
A generation takes about 3.5 minutes, almost all of it in the video step.
