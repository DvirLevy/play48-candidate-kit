/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/generated/**', '!src/server.ts'],
  clearMocks: true,
};
