import fs from 'node:fs/promises';
import path from 'node:path';
import type { Providers } from '../providers';
import { timed, withTimeout } from '../utils/timeout';
import {
  buildGenerationLog,
  buildManifest,
  OUTPUT_FILES,
  type ProviderCallRecord,
  type ProviderCallType,
} from './artifacts';
import type { MediaProcessor } from './media';
import { buildImagePrompt, buildVideoPrompt } from './prompts';

export type PipelineStage =
  'EDITING_IMAGE' | 'GENERATING_VIDEO' | 'EXTRACTING_FRAMES' | 'BUILDING_SPRITESHEET';

export interface PipelineTimings {
  imageGenerationMs: number;
  videoGenerationMs: number;
  frameExtractionMs: number;
  spritesheetBuildMs: number;
}

export interface PipelineConfig {
  assetId: string;
  inputImagePath: string;
  outputDir: string;
  workDir: string;
  inputImageMaxEdge: number;
  videoDurationSeconds: number;
  fps: number;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  timeouts: {
    imageMs: number;
    videoMs: number;
    frameExtractionMs: number;
    spritesheetMs: number;
  };
  costEstimateUsd: number;
}

export interface PipelineHooks {
  onStage?(stage: PipelineStage): Promise<void> | void;
  onTiming?(key: keyof PipelineTimings, ms: number): Promise<void> | void;
  onProviderCall?(call: ProviderCallRecord): Promise<void> | void;
}

export interface PipelineResult {
  frameCount: number;
  timings: PipelineTimings;
  providerCalls: ProviderCallRecord[];
  artifacts: Record<string, string>;
}

export class GenerationPipeline {
  constructor(
    private readonly providers: Providers,
    private readonly media: MediaProcessor,
    private readonly config: PipelineConfig,
  ) {}

