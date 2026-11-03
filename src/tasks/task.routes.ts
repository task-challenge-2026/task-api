import { Router } from 'express';
import { z } from 'zod';
import { notFound, validationFailed } from '../errors/app-error';
import { toFieldErrors } from '../errors/validation';
import {
  deleteTask,
  findTaskById,
  insertTask,
  listTasks,
  updateTaskStatus,
} from './task.repository';
import { createTaskSchema, listTasksQuerySchema, updateTaskStatusSchema } from './task.schema';

export const taskRouter = Router();

const isUuid = (value: string) => z.uuid().safeParse(value).success;

taskRouter.post('/', async (req, res) => {
  const result = createTaskSchema.safeParse(req.body);
  if (!result.success) {
    throw validationFailed(toFieldErrors(result.error, req.body));
  }

  const task = await insertTask(result.data);
  res.status(201).location(`${req.baseUrl}/${task.id}`).json(task);
});

taskRouter.get('/', async (req, res) => {
  const result = listTasksQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw validationFailed(toFieldErrors(result.error, req.query));
  }

  const tasks = await listTasks(result.data);
  res.json({ tasks });
});

taskRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) throw notFound();

  const task = await findTaskById(id);
  if (!task) throw notFound();

  res.json(task);
});

taskRouter.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) throw notFound();

  const result = updateTaskStatusSchema.safeParse(req.body);
  if (!result.success) {
    throw validationFailed(toFieldErrors(result.error, req.body));
  }

  const task = await updateTaskStatus(id, result.data.status);
  if (!task) throw notFound();

  res.json(task);
});

taskRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) throw notFound();

  const deleted = await deleteTask(id);
  if (!deleted) throw notFound();

  res.status(204).end();
});
