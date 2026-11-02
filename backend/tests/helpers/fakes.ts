import fs from 'node:fs/promises';
import type { Generation } from '../../src/generated/prisma/client';
import type { GenerationRepository } from '../../src/modules/generation/generation.repository';
import type { Providers } from '../../src/providers';
import type { MediaProcessor } from '../../src/pipeline/media';
import { computeLayout } from '../../src/pipeline/media';

export function makeGeneration(overrides: Partial<Generation> = {}): Generation {
  return {
    id: '3f1c2a3e-8c5d-4b7e-9a11-5d6f7a8b9c0d',
    prompt: 'Change the shirt to blue and generate a walking animation loop.',
    status: 'QUEUED',
    errorMessage: null,
    imageGenerationMs: null,
    videoGenerationMs: null,
    frameExtractionMs: null,
    spritesheetBuildMs: null,
    totalMs: null,
    artifacts: null,
    providerCalls: null,
    frameCount: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    ...overrides,
  } as Generation;
}

/** In-memory repository mirroring the Prisma one. */
export class InMemoryGenerationRepository implements GenerationRepository {
  readonly rows = new Map<string, Generation>();
  private counter = 0;

  async create(prompt: string) {
    const id = `00000000-0000-4000-8000-${String(++this.counter).padStart(12, '0')}`;
    const row = makeGeneration({ id, prompt });
    this.rows.set(id, row);
    return row;
  }
  async findById(id: string) {
    return this.rows.get(id) ?? null;
  }
  async findLatestCompleted() {
    return [...this.rows.values()].reverse().find((r) => r.status === 'COMPLETED') ?? null;
  }
  async update(id: string, data: Record<string, unknown>) {
    const row = { ...this.rows.get(id)!, ...data } as Generation;
    this.rows.set(id, row);
    return row;
  }
  async failUnfinished(reason: string) {
    let count = 0;
    for (const [id, row] of this.rows) {
      if (row.status !== 'COMPLETED' && row.status !== 'FAILED') {
        this.rows.set(id, { ...row, status: 'FAILED', errorMessage: reason });
        count++;
      }
    }
    return count;
  }
}

export function fakeProviders(overrides: Partial<Providers> = {}): Providers {
  return {
    image: {
      provider: 'openai',
      model: 'gpt-image-2',
      edit: async () => ({ png: Buffer.from('png-bytes'), summary: 'Returned edited image.' }),
    },
    video: {
      provider: 'fal',
      model: 'bytedance/seedance-2.5/image-to-video',
      generate: async () => ({ video: Buffer.from('mp4-bytes'), summary: 'Returned 5s mp4.' }),
    },
    ...overrides,
  };
}

export function fakeMedia(frameCount = 6): MediaProcessor {
  return {
    prepareInput: async () => undefined,
    extractFrames: async () => Array.from({ length: frameCount }, (_, i) => `frame_${i}.png`),
    buildSpritesheet: async (frames, target, size, columns) => {
      await fs.writeFile(target, 'sheet');
      return computeLayout(frames.length, columns, size.width, size.height);
    },
  };
}