  async run(id: string, prompt: string, hooks: PipelineHooks = {}): Promise<PipelineResult> {
    const { config } = this;
    const startedAt = new Date();
    const jobDir = path.join(config.workDir, id);
    const providerCalls: ProviderCallRecord[] = [];
    const timings: PipelineTimings = {
      imageGenerationMs: 0,
      videoGenerationMs: 0,
      frameExtractionMs: 0,
      spritesheetBuildMs: 0,
    };

    const recordCall = async (
      type: ProviderCallType,
      provider: string,
      model: string,
      requestSummary: string,
      success: boolean,
      responseSummary: string,
    ) => {
      const call = {
        provider,
        model,
        type,
        timestamp: new Date().toISOString(),
        success,
        requestSummary,
        responseSummary,
      };
      providerCalls.push(call);
      await hooks.onProviderCall?.(call);
    };
    const recordTiming = async (key: keyof PipelineTimings, ms: number) => {
      timings[key] = ms;
      await hooks.onTiming?.(key, ms);
    };

    try {
      await fs.rm(jobDir, { recursive: true, force: true });
      await fs.mkdir(jobDir, { recursive: true });

      // 1. Image edit (the 11 MB source is downscaled first)
      await hooks.onStage?.('EDITING_IMAGE');
      const preparedInput = path.join(jobDir, 'input.png');
      await this.media.prepareInput(config.inputImagePath, preparedInput, config.inputImageMaxEdge);
      const { image } = this.providers;
      const imageRequest = `Edit input character: "${prompt}"`;
      const edited = await timed(() =>
        withTimeout('image-edit', config.timeouts.imageMs, (signal) =>
          image.edit({ imagePath: preparedInput, prompt: buildImagePrompt(prompt), signal }),
        ),
      ).catch(async (error: unknown) => {
        await recordCall(
          'image',
          image.provider,
          image.model,
          imageRequest,
          false,
          errorText(error),
        );
        throw error;
      });
      await recordCall(
        'image',
        image.provider,
        image.model,
        imageRequest,
        true,
        edited.result.summary,
      );
      await recordTiming('imageGenerationMs', edited.ms);
      const editedPath = path.join(jobDir, OUTPUT_FILES.editedBaseImage);
      await fs.writeFile(editedPath, edited.result.png);

      // 2. Video generation from the edited still
      await hooks.onStage?.('GENERATING_VIDEO');
      const { video } = this.providers;
      const videoRequest = `Animate edited image for ${config.videoDurationSeconds}s: "${prompt}"`;
      const clip = await timed(() =>
        withTimeout('video-generation', config.timeouts.videoMs, (signal) =>
          video.generate({
            image: edited.result.png,
            prompt: buildVideoPrompt(prompt),
            durationSeconds: config.videoDurationSeconds,
            signal,
          }),
        ),
      ).catch(async (error: unknown) => {
        await recordCall(
          'video',
          video.provider,
          video.model,
          videoRequest,
          false,
          errorText(error),
        );
        throw error;
      });
      await recordCall(
        'video',
        video.provider,
        video.model,
        videoRequest,
        true,
        clip.result.summary,
      );
      await recordTiming('videoGenerationMs', clip.ms);
      const videoPath = path.join(jobDir, OUTPUT_FILES.sourceVideo);
      await fs.writeFile(videoPath, clip.result.video);

      // 3. Extract frames from the video with FFmpeg (one video call, no per-frame AI calls)
      await hooks.onStage?.('EXTRACTING_FRAMES');
      const framesDir = path.join(jobDir, 'frames');
      const frames = await timed(() =>
        this.media.extractFrames(
          videoPath,
          framesDir,
          {
            fps: config.fps,
            width: config.frameWidth,
            height: config.frameHeight,
            maxFrames: config.fps * config.videoDurationSeconds,
          },
          config.timeouts.frameExtractionMs,
        ),
      );
      await recordTiming('frameExtractionMs', frames.ms);

      // 4. Pack the frames into a spritesheet
      await hooks.onStage?.('BUILDING_SPRITESHEET');
      const sheetPath = path.join(jobDir, OUTPUT_FILES.spritesheet);
      const sheet = await timed(() =>
        withTimeout('spritesheet-build', config.timeouts.spritesheetMs, () =>
          this.media.buildSpritesheet(
            frames.result,
            sheetPath,
            { width: config.frameWidth, height: config.frameHeight },
            config.columns,
          ),
        ),
      );
      await recordTiming('spritesheetBuildMs', sheet.ms);

      // 5. Contract files, then publish them to the output folder
      const manifest = buildManifest({
        assetId: config.assetId,
        sourceImage: path.basename(config.inputImagePath),
        editPrompt: prompt,
        fps: config.fps,
        layout: sheet.result,
        frameWidth: config.frameWidth,
        frameHeight: config.frameHeight,
        provider: { name: image.provider, model: image.model },
      });
      const log = buildGenerationLog({
        startedAt,
        completedAt: new Date(),
        inputImage: path.basename(config.inputImagePath),
        initialPrompt: prompt,
        providerCalls,
        errors: [],
        warnings: [],
        costEstimateUsd: config.costEstimateUsd,
      });
      await fs.writeFile(
        path.join(jobDir, OUTPUT_FILES.manifest),
        JSON.stringify(manifest, null, 2),
      );
      await fs.writeFile(
        path.join(jobDir, OUTPUT_FILES.generationLog),
        JSON.stringify(log, null, 2),
      );
      await this.publish(jobDir);

      return {
        frameCount: manifest.frameCount,
        timings,
        providerCalls,
        artifacts: { ...OUTPUT_FILES },
      };
    } finally {
      await fs.rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  /** Moves the finished files into the output folder so it always holds the latest full run. */
  private async publish(jobDir: string): Promise<void> {
    const { outputDir } = this.config;
    await fs.mkdir(outputDir, { recursive: true });
    for (const file of Object.values(OUTPUT_FILES)) {
      const staged = path.join(outputDir, `.${file}.tmp`);
      await fs.copyFile(path.join(jobDir, file), staged);
      await fs.rename(staged, path.join(outputDir, file));
    }
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
