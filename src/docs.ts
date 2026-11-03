import { readFileSync } from 'fs';
import path from 'path';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';

export const openApiSpec = parse(
  readFileSync(path.join(__dirname, '../docs/openapi.yaml'), 'utf8'),
);

export const docsRouter = Router();
docsRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});
docsRouter.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec));
