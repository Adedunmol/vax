import { test, TestContext } from 'node:test'
import build from '../app'

test('requests the "/healthcheck" route', async (t: TestContext) => {
  t.plan(1)
  const app = build()

  const response = await app.inject({
    method: 'GET',
    url: '/healthcheck'
  })
  
  t.assert.strictEqual(response.statusCode, 200, 'returns a status code of 200')
})
