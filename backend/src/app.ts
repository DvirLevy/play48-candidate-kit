import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import type { ApiModule } from './modules';
import { logger } from './utils/logger';

export interface AppOptions {
  modules: ApiModule[];
  corsOrigins: string[];
  outputDir: string;
}

export function createApp({ modules, corsOrigins, outputDir }: AppOptions): Express {
  const app = express();

  app.disable('x-powered-by');
  // Files in /output are loaded by the frontend from another origin
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: corsOrigins }));
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req: (req) => ({ method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  // Generated files (latest successful run). Never cache: the same names are reused.
  app.use(
    '/output',
    express.static(outputDir, {
      index: false,
      dotfiles: 'ignore',
      setHeaders: (res) => res.setHeader('Cache-Control', 'no-store'),
    }),
  );

  // Swagger UI + raw spec
  app.get('/docs.json', (req, res) => {
    res.json(buildOpenApiDocument(`${req.protocol}://${req.get('host')}`));
  });
  app.use(
    '/docs',
    swaggerUi.serve,
    (req: express.Request, res: express.Response, next: express.NextFunction) =>
      swaggerUi.setup(buildOpenApiDocument(`${req.protocol}://${req.get('host')}`))(req, res, next),
  );

  for (const { basePath, router } of modules) {
    app.use(basePath, router);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
