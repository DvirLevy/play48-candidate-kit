import request from 'supertest';
import type { PipelineRunner } from '../src/modules/generation/generation.service';
import { buildTestApp, wait, zeroTimings } from './helpers/app';

const PROMPT = 'Change the shirt to blue and generate a walking animation loop.';

function controllablePipeline() {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const pipeline: PipelineRunner = {
    run: async (_id, _prompt, hooks) => {
      await hooks?.onStage?.('EDITING_IMAGE');
      await gate;
      await hooks?.onTiming?.('imageGenerationMs', 5);
      return { frameCount: 150, timings: zeroTimings, providerCalls: [], artifacts: {} };
    },
  };
  return { pipeline, release };
}

describe('POST /generations', () => {
  it('returns 202 with a job id and runs the job in the background', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/generations').send({ prompt: PROMPT });

    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({ status: 'QUEUED', prompt: PROMPT, finished: false });
    expect(res.headers.location).toBe(`/generations/${res.body.id}`);

    await wait();
    const polled = await request(app).get(`/generations/${res.body.id}`);
    expect(polled.body).toMatchObject({ status: 'COMPLETED', finished: true, frameCount: 6 });
    expect(Object.keys(polled.body.artifacts)).toEqual(
      expect.arrayContaining(['spritesheet', 'manifest', 'sourceVideo', 'editedBaseImage']),
    );
    expect(polled.body.artifacts.spritesheet).toMatch(/\/output\/spritesheet\.png\?v=/);
  });

  it.each([
    ['missing prompt', {}],
    ['too short', { prompt: 'a' }],
    ['not a string', { prompt: 42 }],
    ['too long', { prompt: 'x'.repeat(501) }],
  ])('rejects %s with a 400 validation error', async (_name, body) => {
    const { app } = buildTestApp();
    const res = await request(app).post('/generations').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0]).toMatchObject({ location: 'body' });
  });

  it('rejects malformed JSON with 400', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/generations')
      .set('Content-Type', 'application/json')
      .send('{"prompt":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('returns 409 while another generation is running, then accepts again', async () => {
    const { pipeline, release } = controllablePipeline();
    const { app } = buildTestApp({ pipeline });

    const first = await request(app).post('/generations').send({ prompt: PROMPT });
    expect(first.status).toBe(202);
    await wait();

    const running = await request(app).get(`/generations/${first.body.id}`);
    expect(running.body).toMatchObject({ status: 'EDITING_IMAGE', finished: false });

    const second = await request(app).post('/generations').send({ prompt: 'make it red' });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('GENERATION_IN_PROGRESS');

    release();
    await wait();
    const third = await request(app).post('/generations').send({ prompt: 'make it red' });
    expect(third.status).toBe(202);
  });

  it('marks the job FAILED and redacts secrets when the pipeline throws', async () => {
    const { app } = buildTestApp({
      pipeline: {
        run: async () => {
          throw new Error('Incorrect API key provided: sk-proj-abcdef1234567890');
        },
      },
    });
    const created = await request(app).post('/generations').send({ prompt: PROMPT });
    await wait();

    const res = await request(app).get(`/generations/${created.body.id}`);
    expect(res.body).toMatchObject({ status: 'FAILED', finished: true, artifacts: null });
    expect(res.body.errorMessage).toContain('[redacted]');
    expect(res.body.errorMessage).not.toContain('sk-proj-abcdef');
  });
});

describe('GET /generations/:id', () => {
  it('returns 404 for an unknown id', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/generations/3f1c2a3e-8c5d-4b7e-9a11-5d6f7a8b9c0d');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for an invalid id', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/generations/not-a-uuid');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /generations/latest', () => {
  it('returns 404 when nothing has completed', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/generations/latest');
    expect(res.status).toBe(404);
  });

  it('returns the most recent completed generation', async () => {
    const { app } = buildTestApp();
    const created = await request(app).post('/generations').send({ prompt: PROMPT });
    await wait();
    const res = await request(app).get('/generations/latest');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.status).toBe('COMPLETED');
  });
});

describe('startup recovery', () => {
  it('fails jobs left running by a previous process', async () => {
    const { app, generation, repository } = buildTestApp();
    const row = await repository.create(PROMPT);
    await repository.update(row.id, { status: 'GENERATING_VIDEO' });

    await generation.recoverInterrupted();

    const res = await request(app).get(`/generations/${row.id}`);
    expect(res.body).toMatchObject({ status: 'FAILED' });
    expect(res.body.errorMessage).toMatch(/restart/);
  });
});
