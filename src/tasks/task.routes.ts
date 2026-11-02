import { Router } from 'express';
import { validationFailed } from '../errors/app-error';
import { toFieldErrors } from '../errors/validation';
import { insertTask } from './task.repository';
import { createTaskSchema } from './task.schema';

export const taskRouter = Router();

taskRouter.post('/', async (req, res) => {
  const result = createTaskSchema.safeParse(req.body);
  if (!result.success) {
    throw validationFailed(toFieldErrors(result.error, req.body));
  }

  const task = await insertTask(result.data);
  res.status(201).location(`${req.baseUrl}/${task.id}`).json(task);
});
