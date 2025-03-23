import { test } from 'tap';
import build from '../app';

// Ensure test mode
process.env.NODE_ENV = 'test';

test('GET /healthcheck should return 200', async (t) => {
  const app = build()

  const response = await app.inject({
    method: 'GET',
    url: '/healthcheck',
  });

  t.equal(response.statusCode, 200);
});
