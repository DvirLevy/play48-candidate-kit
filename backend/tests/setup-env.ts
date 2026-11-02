// Runs before every test file: deterministic env, never real keys
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5433/test',
  OPENAI_API_KEY: 'sk-test-key-not-real',
  FAL_KEY: 'fal-test-key-not-real',
  CORS_ORIGIN: 'http://localhost:5173',
});
