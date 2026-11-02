import type { Env } from '../config/env';
import { FalVideoProvider } from './fal-video.provider';
import { OpenAiImageProvider } from './openai-image.provider';
import type { Providers } from './types';

/** Builds the real provider implementations. Swap members to change vendors. */
export function createProviders(env: Env): Providers {
  return {
    image: new OpenAiImageProvider(env.OPENAI_API_KEY, env.OPENAI_IMAGE_MODEL),
    video: new FalVideoProvider(
      env.FAL_KEY,
      env.FAL_VIDEO_MODEL,
      env.VIDEO_RESOLUTION,
      env.VIDEO_DRAFT,
    ),
  };
}

export * from './types';
