import type { Logger } from 'pino';
import type { Generation } from '../../generated/prisma/client';
import { ConflictError, NotFoundError } from '../../errors/app-error';
import type { PipelineHooks, PipelineResult } from '../../pipeline/pipeline';
import { redactSecrets } from '../../utils/redact';
import type { GenerationRepository } from './generation.repository';

export interface PipelineRunner {
  run(id: string, prompt: string, hooks?: PipelineHooks): Promise<PipelineResult>;
}

/**
 * Creates generations and runs them in-process, one at a time
 * (/output only ever holds the latest result).
 */
export class GenerationService {
  private busy = false;

  constructor(
    private readonly repository: GenerationRepository,
    private readonly pipeline: PipelineRunner,
    private readonly log: Pick<Logger, 'info' | 'error'>,
  ) {}

  get isBusy(): boolean {
    return this.busy;
  }

  /** Persists the job and starts it in the background. Resolves as soon as the job is queued. */
  async create(prompt: string): Promise<Generation> {
    if (this.busy) {
      throw new ConflictError(
        'GENERATION_IN_PROGRESS',
        'A generation is already running. Wait for it to finish before submitting a new prompt.',
      );
    }
    this.busy = true;
    let generation: Generation;
    try {
      generation = await this.repository.create(prompt);
    } catch (error) {
      this.busy = false;
      throw error;
    }
    setImmediate(() => void this.execute(generation.id, prompt));
    return generation;
  }

  async getById(id: string): Promise<Generation> {
    const generation = await this.repository.findById(id);
    if (!generation) throw new NotFoundError(`Generation ${id} not found`);
    return generation;
  }

  async getLatestCompleted(): Promise<Generation> {
    const generation = await this.repository.findLatestCompleted();
    if (!generation) throw new NotFoundError('No completed generation yet');
    return generation;
  }

  /** Call once on startup: jobs from a previous process can never finish. */
  async recoverInterrupted(): Promise<void> {
    const count = await this.repository.failUnfinished('Interrupted by a server restart');
    if (count > 0) this.log.info({ count }, 'Marked interrupted generations as failed');
  }

  private async execute(id: string, prompt: string): Promise<void> {
    const startedAt = new Date();
    const providerCalls: PipelineResult['providerCalls'] = [];
    try {
      await this.repository.update(id, { startedAt });
      const result = await this.pipeline.run(id, prompt, {
        onStage: async (stage) => {
          await this.repository.update(id, { status: stage });
        },
        onTiming: async (key, ms) => {
          await this.repository.update(id, { [key]: ms });
        },
        onProviderCall: async (call) => {
          providerCalls.push(call);
          await this.repository.update(id, { providerCalls });
        },
      });
      const completedAt = new Date();
      await this.repository.update(id, {
        status: 'COMPLETED',
        frameCount: result.frameCount,
        artifacts: result.artifacts,
        providerCalls: result.providerCalls,
        completedAt,
        totalMs: completedAt.getTime() - startedAt.getTime(),
      });
      this.log.info({ id, frameCount: result.frameCount }, 'Generation completed');
    } catch (error) {
      const message = redactSecrets(error instanceof Error ? error.message : String(error));
      this.log.error({ id, message }, 'Generation failed');
      await this.repository
        .update(id, {
          status: 'FAILED',
          errorMessage: message,
          completedAt: new Date(),
          totalMs: Date.now() - startedAt.getTime(),
        })
        .catch((updateError: unknown) =>
          this.log.error({ id, updateError }, 'Could not persist failed generation'),
        );
    } finally {
      this.busy = false;
    }
  }
}
