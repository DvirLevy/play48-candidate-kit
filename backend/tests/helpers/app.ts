import os from 'node:os';
import { createApp } from '../../src/app';
import { createModules } from '../../src/modules';
import {
  GenerationService,
  type PipelineRunner,
} from '../../src/modules/generation/generation.service';
import { HealthService, type DatabasePing } from '../../src/modules/health/health.service';
import { InMemoryGenerationRepository } from './fakes';

const silentLog = { info: () => undefined, error: () => undefined };

export function buildTestApp(
  options: {
    pipeline?: PipelineRunner;
    database?: DatabasePing;
    repository?: InMemoryGenerationRepository;
  } = {},
) {
  const repository = options.repository ?? new InMemoryGenerationRepository();
  const pipeline: PipelineRunner = options.pipeline ?? {
    run: async () => ({ frameCount: 6, timings: zeroTimings, providerCalls: [], artifacts: {} }),
  };
  const generation = new GenerationService(repository, pipeline, silentLog);
  const health = new HealthService(options.database ?? { ping: async () => undefined });
  const app = createApp({
    modules: createModules({ health, generation }),
    corsOrigins: ['http://localhost:5173'],
    outputDir: os.tmpdir(),
  });
  return { app, repository, generation };
}

export const zeroTimings = {
  imageGenerationMs: 0,
  videoGenerationMs: 0,
  frameExtractionMs: 0,
  spritesheetBuildMs: 0,
};

export const wait = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));
