import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../errors/app-error';

interface Schemas {
  body?: ZodType;
  params?: ZodType;
}

/** Validates the request with Zod and replaces body/params with the parsed values. */
export function validate(schemas: Schemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const issues: { location: string; path: string; message: string }[] = [];

    for (const location of ['body', 'params'] as const) {
      const schema = schemas[location];
      if (!schema) continue;
      const result = schema.safeParse(req[location]);
      if (result.success) {
        if (location === 'body') req.body = result.data;
        else Object.assign(req.params, result.data);
      } else {
        for (const issue of result.error.issues) {
          issues.push({ location, path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    if (issues.length > 0) {
      next(new ValidationError(issues));
      return;
    }
    next();
  };
}
