import { db } from '../src/db/knex';
import { insertTask, toTask } from '../src/tasks/task.repository';

const inOneDay = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

afterAll(async () => {
  await db.destroy();
});

describe('toTask', () => {
  const row = {
    id: '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90',
    title: 'Review case bundle',
    description: '',
    status: 'TODO' as const,
    due_at: new Date('2026-11-10T09:00:00Z'),
    created_at: new Date('2026-11-01T09:00:00Z'),
    updated_at: new Date('2026-11-01T09:00:00Z'),
  };

  it('converts database columns to camelCase API fields', () => {
    expect(toTask(row, new Date('2026-11-05T09:00:00Z'))).toEqual({
      id: row.id,
      title: 'Review case bundle',
      description: '',
      status: 'TODO',
      dueAt: '2026-11-10T09:00:00.000Z',
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: '2026-11-01T09:00:00.000Z',
      isOverdue: false,
    });
  });

  it('marks a task overdue when the due date has passed and it is not done', () => {
    expect(toTask(row, new Date('2026-11-11T09:00:00Z')).isOverdue).toBe(true);
  });

  it('never marks a done task as overdue', () => {
    expect(toTask({ ...row, status: 'DONE' }, new Date('2026-11-11T09:00:00Z')).isOverdue).toBe(
      false,
    );
  });
});

describe('insertTask', () => {
  beforeEach(async () => {
    await db('tasks').truncate();
  });

  it('saves a task and returns it with generated fields', async () => {
    const dueAt = inOneDay();
    const task = await insertTask({ title: 'Review case bundle', status: 'TODO', dueAt });

    expect(task).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      title: 'Review case bundle',
      description: '',
      status: 'TODO',
      dueAt: new Date(dueAt).toISOString(),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      isOverdue: false,
    });
  });

  it('stores the task in the database', async () => {
    const task = await insertTask({
      title: 'Prepare hearing',
      status: 'IN_PROGRESS',
      dueAt: inOneDay(),
    });

    const rows = await db('tasks').where({ id: task.id });
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Prepare hearing');
  });
});
