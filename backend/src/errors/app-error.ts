export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown, message = 'Request validation failed') {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(409, code, message);
  }
}

export class TimeoutError extends AppError {
  constructor(step: string, ms: number) {
    super(504, 'STEP_TIMEOUT', `Step "${step}" timed out after ${ms}ms`);
  }
}

export class ProviderError extends AppError {
  constructor(provider: string, message: string) {
    super(502, 'PROVIDER_ERROR', `${provider}: ${message}`);
  }
}
