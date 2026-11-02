import { z } from 'zod';

export const createGenerationBodySchema = z.object({
  prompt: z
    .string({ error: 'prompt is required' })
    .trim()
    .min(3, 'prompt must be at least 3 characters')
    .max(500, 'prompt must be at most 500 characters'),
});

export const generationIdParamsSchema = z.object({
  id: z.uuid({ error: 'id must be a valid UUID' }),
});

export const generationStatusSchema = z.enum([
  'QUEUED',
  'EDITING_IMAGE',
  'GENERATING_VIDEO',
  'EXTRACTING_FRAMES',
  'BUILDING_SPRITESHEET',
  'COMPLETED',
  'FAILED',
]);

const providerCallSchema = z.object({
  provider: z.string(),
  model: z.string(),
  type: z.enum(['llm', 'image', 'video', 'audio', 'other']),
  timestamp: z.string(),
  success: z.boolean(),
  requestSummary: z.string(),
  responseSummary: z.string(),
});

export const generationResponseSchema = z.object({
  id: z.uuid(),
  prompt: z.string(),
  status: generationStatusSchema,
  /** true once the job reached COMPLETED or FAILED: the frontend can stop polling */
  finished: z.boolean(),
  errorMessage: z.string().nullable(),
  timings: z.object({
    imageGenerationMs: z.number().int().nullable(),
    videoGenerationMs: z.number().int().nullable(),
    frameExtractionMs: z.number().int().nullable(),
    spritesheetBuildMs: z.number().int().nullable(),
    totalMs: z.number().int().nullable(),
  }),
  frameCount: z.number().int().nullable(),
  providerCalls: z.array(providerCallSchema),
  /** Absolute URLs of the output files; null until the job completes */
  artifacts: z
    .object({
      spritesheet: z.string(),
      manifest: z.string(),
      generationLog: z.string(),
      editedBaseImage: z.string(),
      sourceVideo: z.string(),
    })
    .nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type GenerationResponse = z.infer<typeof generationResponseSchema>;
