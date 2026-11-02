import type { FieldError } from './validation';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: FieldError[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = () => new AppError(404, 'NOT_FOUND', 'Task not found');

export const validationFailed = (details: FieldError[]) =>
  new AppError(422, 'VALIDATION_ERROR', 'The request contains invalid fields', details);
