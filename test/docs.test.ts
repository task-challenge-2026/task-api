import request from 'supertest';
import { createApp } from '../src/app';
import { openApiSpec } from '../src/docs';
import { taskRouter } from '../src/tasks/task.routes';

const app = createApp();

function documentedOperations(): string[] {
  return Object.entries(openApiSpec.paths as Record<string, object>).flatMap(([path, item]) =>
    Object.keys(item)
      .filter((key) => ['get', 'post', 'put', 'patch', 'delete'].includes(key))
      .map((method) => `${method.toUpperCase()} ${path}`),
  );
}

function implementedTaskOperations(): string[] {
  return taskRouter.stack
    .filter((layer) => layer.route)
    .flatMap((layer) => {
      const route = layer.route as unknown as { path: string; methods: Record<string, boolean> };
      const path = `/api/v1/tasks${route.path === '/' ? '' : route.path}`.replace(
        /:(\w+)/g,
        '{$1}',
      );
      return Object.keys(route.methods).map((method) => `${method.toUpperCase()} ${path}`);
    });
}

describe('API documentation', () => {
  it('documents every task route that exists in the code', () => {
    expect(documentedOperations()).toEqual(expect.arrayContaining(implementedTaskOperations()));
  });

  it('does not document task routes that do not exist', () => {
    const documentedTaskOps = documentedOperations().filter((op) => op.includes('/api/v1/tasks'));
    expect(implementedTaskOperations()).toEqual(expect.arrayContaining(documentedTaskOps));
  });

  it('serves the OpenAPI spec as JSON', async () => {
    const res = await request(app).get('/api-docs/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
  });

  it('serves the Swagger UI page', async () => {
    const res = await request(app).get('/api-docs/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
