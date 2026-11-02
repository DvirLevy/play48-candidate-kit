import request from 'supertest';
import { buildTestApp } from './helpers/app';

describe('GET /health', () => {
  it('returns liveness information', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });
});

describe('GET /health/ready', () => {
  it('is ok when the database answers', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', checks: { database: 'up' } });
  });

  it('returns 503 when the database is down', async () => {
    const { app } = buildTestApp({
      database: {
        ping: async () => {
          throw new Error('connection refused');
        },
      },
    });
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'degraded', checks: { database: 'down' } });
  });
});
