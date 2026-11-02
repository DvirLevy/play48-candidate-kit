import type { Generation } from '../../generated/prisma/client';
import { OUTPUT_FILES } from '../../pipeline/artifacts';
import type { GenerationResponse } from './generation.schema';

const FINISHED = new Set(['COMPLETED', 'FAILED']);

/**
 * @param publicBaseUrl origin the frontend can reach this API on, e.g. http://localhost:4000
 */
export function toGenerationResponse(
  generation: Generation,
  publicBaseUrl: string,
): GenerationResponse {
  // ?v=<id> busts browser caches: /output always holds the latest successful run
  const url = (file: string) => `${publicBaseUrl}/output/${file}?v=${generation.id}`;
  return {
    id: generation.id,
    prompt: generation.prompt,
    status: generation.status,
    finished: FINISHED.has(generation.status),
    errorMessage: generation.errorMessage,
    timings: {
      imageGenerationMs: generation.imageGenerationMs,
      videoGenerationMs: generation.videoGenerationMs,
      frameExtractionMs: generation.frameExtractionMs,
      spritesheetBuildMs: generation.spritesheetBuildMs,
      totalMs: generation.totalMs,
    },
    frameCount: generation.frameCount,
    providerCalls: (generation.providerCalls as GenerationResponse['providerCalls']) ?? [],
    artifacts:
      generation.status === 'COMPLETED'
        ? {
            spritesheet: url(OUTPUT_FILES.spritesheet),
            manifest: url(OUTPUT_FILES.manifest),
            generationLog: url(OUTPUT_FILES.generationLog),
            editedBaseImage: url(OUTPUT_FILES.editedBaseImage),
            sourceVideo: url(OUTPUT_FILES.sourceVideo),
          }
        : null,
    startedAt: generation.startedAt?.toISOString() ?? null,
    completedAt: generation.completedAt?.toISOString() ?? null,
    createdAt: generation.createdAt.toISOString(),
  };
}
