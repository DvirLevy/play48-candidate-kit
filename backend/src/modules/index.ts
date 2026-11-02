import type { Router } from 'express';
import { GenerationController } from './generation/generation.controller';
import { createGenerationRouter } from './generation/generation.routes';
import type { GenerationService } from './generation/generation.service';
import { HealthController } from './health/health.controller';
import { createHealthRouter } from './health/health.routes';
import type { HealthService } from './health/health.service';

export interface ApiModule {
  basePath: string;
  router: Router;
}

export interface ModuleServices {
  health: HealthService;
  generation: GenerationService;
}

/** Register new feature modules here; app.ts mounts whatever this returns. */
export function createModules(services: ModuleServices): ApiModule[] {
  return [
    { basePath: '/health', router: createHealthRouter(new HealthController(services.health)) },
    {
      basePath: '/generations',
      router: createGenerationRouter(new GenerationController(services.generation)),
    },
  ];
}
