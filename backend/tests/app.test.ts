import request from 'supertest';
import { buildOpenApiDocument } from '../src/docs/openapi';
import { buildTestApp } from './helpers/app';

describe('app wiring', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('allows the configured frontend origin via CORS', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('serves the OpenAPI document and Swagger UI', async () => {
    const { app } = buildTestApp();
    const json = await request(app).get('/docs.json');
    expect(json.status).toBe(200);
    expect(Object.keys(json.body.paths)).toEqual(
      expect.arrayContaining([
        '/health',
        '/generations',
        '/generations/{id}',
        '/generations/latest',
      ]),
    );
    const ui = await request(app).get('/docs/');
    expect(ui.status).toBe(200);
    expect(ui.text).toContain('swagger-ui');
  });

  it('derives the request schema from Zod', () => {
    const doc = buildOpenApiDocument('http://localhost:4000');
    expect(doc.components.schemas.CreateGenerationRequest).toMatchObject({
      properties: { prompt: { type: 'string', minLength: 3, maxLength: 500 } },
      required: ['prompt'],
    });
  });
});
