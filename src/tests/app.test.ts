import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import build from '../app';
// import redis from '../queues';

// Ensure test mode
process.env.NODE_ENV = 'test';

let app: any;

// Mock emailQueue to avoid real Redis calls
// import { emailQueue } from '../queues/email/producer';

// emailQueue.add = async () => Promise.resolve({});

// Setup Fastify before tests
before(async () => {
  app = build();
  await app.ready();
});

// Cleanup after tests
// after(async () => {
//   await redis.quit();
// });

test('GET /healthcheck should return 200', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/healthcheck',
  });

  assert.strictEqual(response.statusCode, 200);
});
