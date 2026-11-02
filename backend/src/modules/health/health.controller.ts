import type { Request, Response } from 'express';
import type { HealthService } from './health.service';

export class HealthController {
  constructor(private readonly service: HealthService) {}

  liveness = (_req: Request, res: Response) => {
    res.json(this.service.liveness());
  };

  readiness = async (_req: Request, res: Response) => {
    const report = await this.service.readiness();
    res.status(report.status === 'ok' ? 200 : 503).json(report);
  };
}
