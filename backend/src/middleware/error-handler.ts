import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, NotFoundError } from '../errors/app-error';
import { logger } from '../utils/logger';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.path}`));
};

interface HttpLikeError extends Error {
  status?: number;
  type?: string;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // body-parser errors (malformed JSON, payload too large) carry an http status
  const httpError = err as HttpLikeError;
  if (httpError.status && httpError.status >= 400 && httpError.status < 500) {
    res.status(httpError.status).json({
      error: {
        code: httpError.type === 'entity.parse.failed' ? 'INVALID_JSON' : 'BAD_REQUEST',
        message:
          httpError.type === 'entity.parse.failed' ? 'Malformed JSON body' : httpError.message,
      },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
};
