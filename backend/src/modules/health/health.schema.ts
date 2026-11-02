import { z } from 'zod';

export const livenessResponseSchema = z.object({
  status: z.literal('ok'),
  uptimeSeconds: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
});

export const readinessResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  checks: z.object({ database: z.enum(['up', 'down']) }),
  timestamp: z.string().datetime(),
});
