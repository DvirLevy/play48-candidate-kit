import { z } from 'zod'

export const GENERATION_STATUSES = [
  'QUEUED',
  'EDITING_IMAGE',
  'GENERATING_VIDEO',
  'EXTRACTING_FRAMES',
  'BUILDING_SPRITESHEET',
  'COMPLETED',
  'FAILED',
] as const

export const generationSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  status: z.enum(GENERATION_STATUSES),
  finished: z.boolean(),
  errorMessage: z.string().nullable(),
  timings: z.object({
    imageGenerationMs: z.number().nullable(),
    videoGenerationMs: z.number().nullable(),
    frameExtractionMs: z.number().nullable(),
    spritesheetBuildMs: z.number().nullable(),
    totalMs: z.number().nullable(),
  }),
  frameCount: z.number().nullable(),
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
})

export type Generation = z.infer<typeof generationSchema>
export type GenerationStatus = Generation['status']

export const manifestSchema = z.object({
  frameCount: z.number().int().positive(),
  frameWidth: z.number().int().positive(),
  frameHeight: z.number().int().positive(),
  fps: z.number().positive(),
  loop: z.boolean(),
  frames: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      x: z.number().int().nonnegative(),
      y: z.number().int().nonnegative(),
      w: z.number().int().positive(),
      h: z.number().int().positive(),
    }),
  ),
})

export type Manifest = z.infer<typeof manifestSchema>
export type SpriteFrame = Manifest['frames'][number]
