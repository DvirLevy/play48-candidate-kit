import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';
import { GenerationService } from './modules/generation/generation.service';
import { PrismaGenerationRepository } from './modules/generation/generation.repository';
import { HealthService } from './modules/health/health.service';
import { createModules } from './modules';
import { FfmpegMediaProcessor } from './pipeline/media';
import { GenerationPipeline } from './pipeline/pipeline';
import { createProviders } from './providers';
import { logger } from './utils/logger';

/** Composition root: wires real implementations together. */
export function bootstrap() {
  const pipeline = new GenerationPipeline(createProviders(env), new FfmpegMediaProcessor(), {
    assetId: env.ASSET_ID,
    inputImagePath: env.INPUT_IMAGE_PATH,
    outputDir: env.OUTPUT_DIR,
    workDir: env.WORK_DIR,
    inputImageMaxEdge: env.INPUT_IMAGE_MAX_EDGE,
    videoDurationSeconds: env.VIDEO_DURATION_SECONDS,
    fps: env.SPRITE_FPS,
    frameWidth: env.FRAME_WIDTH,
    frameHeight: env.FRAME_HEIGHT,
    columns: env.SPRITESHEET_COLUMNS,
    timeouts: {
      imageMs: env.IMAGE_GENERATION_TIMEOUT_MS,
      videoMs: env.VIDEO_GENERATION_TIMEOUT_MS,
      frameExtractionMs: env.FRAME_EXTRACTION_TIMEOUT_MS,
      spritesheetMs: env.SPRITESHEET_BUILD_TIMEOUT_MS,
    },
    costEstimateUsd: env.IMAGE_COST_ESTIMATE_USD + env.VIDEO_COST_ESTIMATE_USD,
  });

  const generation = new GenerationService(
    new PrismaGenerationRepository(prisma),
    pipeline,
    logger,
  );
  const health = new HealthService({
    ping: async () => {
      await prisma.$queryRaw`SELECT 1`;
    },
  });

  const app = createApp({
    modules: createModules({ health, generation }),
    corsOrigins: env.CORS_ORIGIN,
    outputDir: env.OUTPUT_DIR,
  });
  return { app, generation };
}
