import fs from 'node:fs';
import OpenAI, { toFile } from 'openai';
import { ProviderError } from '../errors/app-error';
import type { ImageEditProvider, ImageEditRequest, ImageEditResult } from './types';

export class OpenAiImageProvider implements ImageEditProvider {
  readonly provider = 'openai';
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey, maxRetries: 1 });
  }

  async edit({ imagePath, prompt, signal }: ImageEditRequest): Promise<ImageEditResult> {
    try {
      const image = await toFile(fs.createReadStream(imagePath), 'input.png', {
        type: 'image/png',
      });
      const response = await this.client.images.edit(
        { model: this.model, image, prompt, size: 'auto', n: 1 },
        { signal },
      );
      const b64 = response.data?.[0]?.b64_json;
      if (!b64) {
        throw new Error('response contained no image data');
      }
      const png = Buffer.from(b64, 'base64');
      return { png, summary: `Returned edited image (${png.length} bytes).` };
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ProviderError('openai', error instanceof Error ? error.message : String(error));
    }
  }
}
