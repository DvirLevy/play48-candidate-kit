import type { Request, Response } from 'express';
import { toGenerationResponse } from './generation.mapper';
import type { GenerationService } from './generation.service';

function baseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

export class GenerationController {
  constructor(private readonly service: GenerationService) {}

  create = async (req: Request, res: Response) => {
    const generation = await this.service.create((req.body as { prompt: string }).prompt);
    res
      .status(202)
      .location(`/generations/${generation.id}`)
      .json(toGenerationResponse(generation, baseUrl(req)));
  };

  getById = async (req: Request, res: Response) => {
    const generation = await this.service.getById(req.params.id as string);
    res.json(toGenerationResponse(generation, baseUrl(req)));
  };

  getLatest = async (req: Request, res: Response) => {
    const generation = await this.service.getLatestCompleted();
    res.json(toGenerationResponse(generation, baseUrl(req)));
  };
}
