import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildManifest } from '../src/pipeline/artifacts';
import { computeLayout } from '../src/pipeline/media';
import { GenerationPipeline, type PipelineConfig } from '../src/pipeline/pipeline';
import { buildImagePrompt, buildVideoPrompt } from '../src/pipeline/prompts';
import { TimeoutError } from '../src/errors/app-error';
import { fakeMedia, fakeProviders } from './helpers/fakes';

const PROMPT = 'Change the shirt to blue and generate a walking animation loop.';

async function setup() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-test-'));
  const config: PipelineConfig = {
    assetId: 'character_walk_blue_shirt',
    inputImagePath: path.join(root, 'input_character_white_shirt.png'),
    outputDir: path.join(root, 'output'),
    workDir: path.join(root, 'work'),
    inputImageMaxEdge: 1024,
    videoDurationSeconds: 5,
    fps: 30,
    frameWidth: 256,
    frameHeight: 256,
    columns: 15,
    timeouts: { imageMs: 1000, videoMs: 1000, frameExtractionMs: 1000, spritesheetMs: 1000 },
    costEstimateUsd: 2.7,
  };
  return { root, config };
}

describe('GenerationPipeline', () => {
  it('writes every contract file and a valid manifest + log', async () => {
    const { config } = await setup();
    const pipeline = new GenerationPipeline(fakeProviders(), fakeMedia(150), config);
    const stages: string[] = [];

    const result = await pipeline.run('job-1', PROMPT, { onStage: (s) => void stages.push(s) });

    expect(stages).toEqual([
      'EDITING_IMAGE',
      'GENERATING_VIDEO',
      'EXTRACTING_FRAMES',
      'BUILDING_SPRITESHEET',
    ]);
    expect(result.frameCount).toBe(150);
    const files = (await fs.readdir(config.outputDir)).sort();
    expect(files).toEqual([
      'edited_base_image.png',
      'generation-log.json',
      'manifest.json',
      'source_video.mp4',
      'spritesheet.png',
    ]);

    const manifest = JSON.parse(
      await fs.readFile(path.join(config.outputDir, 'manifest.json'), 'utf8'),
    );
    expect(manifest).toMatchObject({
      assetId: 'character_walk_blue_shirt',
      frameCount: 150,
      fps: 30,
      loop: true,
      spritesheet: 'spritesheet.png',
      sourceVideo: 'source_video.mp4',
      editedBaseImage: 'edited_base_image.png',
      provider: { name: 'openai', model: 'gpt-image-2', usedRealApi: true },
      validation: { hasConsistentFrameSize: true, hasValidFrameCount: true, hasPlayableLoop: true },
    });
    expect(manifest.frames).toHaveLength(manifest.frameCount);
    expect(manifest.editPrompt).toContain('blue');

    const log = JSON.parse(
      await fs.readFile(path.join(config.outputDir, 'generation-log.json'), 'utf8'),
    );
    expect(
      log.providerCalls.map((c: { type: string; success: boolean }) => [c.type, c.success]),
    ).toEqual([
      ['image', true],
      ['video', true],
    ]);
    expect(JSON.stringify(log)).not.toMatch(/sk-|api[_-]?key/i);
  });

  it('records timings per step', async () => {
    const { config } = await setup();
    const pipeline = new GenerationPipeline(fakeProviders(), fakeMedia(), config);
    const keys: string[] = [];
    await pipeline.run('job-2', PROMPT, { onTiming: (k) => void keys.push(k) });
    expect(keys).toEqual([
      'imageGenerationMs',
      'videoGenerationMs',
      'frameExtractionMs',
      'spritesheetBuildMs',
    ]);
  });

  it('keeps the previous output and records a failed call when the video step fails', async () => {
    const { config } = await setup();
    await fs.mkdir(config.outputDir, { recursive: true });
    await fs.writeFile(path.join(config.outputDir, 'manifest.json'), '{"previous":true}');
    const calls: { type: string; success: boolean }[] = [];
    const providers = fakeProviders({
      video: {
        provider: 'fal',
        model: 'm',
        generate: async () => {
          throw new Error('fal exploded');
        },
      },
    });

    await expect(
      new GenerationPipeline(providers, fakeMedia(), config).run('job-3', PROMPT, {
        onProviderCall: (c) => void calls.push(c),
      }),
    ).rejects.toThrow('fal exploded');

    expect(calls.map((c) => [c.type, c.success])).toEqual([
      ['image', true],
      ['video', false],
    ]);
    expect(await fs.readFile(path.join(config.outputDir, 'manifest.json'), 'utf8')).toBe(
      '{"previous":true}',
    );
  });

  it('times out a slow provider with a TimeoutError', async () => {
    const { config } = await setup();
    config.timeouts.imageMs = 20;
    const providers = fakeProviders({
      image: {
        provider: 'openai',
        model: 'm',
        edit: () => new Promise(() => undefined),
      },
    });
    await expect(
      new GenerationPipeline(providers, fakeMedia(), config).run('job-4', PROMPT),
    ).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe('computeLayout / buildManifest', () => {
  it('lays 150 frames of 256px out in a 15x10 grid', () => {
    const layout = computeLayout(150, 15, 256, 256);
    expect(layout).toMatchObject({ columns: 15, rows: 10, width: 3840, height: 2560 });
    expect(layout.frames[0]).toEqual({ index: 0, x: 0, y: 0, w: 256, h: 256 });
    expect(layout.frames[16]).toEqual({ index: 16, x: 256, y: 256, w: 256, h: 256 });
    expect(
      layout.frames.every((f) => f.x + f.w <= layout.width && f.y + f.h <= layout.height),
    ).toBe(true);
  });

  it('uses a single row for fewer frames than columns', () => {
    expect(computeLayout(8, 15, 256, 256)).toMatchObject({ columns: 8, rows: 1, width: 2048 });
  });

  it('flags a single-frame sheet as not playable', () => {
    const manifest = buildManifest({
      assetId: 'a',
      sourceImage: 'in.png',
      editPrompt: 'blue',
      fps: 30,
      layout: computeLayout(1, 15, 256, 256),
      frameWidth: 256,
      frameHeight: 256,
      provider: { name: 'openai', model: 'gpt-image-2' },
    });
    expect(manifest.validation.hasValidFrameCount).toBe(false);
    expect(manifest.validation.hasPlayableLoop).toBe(false);
  });
});

describe('prompts', () => {
  it('keeps the user prompt in both provider prompts', () => {
    expect(buildImagePrompt(` ${PROMPT} `)).toContain(PROMPT);
    expect(buildVideoPrompt(PROMPT)).toContain(PROMPT);
    expect(buildVideoPrompt(PROMPT)).toMatch(/loop/i);
  });
});
