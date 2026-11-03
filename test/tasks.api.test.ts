import { randomUUID } from 'crypto';
import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db/knex';

const app = createApp();
const inOneDay = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

beforeEach(async () => {
  await db('tasks').truncate();
});

afterAll(async () => {
  await db.destroy();
});

describe('POST /api/v1/tasks', () => {
  it('creates a task and returns 201 with the task and its location', async () => {
    const dueAt = inOneDay();
    const res = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Review case bundle', status: 'TODO', dueAt });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      title: 'Review case bundle',
      description: '',
      status: 'TODO',
      dueAt: new Date(dueAt).toISOString(),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      isOverdue: false,
    });
    expect(res.headers.location).toBe(`/api/v1/tasks/${res.body.id}`);
  });

  it('saves the task to the database', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Prepare hearing', status: 'IN_PROGRESS', dueAt: inOneDay() });

    const rows = await db('tasks').where({ id: res.body.id });
    expect(rows).toHaveLength(1);
  });

  it('returns 422 with field errors for invalid input', async () => {
    const res = await request(app).post('/api/v1/tasks').send({ title: '', status: 'CLOSED' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ field: 'title', code: 'REQUIRED' }),
      expect.objectContaining({ field: 'status', code: 'INVALID_VALUE' }),
      expect.objectContaining({ field: 'dueAt', code: 'REQUIRED' }),
    ]);
  });

  it('does not save anything when validation fails', async () => {
    await request(app).post('/api/v1/tasks').send({ title: '' });

    const rows = await db('tasks');
    expect(rows).toHaveLength(0);
  });

  it('returns 422 when the body is missing', async () => {
    const res = await request(app).post('/api/v1/tasks');

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ field: 'body', code: 'INVALID_FORMAT' }),
    ]);
  });
});

