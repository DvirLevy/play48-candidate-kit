import { createFalClient, type FalClient } from '@fal-ai/client';
import { ProviderError } from '../errors/app-error';
import type {
  VideoGenerationProvider,
  VideoGenerationRequest,
  VideoGenerationResult,
} from './types';

interface FalVideoOutput {
  video?: { url?: string };
}

export class FalVideoProvider implements VideoGenerationProvider {
  readonly provider = 'fal';
  private readonly client: FalClient;

  constructor(
    credentials: string,
    readonly model: string,
    private readonly resolution: string,
    private readonly draft = false,
  ) {
    this.client = createFalClient({ credentials });
  }

  async generate({
    image,
    prompt,
    durationSeconds,
    signal,
  }: VideoGenerationRequest): Promise<VideoGenerationResult> {
    try {
      const imageUrl = await this.client.storage.upload(
        new Blob([new Uint8Array(image)], { type: 'image/png' }),
      );
      const result = await this.client.subscribe(this.model, {
        input: {
          image_url: imageUrl,
          prompt,
          duration: String(durationSeconds),
          resolution: this.resolution,
          aspect_ratio: 'auto',
          generate_audio: false,
          ...(this.draft ? { draft: true } : {}),
        },
        abortSignal: signal,
      });
      const videoUrl = (result.data as FalVideoOutput).video?.url;
      if (!videoUrl) {
        throw new Error('response contained no video url');
      }
      const download = await fetch(videoUrl, { signal });
      if (!download.ok) {
        throw new Error(`video download failed with status ${download.status}`);
      }
      const video = Buffer.from(await download.arrayBuffer());
      return { video, summary: `Returned ${durationSeconds}s mp4 (${video.length} bytes).` };
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ProviderError('fal', describeError(error));
    }
  }
}

/** fal's ApiError often has an empty message; the useful part is in `body`. */
function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const { status, body } = error as Error & { status?: number; body?: unknown };
  const detail = body ? JSON.stringify(body).slice(0, 500) : '';
  return [error.message, status ? `status ${status}` : '', detail].filter(Boolean).join(' - ');
}
