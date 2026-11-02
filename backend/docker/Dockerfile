# syntax=docker/dockerfile:1
# Build context is the backend folder (see docker-compose.yml)

FROM node:22-bookworm-slim AS base
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./dist/generated
COPY package.json prisma.config.ts ./
COPY prisma ./prisma
EXPOSE 4000
# Apply pending migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
