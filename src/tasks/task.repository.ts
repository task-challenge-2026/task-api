import { db } from '../db/knex';
import type { Status } from './statuses';
import type { CreateTaskInput } from './task.schema';

interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: Status;
  due_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

export function toTask(row: TaskRow, now: Date = new Date()): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueAt: row.due_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    isOverdue: row.status !== 'DONE' && row.due_at < now,
  };
}

export async function insertTask(input: CreateTaskInput): Promise<Task> {
  const [row] = await db<TaskRow>('tasks')
    .insert({
      title: input.title,
      description: input.description,
      status: input.status,
      due_at: new Date(input.dueAt),
    })
    .returning('*');

  return toTask(row);
}