describe('GET /api/v1/tasks/:id', () => {
  it('returns the task when it exists', async () => {
    const created = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Review case bundle', status: 'TODO', dueAt: inOneDay() });

    const res = await request(app).get(`/api/v1/tasks/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it('returns 404 NOT_FOUND when no task has that id', async () => {
    const res = await request(app).get(`/api/v1/tasks/${randomUUID()}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
  });

  it('returns 404 NOT_FOUND for an id that is not a valid UUID', async () => {
    const res = await request(app).get('/api/v1/tasks/not-a-uuid');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/v1/tasks', () => {
  const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  async function createTask(title: string, status: string, dueAt: string) {
    const res = await request(app).post('/api/v1/tasks').send({ title, status, dueAt });
    return res.body;
  }

  const titles = (res: request.Response) => res.body.tasks.map((t: { title: string }) => t.title);

  beforeEach(async () => {
    await createTask('Done soon', 'DONE', inDays(1));
    await createTask('Todo later', 'TODO', inDays(5));
    await createTask('On hold', 'ON_HOLD', inDays(3));
    await createTask('In progress', 'IN_PROGRESS', inDays(2));
    await createTask('Todo soon', 'TODO', inDays(4));
  });

  it('returns all tasks wrapped in a tasks array, soonest due first by default', async () => {
    const res = await request(app).get('/api/v1/tasks');

    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(['Done soon', 'In progress', 'On hold', 'Todo soon', 'Todo later']);
  });

  it('sorts by due date descending', async () => {
    const res = await request(app).get('/api/v1/tasks?sort=dueAt&order=desc');

    expect(titles(res)).toEqual(['Todo later', 'Todo soon', 'On hold', 'In progress', 'Done soon']);
  });

  it('sorts by status in workflow order, then by due date', async () => {
    const res = await request(app).get('/api/v1/tasks?sort=status');

    expect(titles(res)).toEqual(['Todo soon', 'Todo later', 'In progress', 'On hold', 'Done soon']);
  });

  it('sorts by created date', async () => {
    const res = await request(app).get('/api/v1/tasks?sort=createdAt');

    expect(titles(res)).toEqual(['Done soon', 'Todo later', 'On hold', 'In progress', 'Todo soon']);
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/v1/tasks?status=TODO');

    expect(titles(res)).toEqual(['Todo soon', 'Todo later']);
  });

  it('returns an empty list when nothing matches', async () => {
    await db('tasks').truncate();
    const res = await request(app).get('/api/v1/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tasks: [] });
  });

  it.each([
    ['an unknown sort field', 'sort=title', 'sort', 'INVALID_VALUE'],
    ['an unknown order', 'order=sideways', 'order', 'INVALID_VALUE'],
    ['an unknown status', 'status=CLOSED', 'status', 'INVALID_VALUE'],
    ['an unknown query parameter', 'colour=red', 'colour', 'UNKNOWN_FIELD'],
  ])('returns 422 for %s', async (_name, query, field, code) => {
    const res = await request(app).get(`/api/v1/tasks?${query}`);

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([expect.objectContaining({ field, code })]);
  });
});

describe('PATCH /api/v1/tasks/:id/status', () => {
  async function createTask() {
    const res = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Review case bundle', status: 'TODO', dueAt: inOneDay() });
    return res.body;
  }

  it('updates the status and returns the updated task', async () => {
    const task = await createTask();

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.id}/status`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...task, status: 'IN_PROGRESS', updatedAt: expect.any(String) });
  });

  it('moves updatedAt forward via the database trigger', async () => {
    const task = await createTask();

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.id}/status`)
      .send({ status: 'DONE' });

    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(
      new Date(task.createdAt).getTime(),
    );
  });

  it('can update an overdue task, which stops being overdue once done', async () => {
    const [row] = await db('tasks')
      .insert({ title: 'Overdue task', status: 'TODO', due_at: new Date('2020-01-01T09:00:00Z') })
      .returning('id');

    const before = await request(app).get(`/api/v1/tasks/${row.id}`);
    expect(before.body.isOverdue).toBe(true);

    const res = await request(app).patch(`/api/v1/tasks/${row.id}/status`).send({ status: 'DONE' });

    expect(res.status).toBe(200);
    expect(res.body.isOverdue).toBe(false);
  });

  it.each([
    ['a missing status', {}, 'status', 'REQUIRED'],
    ['an unknown status', { status: 'CLOSED' }, 'status', 'INVALID_VALUE'],
    ['any other field', { status: 'DONE', title: 'New title' }, 'title', 'UNKNOWN_FIELD'],
  ])('returns 422 for %s', async (_name, body, field, code) => {
    const task = await createTask();

    const res = await request(app).patch(`/api/v1/tasks/${task.id}/status`).send(body);

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([expect.objectContaining({ field, code })]);
  });

  it('does not change the task when validation fails', async () => {
    const task = await createTask();

    await request(app).patch(`/api/v1/tasks/${task.id}/status`).send({ status: 'CLOSED' });

    const res = await request(app).get(`/api/v1/tasks/${task.id}`);
    expect(res.body.status).toBe('TODO');
  });

  it.each([
    ['an unknown id', () => randomUUID()],
    ['an invalid id', () => 'not-a-uuid'],
  ])('returns 404 NOT_FOUND for %s', async (_name, id) => {
    const res = await request(app).patch(`/api/v1/tasks/${id()}/status`).send({ status: 'DONE' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('DELETE /api/v1/tasks/:id', () => {
  it('deletes the task and returns 204 with no body', async () => {
    const created = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Review case bundle', status: 'TODO', dueAt: inOneDay() });

    const res = await request(app).delete(`/api/v1/tasks/${created.body.id}`);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    const after = await request(app).get(`/api/v1/tasks/${created.body.id}`);
    expect(after.status).toBe(404);
  });

  it.each([
    ['an unknown id', () => randomUUID()],
    ['an invalid id', () => 'not-a-uuid'],
  ])('returns 404 NOT_FOUND for %s', async (_name, id) => {
    const res = await request(app).delete(`/api/v1/tasks/${id()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
