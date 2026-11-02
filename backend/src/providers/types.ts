export interface ImageEditRequest {
  /** Path to the (already downscaled) source image */
  imagePath: string;
  prompt: string;
  signal?: AbortSignal;
}

export interface ImageEditResult {
  png: Buffer;
  summary: string;
}

/** Edits a still image according to a text prompt. */
export interface ImageEditProvider {
  readonly provider: string;
  readonly model: string;
  edit(request: ImageEditRequest): Promise<ImageEditResult>;
}

export interface VideoGenerationRequest {
  /** The edited still image, used as the first frame */
  image: Buffer;
  prompt: string;
  durationSeconds: number;
  signal?: AbortSignal;
}

export interface VideoGenerationResult {
  video: Buffer;
  summary: string;
}

/** Animates a still image into a short video clip. */
export interface VideoGenerationProvider {
  readonly provider: string;
  readonly model: string;
  generate(request: VideoGenerationRequest): Promise<VideoGenerationResult>;
}

export interface Providers {
  image: ImageEditProvider;
  video: VideoGenerationProvider;
}
