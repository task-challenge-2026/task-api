import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('error handling', () => {
  it('returns ROUTE_NOT_FOUND for an unknown URL', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'ROUTE_NOT_FOUND', message: 'No route for GET /does-not-exist' },
    });
  });

  it('returns MALFORMED_JSON for an invalid JSON body', async () => {
    const res = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{"title": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MALFORMED_JSON');
  });

  it('returns PAYLOAD_TOO_LARGE for an oversized body', async () => {
    const res = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ text: 'x'.repeat(200_000) }));

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
