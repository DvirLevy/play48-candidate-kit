import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import type { Generation } from '../../generated/prisma/client';
import { GenerationStatus } from '../../generated/prisma/enums';

export interface GenerationRepository {
  create(prompt: string): Promise<Generation>;
  findById(id: string): Promise<Generation | null>;
  findLatestCompleted(): Promise<Generation | null>;
  update(id: string, data: Prisma.GenerationUpdateInput): Promise<Generation>;
  failUnfinished(reason: string): Promise<number>;
}

export class PrismaGenerationRepository implements GenerationRepository {
  constructor(private readonly db: PrismaClient) {}

  create(prompt: string): Promise<Generation> {
    return this.db.generation.create({ data: { prompt } });
  }

  findById(id: string): Promise<Generation | null> {
    return this.db.generation.findUnique({ where: { id } });
  }

  findLatestCompleted(): Promise<Generation | null> {
    return this.db.generation.findFirst({
      where: { status: GenerationStatus.COMPLETED },
      orderBy: { completedAt: 'desc' },
    });
  }

  update(id: string, data: Prisma.GenerationUpdateInput): Promise<Generation> {
    return this.db.generation.update({ where: { id }, data });
  }

  /** Marks jobs left in a running state (e.g. after a crash) as failed. */
  async failUnfinished(reason: string): Promise<number> {
    const result = await this.db.generation.updateMany({
      where: { status: { notIn: [GenerationStatus.COMPLETED, GenerationStatus.FAILED] } },
      data: { status: GenerationStatus.FAILED, errorMessage: reason, completedAt: new Date() },
    });
    return result.count;
  }
}
