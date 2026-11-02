import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  // Never log credentials
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.apiKey', '*.FAL_KEY'],
});
