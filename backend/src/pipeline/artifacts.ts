import type { SpritesheetLayout } from './media';

/** Output file names are fixed by OUTPUT_CONTRACT.md */
export const OUTPUT_FILES = {
  spritesheet: 'spritesheet.png',
  manifest: 'manifest.json',
  generationLog: 'generation-log.json',
  editedBaseImage: 'edited_base_image.png',
  sourceVideo: 'source_video.mp4',
} as const;

export type ProviderCallType = 'llm' | 'image' | 'video' | 'audio' | 'other';

// A type alias (not an interface) so it is assignable to Prisma's JSON input type
export type ProviderCallRecord = {
  provider: string;
  model: string;
  type: ProviderCallType;
  timestamp: string;
  success: boolean;
  requestSummary: string;
  responseSummary: string;
};

export interface ManifestInput {
  assetId: string;
  sourceImage: string;
  editPrompt: string;
  fps: number;
  layout: SpritesheetLayout;
  frameWidth: number;
  frameHeight: number;
  provider: { name: string; model: string };
}

export function buildManifest(input: ManifestInput) {
  const { layout } = input;
  const frameCount = layout.frames.length;
  return {
    assetId: input.assetId,
    sourceImage: input.sourceImage,
    editPrompt: input.editPrompt,
    frameCount,
    frameWidth: input.frameWidth,
    frameHeight: input.frameHeight,
    fps: input.fps,
    loop: true,
    spritesheet: OUTPUT_FILES.spritesheet,
    frames: layout.frames,
    editsApplied: [
      'image_edit_applied_from_prompt',
      'video_animation_generated',
      'frames_extracted_from_video',
    ],
    editedBaseImage: OUTPUT_FILES.editedBaseImage,
    sourceVideo: OUTPUT_FILES.sourceVideo,
    validation: {
      hasConsistentFrameSize: layout.frames.every(
        (f) => f.w === input.frameWidth && f.h === input.frameHeight,
      ),
      hasValidFrameCount: frameCount > 1,
      hasPlayableLoop: frameCount > 1 && input.fps > 0,
    },
    provider: { name: input.provider.name, model: input.provider.model, usedRealApi: true },
  };
}

export type Manifest = ReturnType<typeof buildManifest>;

export interface GenerationLogInput {
  startedAt: Date;
  completedAt: Date;
  inputImage: string;
  initialPrompt: string;
  providerCalls: ProviderCallRecord[];
  errors: string[];
  warnings: string[];
  costEstimateUsd: number;
}

export function buildGenerationLog(input: GenerationLogInput) {
  return {
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    inputImage: input.inputImage,
    initialPrompt: input.initialPrompt,
    providerCalls: input.providerCalls,
    errors: input.errors,
    warnings: input.warnings,
    costEstimateUsd: input.costEstimateUsd,
  };
}

export type GenerationLog = ReturnType<typeof buildGenerationLog>;
