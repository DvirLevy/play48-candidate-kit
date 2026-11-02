import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

const positiveInt = z.coerce.number().int().positive();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: positiveInt.default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_IMAGE_MODEL: z.string().min(1).default('gpt-image-2'),
  FAL_KEY: z.string().min(1, 'FAL_KEY is required'),
  FAL_VIDEO_MODEL: z.string().min(1).default('bytedance/seedance-2.5/image-to-video'),
  VIDEO_RESOLUTION: z.enum(['480p', '720p', '1080p']).default('480p'),
  // fal "draft" mode: faster 480p preview generation
  VIDEO_DRAFT: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  IMAGE_GENERATION_TIMEOUT_MS: positiveInt.default(120_000),
  VIDEO_GENERATION_TIMEOUT_MS: positiveInt.default(600_000),
  FRAME_EXTRACTION_TIMEOUT_MS: positiveInt.default(120_000),
  SPRITESHEET_BUILD_TIMEOUT_MS: positiveInt.default(60_000),

  VIDEO_DURATION_SECONDS: z.coerce.number().int().min(4).max(30).default(5),
  SPRITE_FPS: positiveInt.max(60).default(30),
  FRAME_WIDTH: positiveInt.default(256),
  FRAME_HEIGHT: positiveInt.default(256),
  SPRITESHEET_COLUMNS: positiveInt.default(15),
  INPUT_IMAGE_MAX_EDGE: positiveInt.default(1024),

  INPUT_IMAGE_PATH: z.string().default('../assets/input_character_white_shirt.png'),
  OUTPUT_DIR: z.string().default('../output'),
  WORK_DIR: z.string().default('./.tmp'),
  ASSET_ID: z.string().min(1).default('character_walk_blue_shirt'),
  INITIAL_PROMPT: z
    .string()
    .min(1)
    .default('Change the shirt to blue and generate a walking animation loop.'),

  IMAGE_COST_ESTIMATE_USD: z.coerce.number().min(0).default(0.2),
  VIDEO_COST_ESTIMATE_USD: z.coerce.number().min(0).default(2.5),
});

export type Env = z.infer<typeof envSchema>;

const PATH_KEYS = ['INPUT_IMAGE_PATH', 'OUTPUT_DIR', 'WORK_DIR'] as const;

/** Validates a raw environment map and resolves file paths against the backend folder. */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration (.env):\n${issues}`);
  }
  const parsed = result.data;
  for (const key of PATH_KEYS) {
    parsed[key] = path.resolve(BACKEND_ROOT, parsed[key]);
  }
  return parsed;
}

dotenv.config({ path: path.join(BACKEND_ROOT, '.env'), quiet: true });

export const env: Env = parseEnv(process.env);
