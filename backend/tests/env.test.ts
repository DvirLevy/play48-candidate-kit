import path from 'node:path';
import { parseEnv } from '../src/config/env';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5433/db',
  OPENAI_API_KEY: 'sk-x',
  FAL_KEY: 'fal-x',
};

describe('parseEnv', () => {
  it('applies defaults and coerces numbers', () => {
    const env = parseEnv({ ...valid, PORT: '5000', SPRITE_FPS: '24' });
    expect(env.PORT).toBe(5000);
    expect(env.SPRITE_FPS).toBe(24);
    expect(env.OPENAI_IMAGE_MODEL).toBe('gpt-image-2');
    expect(env.FAL_VIDEO_MODEL).toBe('bytedance/seedance-2.5/image-to-video');
    expect(env.VIDEO_GENERATION_TIMEOUT_MS).toBe(600_000);
  });

  it('splits CORS origins and resolves paths to absolute', () => {
    const env = parseEnv({ ...valid, CORS_ORIGIN: 'http://a.com, http://b.com' });
    expect(env.CORS_ORIGIN).toEqual(['http://a.com', 'http://b.com']);
    expect(path.isAbsolute(env.OUTPUT_DIR)).toBe(true);
    expect(env.OUTPUT_DIR.endsWith(path.join('candidate-kit', 'output'))).toBe(true);
  });

  it('lists every invalid variable', () => {
    expect(() => parseEnv({ PORT: 'abc' })).toThrow(
      /DATABASE_URL[\s\S]*OPENAI_API_KEY[\s\S]*FAL_KEY|PORT/,
    );
  });
});
