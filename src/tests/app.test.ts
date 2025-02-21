import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import build from '../app';
// import redis from '../queues';

// Ensure test mode
process.env.NODE_ENV = 'test';

let app: any;

// Setup Fastify before tests
before(async () => {
  app = build();
  await app.ready();
});


test('GET /healthcheck should return 200', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/healthcheck',
  });

  assert.strictEqual(response.statusCode, 200);
});
