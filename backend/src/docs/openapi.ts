import { z, type ZodType } from 'zod';
import { livenessResponseSchema, readinessResponseSchema } from '../modules/health/health.schema';
import {
  createGenerationBodySchema,
  errorResponseSchema,
  generationResponseSchema,
} from '../modules/generation/generation.schema';

const schemaOf = (schema: ZodType) => z.toJSONSchema(schema, { target: 'openapi-3.0' });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (name: string) => ({ 'application/json': { schema: ref(name) } });
const error = (description: string) => ({ description, content: json('ErrorResponse') });

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

/** OpenAPI 3 document served by Swagger UI. Schemas are derived from the Zod schemas. */
export function buildOpenApiDocument(serverUrl: string) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Sprite Editing Pipeline API',
      version: '1.0.0',
      description:
        'Turns a character image plus a text prompt into a sprite animation: ' +
        'image edit (OpenAI) -> video (fal) -> FFmpeg frames -> spritesheet. ' +
        'Submit a prompt with `POST /generations`, then poll `GET /generations/{id}` ' +
        'every ~2 seconds until `finished` is true. The newest successful result is served from `/output`.',
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: 'Health', description: 'Service status' },
      { name: 'Generations', description: 'Create and track sprite generations' },
      { name: 'Output', description: 'Generated files' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Liveness probe',
          responses: { '200': { description: 'Service is up', content: json('LivenessResponse') } },
        },
      },
      '/health/ready': {
        get: {
          tags: ['Health'],
          summary: 'Readiness probe (checks the database)',
          responses: {
            '200': { description: 'Ready', content: json('ReadinessResponse') },
            '503': { description: 'Database unreachable', content: json('ReadinessResponse') },
          },
        },
      },
      '/generations': {
        post: {
          tags: ['Generations'],
          summary: 'Start a generation',
          description:
            'Queues a new generation and returns immediately. Only one generation runs at a time.',
          requestBody: { required: true, content: json('CreateGenerationRequest') },
          responses: {
            '202': { description: 'Accepted', content: json('Generation') },
            '400': error('Validation error'),
            '409': error('A generation is already running (GENERATION_IN_PROGRESS)'),
          },
        },
      },
      '/generations/latest': {
        get: {
          tags: ['Generations'],
          summary: 'Latest completed generation',
          description: 'Use on page load to show the most recent result.',
          responses: {
            '200': { description: 'Latest completed generation', content: json('Generation') },
            '404': error('Nothing generated yet'),
          },
        },
      },
      '/generations/{id}': {
        get: {
          tags: ['Generations'],
          summary: 'Get generation status',
          description: 'Poll until `finished` is true. `artifacts` is set once COMPLETED.',
          parameters: [idParam],
          responses: {
            '200': { description: 'Generation', content: json('Generation') },
            '400': error('Invalid id'),
            '404': error('Not found'),
          },
        },
      },
      '/output/{file}': {
        get: {
          tags: ['Output'],
          summary: 'Download a generated file',
          parameters: [
            {
              name: 'file',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                enum: [
                  'spritesheet.png',
                  'manifest.json',
                  'generation-log.json',
                  'edited_base_image.png',
                  'source_video.mp4',
                ],
              },
            },
          ],
          responses: {
            '200': { description: 'File contents' },
            '404': error('File not generated yet'),
          },
        },
      },
    },
    components: {
      schemas: {
        LivenessResponse: schemaOf(livenessResponseSchema),
        ReadinessResponse: schemaOf(readinessResponseSchema),
        CreateGenerationRequest: schemaOf(createGenerationBodySchema),
        Generation: schemaOf(generationResponseSchema),
        ErrorResponse: schemaOf(errorResponseSchema),
      },
    },
  };
}
