import { Router } from 'express';
import { validate } from '../../middleware/validate';
import type { GenerationController } from './generation.controller';
import { createGenerationBodySchema, generationIdParamsSchema } from './generation.schema';

export function createGenerationRouter(controller: GenerationController): Router {
  const router = Router();
  router.post('/', validate({ body: createGenerationBodySchema }), controller.create);
  // Must be registered before "/:id"
  router.get('/latest', controller.getLatest);
  router.get('/:id', validate({ params: generationIdParamsSchema }), controller.getById);
  return router;
}
