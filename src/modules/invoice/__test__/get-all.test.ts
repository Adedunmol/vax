import { test } from 'tap'
import build from '../../../app'
import { faker } from '@faker-js/faker'
import { ImportMock } from 'ts-mock-imports'
import InvoiceService from '../invoice.service'

const userId = faker.number.int()
const authUser = { id: userId, email: faker.internet.email() }

test('✅ Should retrieve all invoices successfully', async (t) => {
  const fastify = build()

  const invoices = [
    {
      id: faker.number.int(),
      dueDate: faker.date.soon(),
      description: 'Invoice 1',
      createdBy: userId,
      createdFor: 1
    },
    {
      id: faker.number.int(),
      dueDate: faker.date.soon(),
      description: 'Invoice 2',
      createdBy: userId,
      createdFor: 2
    }
  ]

  const invoicesStub = ImportMock.mockFunction(InvoiceService, 'getAll', invoices)

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/api/v1/invoices/',
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 200)
  t.match(res.json(), {
    message: 'Invoices retrieved successfully',
    data: { invoices }
  })

  invoicesStub.restore()
  await fastify.close()
})

test('❌ Should return 404 if no invoices found for the user', async (t) => {
  const fastify = build()

  const invoicesStub = ImportMock.mockFunction(InvoiceService, 'getAll', [])

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/api/v1/invoices/',
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 404)
  t.match(res.json(), { message: 'No invoices found' })

  invoicesStub.restore()
  await fastify.close()
})

test('❌ Should return 500 if InvoiceService.getAll throws an error', async (t) => {
  const fastify = build()

  const invoicesStub = ImportMock.mockFunction(InvoiceService, 'getAll', Promise.reject(new Error('DB Error')))

  fastify.decorateRequest('user', null)
  fastify.addHook('preHandler', (req, _, done) => {
    req.user = authUser
    done()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/api/v1/invoices/',
    headers: { Authorization: 'Bearer mock-token' }
  })

  t.equal(res.statusCode, 500)
  t.match(res.json(), { message: /DB Error/ })

  invoicesStub.restore()
  await fastify.close()
})
