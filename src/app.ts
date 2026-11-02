import express from 'express';
import { errorHandler, routeNotFound } from './errors/error-handler';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(routeNotFound);
  app.use(errorHandler);

  return app;
}
