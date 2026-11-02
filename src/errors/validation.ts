import type { z } from 'zod';

export type FieldErrorCode =
  'REQUIRED' | 'TOO_LONG' | 'INVALID_FORMAT' | 'INVALID_VALUE' | 'DATE_IN_PAST' | 'UNKNOWN_FIELD';

export interface FieldError {
  field: string;
  code: FieldErrorCode;
  message: string;
}

export function toFieldErrors(error: z.ZodError, input: unknown): FieldError[] {
  const body = (typeof input === 'object' && input !== null ? input : {}) as Record<
    string,
    unknown
  >;
  const errors: FieldError[] = [];

  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) {
        errors.push({
          field: key,
          code: 'UNKNOWN_FIELD',
          message: `${key} is not an allowed field`,
        });
      }
      continue;
    }

    if (issue.path.length === 0) {
      errors.push({
        field: 'body',
        code: 'INVALID_FORMAT',
        message: 'Request body must be a JSON object',
      });
      continue;
    }

    const field = issue.path.join('.');
    if (errors.some((e) => e.field === field)) continue;

    errors.push({ field, ...describe(issue, body[field] === undefined) });
  }

  return errors;
}

function describe(issue: z.core.$ZodIssue, missing: boolean): Omit<FieldError, 'field'> {
  if (missing) return { code: 'REQUIRED', message: 'Field is required' };

  switch (issue.code) {
    case 'too_small':
      return { code: 'REQUIRED', message: 'Field cannot be blank' };
    case 'too_big':
      return { code: 'TOO_LONG', message: `Must be ${issue.maximum} characters or fewer` };
    case 'invalid_value':
      return { code: 'INVALID_VALUE', message: 'Value is not one of the allowed options' };
    case 'custom':
      if (issue.params?.code === 'DATE_IN_PAST') {
        return { code: 'DATE_IN_PAST', message: 'Must be a future date and time' };
      }
      return { code: 'INVALID_VALUE', message: 'Value is not valid' };
    default:
      return { code: 'INVALID_FORMAT', message: 'Value is not in the expected format' };
  }
}
