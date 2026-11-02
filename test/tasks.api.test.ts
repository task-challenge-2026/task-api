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
