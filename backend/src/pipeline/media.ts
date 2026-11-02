import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);

export interface FrameSpec {
  fps: number;
  width: number;
  height: number;
  maxFrames: number;
}

export interface SpritesheetLayout {
  columns: number;
  rows: number;
  width: number;
  height: number;
  frames: { index: number; x: number; y: number; w: number; h: number }[];
}

/** Local media operations. The frames themselves always come from the generated video. */
export interface MediaProcessor {
  prepareInput(source: string, target: string, maxEdge: number): Promise<void>;
  extractFrames(
    videoPath: string,
    framesDir: string,
    spec: FrameSpec,
    timeoutMs: number,
  ): Promise<string[]>;
  buildSpritesheet(
    framePaths: string[],
    target: string,
    frame: { width: number; height: number },
    columns: number,
  ): Promise<SpritesheetLayout>;
}

/** Pure grid math, shared by the builder and the manifest. */
export function computeLayout(
  frameCount: number,
  columns: number,
  frameWidth: number,
  frameHeight: number,
): SpritesheetLayout {
  const cols = Math.min(columns, Math.max(frameCount, 1));
  const rows = Math.ceil(frameCount / cols);
  const frames = Array.from({ length: frameCount }, (_, index) => ({
    index,
    x: (index % cols) * frameWidth,
    y: Math.floor(index / cols) * frameHeight,
    w: frameWidth,
    h: frameHeight,
  }));
  return { columns: cols, rows, width: cols * frameWidth, height: rows * frameHeight, frames };
}

export class FfmpegMediaProcessor implements MediaProcessor {
  async prepareInput(source: string, target: string, maxEdge: number): Promise<void> {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await sharp(source)
      .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
      .png()
      .toFile(target);
  }

  async extractFrames(
    videoPath: string,
    framesDir: string,
    { fps, width, height, maxFrames }: FrameSpec,
    timeoutMs: number,
  ): Promise<string[]> {
    if (!ffmpegPath) {
      throw new Error('ffmpeg binary not found (ffmpeg-static)');
    }
    await fs.rm(framesDir, { recursive: true, force: true });
    await fs.mkdir(framesDir, { recursive: true });
    const filter = [
      `fps=${fps}`,
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black@0`,
      'format=rgba',
    ].join(',');
    await execFileAsync(
      ffmpegPath,
      [
        '-y',
        '-loglevel',
        'error',
        '-i',
        videoPath,
        '-vf',
        filter,
        '-frames:v',
        String(maxFrames),
        path.join(framesDir, 'frame_%04d.png'),
      ],
      { timeout: timeoutMs },
    );
    const files = (await fs.readdir(framesDir)).filter((f) => f.endsWith('.png')).sort();
    if (files.length === 0) {
      throw new Error('ffmpeg extracted no frames from the video');
    }
    return files.map((f) => path.join(framesDir, f));
  }

  async buildSpritesheet(
    framePaths: string[],
    target: string,
    { width, height }: { width: number; height: number },
    columns: number,
  ): Promise<SpritesheetLayout> {
    const layout = computeLayout(framePaths.length, columns, width, height);
    const composites = await Promise.all(
      framePaths.map(async (framePath, index) => {
        const slot = layout.frames[index]!;
        return { input: await fs.readFile(framePath), left: slot.x, top: slot.y };
      }),
    );
    await fs.mkdir(path.dirname(target), { recursive: true });
    await sharp({
      create: {
        width: layout.width,
        height: layout.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composites)
      .png()
      .toFile(target);
    return layout;
  }
}
