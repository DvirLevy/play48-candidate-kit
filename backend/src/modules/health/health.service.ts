export interface DatabasePing {
  ping(): Promise<void>;
}

export class HealthService {
  constructor(
    private readonly database: DatabasePing,
    private readonly startedAt = Date.now(),
  ) {}

  liveness() {
    return {
      status: 'ok' as const,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  async readiness() {
    let database: 'up' | 'down' = 'up';
    try {
      await this.database.ping();
    } catch {
      database = 'down';
    }
    return {
      status: database === 'up' ? ('ok' as const) : ('degraded' as const),
      checks: { database },
      timestamp: new Date().toISOString(),
    };
  }
}
