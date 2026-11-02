import { bootstrap } from './container';
import { env } from './config/env';
import { prisma } from './db/prisma';
import { logger } from './utils/logger';

async function main() {
  const { app, generation } = bootstrap();
  await generation.recoverInterrupted();

  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (docs at /docs)`);
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start');
  process.exit(1);
});
