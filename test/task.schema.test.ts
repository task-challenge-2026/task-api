import { createTaskSchema } from '../src/tasks/task.schema';
import { toFieldErrors } from '../src/errors/validation';

const inOneDay = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

const validTask = () => ({
  title: 'Review case bundle',
  description: 'Check exhibits before hearing',
  status: 'TODO',
  dueAt: inOneDay(),
});

function errorsFor(input: unknown) {
  const result = createTaskSchema.safeParse(input);
  if (result.success) return [];
  return toFieldErrors(result.error, input);
}

describe('createTaskSchema', () => {
  it('accepts a valid task', () => {
    expect(errorsFor(validTask())).toEqual([]);
  });

  it('accepts a task without a description', () => {
    const task: Record<string, unknown> = validTask();
    delete task.description;
    expect(errorsFor(task)).toEqual([]);
  });

  it('trims whitespace from the title', () => {
    const result = createTaskSchema.parse({ ...validTask(), title: '  Review  ' });
    expect(result.title).toBe('Review');
  });

  it.each([
    ['missing title', { title: undefined }, 'title', 'REQUIRED'],
    ['blank title', { title: '   ' }, 'title', 'REQUIRED'],
    ['title over 200 characters', { title: 'x'.repeat(201) }, 'title', 'TOO_LONG'],
    ['title of the wrong type', { title: 123 }, 'title', 'INVALID_FORMAT'],
    [
      'description over 2000 characters',
      { description: 'x'.repeat(2001) },
      'description',
      'TOO_LONG',
    ],
    ['missing status', { status: undefined }, 'status', 'REQUIRED'],
    ['unknown status', { status: 'CLOSED' }, 'status', 'INVALID_VALUE'],
    ['missing due date', { dueAt: undefined }, 'dueAt', 'REQUIRED'],
    ['due date not a date', { dueAt: 'tomorrow' }, 'dueAt', 'INVALID_FORMAT'],
    ['due date without time zone', { dueAt: '2030-01-01T09:00:00' }, 'dueAt', 'INVALID_FORMAT'],
    ['due date in the past', { dueAt: '2020-01-01T09:00:00Z' }, 'dueAt', 'DATE_IN_PAST'],
    ['unknown field', { priority: 'high' }, 'priority', 'UNKNOWN_FIELD'],
  ])('rejects %s', (_name, change, field, code) => {
    const errors = errorsFor({ ...validTask(), ...change });
    expect(errors).toEqual([expect.objectContaining({ field, code })]);
  });

  it('reports every invalid field at once', () => {
    const errors = errorsFor({});
    expect(errors.map((e) => e.field)).toEqual(['title', 'status', 'dueAt']);
  });

  it('reports a non-object body', () => {
    expect(errorsFor('hello')).toEqual([
      expect.objectContaining({ field: 'body', code: 'INVALID_FORMAT' }),
    ]);
  });
});
