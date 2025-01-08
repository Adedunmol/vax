// import { test, TestContext } from 'node:test'
// import build from '../app'

// test('requests the "/" route', async (t: TestContext) => {
//   t.plan(1)
//   const app = build()

//   const response = await app.inject({
//     method: 'GET',
//     url: '/healthcheck'
//   })
  
//   t.assert.strictEqual(response.statusCode, 200, 'returns a status code of 200')
// })

import buildServer from '../app'

describe('application test', () => {
    const app = buildServer()

    // beforeAll(async () => await app.ready())
    // afterAll(() => app.close())

    it('GET `/` route', async () => {
        const app = buildServer()

        const response = await app.inject({
        method: 'GET',
        url: '/healthcheck'
        })
    expect(response.statusCode).toBe(200)

        expect(response.body).toEqual({ message: 'OK' })
    })
})