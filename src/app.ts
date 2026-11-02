import express from 'express';
import { errorHandler, routeNotFound } from './errors/error-handler';
import { taskRouter } from './tasks/task.routes';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/v1/tasks', taskRouter);

  app.use(routeNotFound);
  app.use(errorHandler);

  return app;
}
